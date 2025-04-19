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
  // Format members array cleanly
  const formattedMembers = members.map((m) => {
    const id = m.id?.trim() || m.email?.trim() || "";
    return {
      id,
      name: m.name?.trim() || "",
      email: m.email?.trim() || "",
      isAppUser: m.isAppUser || false,
    };
  });

  // Collect unique member identifiers
  const memberIds = formattedMembers.map((m) => m.id).filter(Boolean);

  // Add group document
  const docRef = await addDoc(collection(db, "groups"), {
    name: groupName,
    createdBy,
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
 */
export const fetchUserGroups = async (uidOrEmail) => {
  if (!uidOrEmail) return [];

  const q = query(
    collection(db, "groups"),
    where("memberIds", "array-contains", uidOrEmail)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
