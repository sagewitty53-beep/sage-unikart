import { db } from "./src/firebase.js";
import { collection, addDoc } from "firebase/firestore";

async function run() {
  try {
    const docRef = await addDoc(collection(db, "items"), {
      name: "Test Item",
      price: 1000,
      seller: "Sage",
    });

    console.log("SUCCESS ID:", docRef.id);
  } catch (err) {
    console.log("ERROR:", err);
  }
}

run();