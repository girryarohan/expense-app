import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import AddFriendForm from "./AddFriendForm";

const FriendList = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchFriends = async () => {
    if (!currentUser?.uid) return;
    const snap = await getDocs(
      collection(db, `users/${currentUser.uid}/friends`)
    );
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Sort alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));
    setFriends(list);
  };

  useEffect(() => {
    fetchFriends();
  }, [currentUser]);

  return (
    <div className="bg-gray-800 p-6 text-white rounded-xl shadow-md max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">👥 Your Friends</h2>

      {friends.length === 0 ? (
        <p className="text-gray-400">You don’t have any friends yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-2">{friends.length} total</p>
          <ul className="space-y-2 text-sm">
            {friends.map((f) => (
              <li key={f.id} className="border-b border-gray-600 pb-2">
                <span className="font-medium">{f.name || "Unnamed"}</span>{" "}
                <span className="text-gray-400 text-xs">
                  ({f.email || "no-email"})
                </span>{" "}
                {f.isAppUser && (
                  <span className="text-green-400 text-xs">✔ In App</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        className="mt-4 text-sm text-blue-400 hover:underline"
        onClick={() => setShowForm((prev) => !prev)}
      >
        {showForm ? "Cancel" : "+ Add Friend"}
      </button>

      {showForm && <AddFriendForm onAdded={fetchFriends} />}
    </div>
  );
};

export default FriendList;
