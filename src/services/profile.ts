import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { UserProfile } from "../types";

// Save profile to both Firebase and localStorage
export const saveProfile = async (
  userId: string,
  profile: UserProfile
): Promise<void> => {
  try {
    // Save to localStorage for offline/fast access
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));

    // Save to Firebase for cross-device sync
    const profileRef = doc(db, "profiles", userId);
    await setDoc(profileRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    // Still saved to localStorage, so user can continue
  }
};

// Load profile - try Firebase first, fall back to localStorage
export const loadProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    // Try Firebase first
    const profileRef = doc(db, "profiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const firebaseProfile = profileSnap.data() as UserProfile;
      // Update localStorage with Firebase data
      localStorage.setItem(
        `profile_${userId}`,
        JSON.stringify(firebaseProfile)
      );
      return firebaseProfile;
    }

    // Fall back to localStorage
    const localProfile = localStorage.getItem(`profile_${userId}`);
    if (localProfile) {
      const parsed = JSON.parse(localProfile) as UserProfile;
      // Sync localStorage to Firebase
      await saveProfile(userId, parsed);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error("Error loading profile:", error);
    // Fall back to localStorage on error
    const localProfile = localStorage.getItem(`profile_${userId}`);
    return localProfile ? JSON.parse(localProfile) : null;
  }
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (
  userId: string
): Promise<boolean> => {
  const profile = await loadProfile(userId);
  return profile?.onboardingComplete === true;
};

// Delete profile from both Firebase and localStorage
export const deleteProfile = async (userId: string): Promise<void> => {
  try {
    localStorage.removeItem(`profile_${userId}`);
    const profileRef = doc(db, "profiles", userId);
    await setDoc(profileRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
  }
};
