import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import AddFriendForm from "./AddFriendForm";

const FriendList = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      const snap = await getDocs(
        collection(db, `users/${currentUser.uid}/friends`)
      );
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setFriends(list);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchFriends();
    }
  }, [currentUser?.uid]);

  return (
    <div>
      {loading ? (
        <p className="text-gray-400 text-center">Loading friends...</p>
      ) : friends.length === 0 ? (
        <p className="text-gray-400 text-center">
          You don’t have any friends yet.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4 text-center">
            {friends.length} total friends
          </p>

          <div className="grid gap-4">
            {friends.map((f) => (
              <div
                key={f.id}
                className="bg-gray-700 hover:bg-gray-600 transition rounded-xl p-4 flex justify-between items-center shadow-sm"
              >
                <div>
                  <p className="font-semibold text-white">
                    {f.name || "Unnamed"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {f.email || "no-email"}
                  </p>
                </div>
                {f.isAppUser && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                    ✔ In App
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition text-sm"
        >
          {showForm ? "Cancel" : "+ Add Friend"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6">
          <AddFriendForm onAdded={fetchFriends} />
        </div>
      )}
    </div>
  );
};

export default FriendList;
