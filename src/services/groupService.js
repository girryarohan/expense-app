import { db } from "../config/firebase";
import {
  addDoc,
  serverTimestamp,
  query,
  collection,
  getDocs,
  where,
} from "firebase/firestore";

/**
 * Create a new group in Firestore
 */
export const createGroupInFirestore = async ({
  groupName,
  members,
  simplify,
  createdBy,
}) => {
  // Normalize members: use email as id, store uid separately if available
  const formattedMembers = members.map((m) => {
    const email = m.email?.trim() || "";
    return {
      id: email, // Use email as ID always
      name: m.name?.trim() || "",
      email,
      uid: m.uid || null, // Optional
      isAppUser: m.isAppUser || false,
    };
  });

  const memberIds = formattedMembers.map((m) => m.id); // Only email-based IDs

  const docRef = await addDoc(collection(db, "groups"), {
    name: groupName,
    createdBy, // can be UID of creator
    members: formattedMembers,
    memberIds,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    simplified: simplify,
  });

  return docRef.id;
};

/**
 * Fetch all groups where the user is a member
 * Lookup is done via email (always), not UID.
 */
export const fetchUserGroups = async (email) => {
  if (!email) return [];

  const q = query(
    collection(db, "groups"),
    where("memberIds", "array-contains", email)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
