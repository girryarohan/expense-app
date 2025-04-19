import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const checkFriendInApp = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const user = snapshot.docs[0].data();
    return {
      id: user.uid,
      name: user.name,
      email: user.email,
      isAppUser: true,
    };
  }
  return null;
};

export const checkFriendInFriendList = async (ownerUid, email) => {
  const q = query(
    collection(db, `users/${ownerUid}/friends`),
    where("email", "==", email)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty ? snapshot.docs[0].data() : null;
};

export const addFriendToList = async (ownerUid, friend) => {
  const docRef = doc(db, `users/${ownerUid}/friends/${friend.email}`);
  await setDoc(
    docRef,
    {
      ...friend,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};
