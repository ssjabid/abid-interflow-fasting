# Firebase Firestore Rules for Leaderboard

Add these rules to your Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing fasts collection rules
    match /fasts/{fastId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.odId;
      allow create: if request.auth != null;
    }

    // Leaderboard collection rules
    match /leaderboard/{odId} {
      // Anyone can read public entries
      allow read: if resource.data.isPublic == true;

      // Users can only write their own entry
      allow write: if request.auth != null && request.auth.uid == odId;

      // Users can read their own entry even if private
      allow read: if request.auth != null && request.auth.uid == odId;
    }
  }
}
```

## Required Indexes

You'll also need to create a composite index in Firebase Console:

1. Go to Firebase Console > Firestore > Indexes
2. Create a new composite index:
   - Collection: `leaderboard`
   - Fields:
     - `isPublic` (Ascending)
     - `totalHours` (Descending)
   - Query scope: Collection

Repeat for each leaderboard category:

- `isPublic` + `totalFasts` (Desc)
- `isPublic` + `currentStreak` (Desc)
- `isPublic` + `longestFast` (Desc)

## Testing

After deploying rules:

1. Go to the "Ranks" tab in your app
2. Click "Join Now" to opt into the leaderboard
3. Enter a display name
4. Your stats will appear in the rankings
