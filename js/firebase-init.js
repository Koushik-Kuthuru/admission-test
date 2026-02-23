// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCViydTe9HJQDISYTmtT3ry_QIJFu7XQvE",
    authDomain: "admissiontest-idpskalaburagi.firebaseapp.com",
    projectId: "admissiontest-idpskalaburagi",
    storageBucket: "admissiontest-idpskalaburagi.firebasestorage.app",
    messagingSenderId: "661383001075",
    appId: "1:661383001075:web:1a17c011be65ec92d2d886",
    measurementId: "G-VTSZP70FQF"
};

// Initialize Firebase
window.db = undefined;
window.analytics = undefined;

try {
    // Check if Firebase SDK is loaded (Compat version)
    if (typeof firebase !== 'undefined') {
        const app = firebase.initializeApp(firebaseConfig);
        
        // Initialize Firestore
        if (firebase.firestore) {
            window.db = firebase.firestore();
            console.log("Firebase Firestore initialized successfully");
        }
        
        // Initialize Analytics if available
        if (firebase.analytics) {
            window.analytics = firebase.analytics();
            console.log("Firebase Analytics initialized");
        }
    } else {
        console.error("Firebase SDK not loaded. Make sure to include the script tags in your HTML.");
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}
