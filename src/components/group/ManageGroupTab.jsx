import React, { useState } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext"; // Assuming you use global toast

const ManageGroupTab = ({ group }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [addingEmail, setAddingEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isOwner = group.createdBy === currentUser.uid;

  const handleAddMember = async () => {
    if (!addingEmail.trim()) return;

    setLoading(true);
    try {
      const updatedMembers = [
        ...group.members,
        {
          id: addingEmail.trim(),
          name: addingEmail.trim().split("@")[0],
          email: addingEmail.trim(),
          isAppUser: false,
        },
      ];
      await updateDoc(doc(db, "groups", group.id), { members: updatedMembers });

      showToast("Member added! 🚀");
      window.location.reload();
    } catch (err) {
      console.error("Error adding member:", err);
      showToast("Error adding member", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    try {
      const updatedMembers = group.members.filter((m) => m.id !== memberId);
      await updateDoc(doc(db, "groups", group.id), { members: updatedMembers });

      showToast("Member removed ✅");
      window.location.reload();
    } catch (err) {
      console.error("Error removing member:", err);
      showToast("Error removing member", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    setLoading(true);
    try {
      const updatedMembers = group.members.filter(
        (m) => m.id !== currentUser.uid
      );
      await updateDoc(doc(db, "groups", group.id), { members: updatedMembers });

      showToast("You left the group 🚶‍♂️");
      window.location.href = "/";
    } catch (err) {
      console.error("Error leaving group:", err);
      showToast("Error leaving group", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("⚡ WARNING: Deleting group permanently. Continue?"))
      return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "groups", group.id));
      showToast("Group deleted 🗑️");
      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting group:", err);
      showToast("Error deleting group", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Members List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          👥 Current Members
        </h3>
        <ul className="space-y-2">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700"
            >
              <div>
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>
              {isOwner && currentUser.uid !== m.id && (
                <button
                  onClick={() => handleDeleteMember(m.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Member */}
      {isOwner && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">➕ Add Member</h3>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter member email"
              className="flex-1 px-4 py-2 bg-gray-900 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              value={addingEmail}
              onChange={(e) => setAddingEmail(e.target.value)}
            />
            <button
              onClick={handleAddMember}
              disabled={loading || !addingEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-8 border-t border-gray-700 space-y-4">
        <h3 className="text-lg font-semibold text-red-400">⚡ Danger Zone</h3>

        <button
          onClick={handleLeaveGroup}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl transition"
        >
          🚶‍♂️ Leave Group
        </button>

        {isOwner && (
          <button
            onClick={handleDeleteGroup}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition"
          >
            🗑️ Delete Group
          </button>
        )}
      </div>
    </div>
  );
};

export default ManageGroupTab;
