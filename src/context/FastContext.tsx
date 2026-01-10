import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Fast } from "../types";
import { useAuth } from "./AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { PROTOCOLS } from "../types";

interface FastContextType {
  fasts: Fast[];
  activeFast: Fast | null;
  startFast: (fast: Fast) => Promise<void>;
  endFast: (
    fastId: string,
    mood?: number,
    energyLevel?: number
  ) => Promise<void>;
  deleteFast: (fastId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  loading: boolean;
}

const FastContext = createContext<FastContextType | null>(null);

export function useFasts() {
  const context = useContext(FastContext);
  if (!context) {
    throw new Error("useFasts must be used within FastProvider");
  }
  return context;
}

export function FastProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [activeFast, setActiveFast] = useState<Fast | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-complete fasts that have exceeded their protocol duration
  const autoCompleteFast = async (fast: Fast) => {
    const protocol = PROTOCOLS.find((p) => p.id === fast.protocol);
    if (!protocol || protocol.id === "custom") return false; // Don't auto-complete custom fasts

    const now = new Date();
    const start = new Date(fast.startTime);
    const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
    const targetMinutes = protocol.fastingHours * 60;

    // Auto-complete if exceeded target by more than 2 hours (grace period)
    if (elapsedMinutes > targetMinutes + 120) {
      try {
        const fastRef = doc(db, "fasts", fast.id);
        await updateDoc(fastRef, {
          endTime: Timestamp.fromDate(
            new Date(start.getTime() + targetMinutes * 60 * 1000)
          ),
          duration: targetMinutes,
          status: "completed",
        });
        console.log(
          `Auto-completed fast ${fast.id} (exceeded ${
            protocol.name
          } by ${Math.round((elapsedMinutes - targetMinutes) / 60)}h)`
        );
        return true;
      } catch (e) {
        console.error("Failed to auto-complete fast:", e);
      }
    }
    return false;
  };

  // Cleanup multiple active fasts - keep only the most recent
  const cleanupMultipleActiveFasts = async (activeFasts: Fast[]) => {
    if (activeFasts.length <= 1) return activeFasts[0] || null;

    console.warn(`Found ${activeFasts.length} active fasts - cleaning up...`);

    // Sort by start time, most recent first
    const sorted = [...activeFasts].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    const [mostRecent, ...older] = sorted;

    // End older fasts
    for (const oldFast of older) {
      try {
        const now = new Date();
        const start = new Date(oldFast.startTime);
        const duration = Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60)
        );

        const fastRef = doc(db, "fasts", oldFast.id);
        await updateDoc(fastRef, {
          endTime: serverTimestamp(),
          duration,
          status: "completed",
        });
        console.log(`Ended duplicate active fast: ${oldFast.id}`);
      } catch (e) {
        console.error(`Failed to end fast ${oldFast.id}:`, e);
      }
    }

    return mostRecent;
  };

  useEffect(() => {
    if (!currentUser) {
      setFasts([]);
      setActiveFast(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "fasts"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fastsData: Fast[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        let startTime: Date;
        let endTime: Date | null = null;

        if (data.startTime instanceof Timestamp) {
          startTime = data.startTime.toDate();
        } else if (data.startTime) {
          startTime = new Date(data.startTime);
        } else {
          startTime = new Date();
        }

        if (data.endTime) {
          if (data.endTime instanceof Timestamp) {
            endTime = data.endTime.toDate();
          } else {
            endTime = new Date(data.endTime);
          }
        }

        if (startTime.getFullYear() > 2000) {
          fastsData.push({
            id: docSnapshot.id,
            startTime,
            endTime,
            duration: data.duration || 0,
            status: data.status,
            notes: data.notes,
            protocol: data.protocol,
            mood: data.mood,
            energyLevel: data.energyLevel,
          });
        }
      });

      setFasts(fastsData);

      // Handle active fasts
      const activeFasts = fastsData.filter((f) => f.status === "active");

      if (activeFasts.length === 0) {
        setActiveFast(null);
      } else if (activeFasts.length === 1) {
        // Check if should auto-complete
        autoCompleteFast(activeFasts[0]).then((completed) => {
          if (!completed) {
            setActiveFast(activeFasts[0]);
          }
        });
      } else {
        // Multiple active - cleanup
        cleanupMultipleActiveFasts(activeFasts).then((kept) => {
          if (kept) {
            autoCompleteFast(kept).then((completed) => {
              if (!completed) {
                setActiveFast(kept);
              }
            });
          }
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const startFast = async (fast: Fast) => {
    if (!currentUser) return;

    // Check if there's already an active fast
    if (activeFast) {
      alert("You already have an active fast. Please end it first.");
      return;
    }

    try {
      await addDoc(collection(db, "fasts"), {
        userId: currentUser.uid,
        startTime: serverTimestamp(),
        endTime: null,
        duration: 0,
        status: "active",
        notes: fast.notes || null,
        protocol: fast.protocol || null,
      });
    } catch (error) {
      console.error("Error starting fast:", error);
      alert("Failed to start fast. Please try again.");
    }
  };

  const endFast = async (
    fastId: string,
    mood?: number,
    energyLevel?: number
  ) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    try {
      const fast = fasts.find((f) => f.id === fastId);
      if (!fast) {
        console.error("Fast not found:", fastId);
        return;
      }

      const now = new Date();
      const start = new Date(fast.startTime);
      const duration = Math.floor(
        (now.getTime() - start.getTime()) / (1000 * 60)
      );

      const fastRef = doc(db, "fasts", fastId);
      await updateDoc(fastRef, {
        endTime: serverTimestamp(),
        duration,
        status: "completed",
        mood: mood || null,
        energyLevel: energyLevel || null,
      });

      console.log("Fast ended successfully:", fastId);
    } catch (error: any) {
      console.error("Error ending fast:", error);
      alert(`Failed to end fast: ${error?.message || "Unknown error"}`);
    }
  };

  const deleteFast = async (fastId: string) => {
    if (!currentUser) return;

    try {
      const fastRef = doc(db, "fasts", fastId);
      await deleteDoc(fastRef);
    } catch (error) {
      console.error("Error deleting fast:", error);
      alert("Failed to delete fast. Please try again.");
    }
  };

  // Clear all user data from Firebase
  const clearAllData = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "fasts"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.docs.length} fasts`);

      // Clear local profile too
      localStorage.removeItem(`profile_${currentUser.uid}`);

      // Reset state
      setFasts([]);
      setActiveFast(null);

      alert("All data cleared successfully!");
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Failed to clear data. Please try again.");
    }
  };

  const value = {
    fasts,
    activeFast,
    startFast,
    endFast,
    deleteFast,
    clearAllData,
    loading,
  };

  return <FastContext.Provider value={value}>{children}</FastContext.Provider>;
}
