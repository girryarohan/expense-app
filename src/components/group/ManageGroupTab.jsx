import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const ManageGroupTab = ({ group }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [addingEmail, setAddingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [simplifyDebts, setSimplifyDebts] = useState(group.simplified ?? true);

  const isOwner = group.createdBy === currentUser.uid;

  const handleAddMember = async () => {
    if (!addingEmail.trim()) return;

    setLoading(true);
    const email = addingEmail.trim().toLowerCase();
    const newMember = {
      id: email,
      name: email.split("@")[0],
      email,
      isAppUser: false,
    };

    try {
      const updatedMembers = [...group.members, newMember];
      const updatedIds = [...group.memberIds, newMember.id];

      await updateDoc(doc(db, "groups", group.id), {
        members: updatedMembers,
        memberIds: updatedIds,
      });

      showToast("Member added! 🚀");
      setAddingEmail("");
    } catch (err) {
      console.error("Error adding member:", err);
      showToast("Error adding member", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (memberId === group.createdBy) {
      showToast("Owner cannot be removed.", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    try {
      const updatedMembers = group.members.filter((m) => m.id !== memberId);
      const updatedIds = group.memberIds.filter((id) => id !== memberId);

      await updateDoc(doc(db, "groups", group.id), {
        members: updatedMembers,
        memberIds: updatedIds,
      });

      showToast("Member removed ✅");
    } catch (err) {
      console.error("Error removing member:", err);
      showToast("Error removing member", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (currentUser.uid === group.createdBy) {
      showToast("Owner cannot leave the group.", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to leave this group?")) return;

    setLoading(true);
    try {
      const updatedMembers = group.members.filter(
        (m) => m.id !== currentUser.uid
      );
      const updatedIds = group.memberIds.filter((id) => id !== currentUser.uid);

      await updateDoc(doc(db, "groups", group.id), {
        members: updatedMembers,
        memberIds: updatedIds,
      });

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

  const handleSimplifyChange = async (value) => {
    setSimplifyDebts(value);
    try {
      await updateDoc(doc(db, "groups", group.id), {
        simplified: value,
      });
      showToast(value ? "Debts will be simplified ✅" : "Simplify disabled ⚠️");
    } catch (err) {
      console.error("Error updating simplify debts:", err);
      showToast("Failed to update simplify option", "error");
    }
  };

  return (
    <div className="space-y-10">
      {/* Members List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          👥 Current Members
        </h3>
        <ul className="space-y-3">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center uppercase">
                  {m.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>

              {isOwner &&
                currentUser.uid !== m.id &&
                m.id !== group.createdBy && (
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

      {/* Simplify Toggle */}
      {isOwner && (
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-300 font-medium">
            Simplify Debts
          </label>
          <input
            type="checkbox"
            checked={simplifyDebts}
            onChange={(e) => handleSimplifyChange(e.target.checked)}
          />
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-700 space-y-4">
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
