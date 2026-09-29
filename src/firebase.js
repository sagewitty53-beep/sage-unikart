
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, disableNetwork, enableNetwork } from "firebase/firestore"; // Updated import
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYIRi9DTwgkqQuia2Prqgc7oI_2RJzJ3c",  authDomain: "sage-unikart.firebaseapp.com",
  projectId: "sage-unikart",
  storageBucket: "sage-unikart.appspot.com",
  messagingSenderId: "842614545603",
  appId: "1:842614545603:web:6dc3540673ee8555bd51ef"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings that prevent it from getting stuck offline
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
});

export const auth = getAuth(app);
export const storage = getStorage(app);
