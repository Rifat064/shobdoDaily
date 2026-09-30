import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Firebase configuration (apiKey is shared across Android/Web)
// NOTE: For full web auth, register a Web App in Firebase Console → Project Settings → Add App → Web
// The Android appId works for Firestore but Google Sign-in popup requires a registered web origin.
const firebaseConfig = {
    apiKey: "AIzaSyDw_qJpClhcnobSWkxUgn0KY3TiLCdW8Hc",
    authDomain: "shobdodaily.firebaseapp.com",
    projectId: "shobdodaily",
    storageBucket: "shobdodaily.firebasestorage.app",
    messagingSenderId: "607310167838",
    appId: "1:607310167838:android:dd0ebfa15c77ace447130f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ==========================================
// DATA PIPELINE (Firestore)
// ==========================================

/**
 * Fetch a specific daily card from Firestore by its date key (YYYY-MM-DD)
 */
export async function fetchCardFromFirebase(dateKey) {
    try {
        const cardsRef = collection(db, "cards");
        const q = query(cardsRef, where("publish_date", "==", dateKey), where("status", "==", "published"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error("Error fetching card from Firebase:", error);
        return null;
    }
}

/**
 * Sync local progress (learned, bookmarks) to Firestore for the authenticated user.
 */
export async function syncProgressToFirebase(userId, progressData) {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { progress: progressData }, { merge: true });
        console.log("Successfully synced progress to Firebase.");
    } catch (error) {
        console.error("Error syncing progress to Firebase:", error);
        throw error;
    }
}

// ==========================================
// AUTHENTICATION PIPELINE
// ==========================================

export async function loginWithGoogle() {
    try {
        // Try popup first (works on desktop browsers)
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        // If popup blocked (mobile), fall back to redirect
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn("Popup blocked, falling back to redirect...");
            await signInWithRedirect(auth, googleProvider);
            return null; // redirect will reload the page
        }
        throw error;
    }
}

// Handle redirect result on page load
getRedirectResult(auth).then(result => {
    if (result?.user) {
        console.log("Redirect login successful:", result.user.email);
    }
}).catch(e => console.warn("Redirect result check:", e));

export async function logoutUser() {
    await signOut(auth);
}

export function listenToAuth(callback) {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

