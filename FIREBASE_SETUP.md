# Firebase Setup Guide for IDPS Admission Portal

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and follow the steps.
3. Enable **Google Analytics** (optional).

## 2. Add a Web App
1. In your project dashboard, click the **Web icon (`</>`)**.
2. Register the app (e.g., "AdmissionTest").
3. Copy the `firebaseConfig` object (apiKey, authDomain, etc.).
4. Open `js/firebase-init.js` in this project and paste the config there.

## 3. Set up Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Click **Create Database**.
3. Choose a location (e.g., `asia-south1` for India).
4. Start in **Test mode** (or Production mode, we will update rules later).

## 4. Configure Security Rules
Go to the **Rules** tab in Firestore and paste the following rules. These rules allow students to save their registration and exam results, but prevent them from modifying the questions.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Questions Collection
    // Allow anyone to read questions (so the exam loads)
    // Only allow writes if you are an admin (for now, we disable writes)
    match /questions/{document=**} {
      allow read: if true;
      allow write: if false; 
    }

    // 2. Registrations Collection
    // Allow students to save their registration form
    match /registrations/{document=**} {
      allow create: if true;
      allow read, update, delete: if false; // Privacy: no one can read others' data
    }

    // 3. Exam Results Collection
    // Allow students to save their exam score
    match /exam_results/{document=**} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

## 5. Upload Questions
1. Open `upload_data.html` in your browser.
2. **Temporarily** change Firestore Rules to `allow write: if true;` for the `questions` path.
3. Click "Upload All Questions".
4. Once successful, change the Rules back to the secure version above.

## 6. Verify Data
- Go to the **Data** tab in Firestore.
- You should see three collections:
  - `questions`: Contains all the exam questions.
  - `registrations`: Will appear when students register.
  - `exam_results`: Will appear when students finish an exam.
