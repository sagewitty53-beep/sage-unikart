import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount)
    });

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const idToken = authorization.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.email !== "sagewitty53@gmail.com") {
      return res.status(403).json({
        error: "Admin access only"
      });
    }

    const { userId } = req.body || {};

    if (
      typeof userId !== "string" ||
      !userId.trim() ||
      userId === decoded.uid
    ) {
      return res.status(400).json({
        error: "Invalid user ID"
      });
    }

    await adminAuth.getUser(userId);

    await adminAuth.deleteUser(userId);

    await adminDb.collection("users").doc(userId).delete();

    return res.status(200).json({
      message: "User account terminated successfully"
    });
  } catch (error) {
    console.error("Account termination failed:", error.message);

    return res.status(500).json({
      error: "Account termination failed. Check server logs."
    });
  }
}
