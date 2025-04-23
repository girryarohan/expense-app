import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createGroupInFirestore } from "../services/groupService";
import {
  checkFriendInApp,
  checkFriendInFriendList,
  addFriendToList,
} from "../services/friendService";

function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([{ name: "", email: "" }]);
  const [simplify, setSimplify] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    const emailsSet = new Set();
    const memberPromises = members.map(async (m) => {
      const trimmedEmail = m.email?.trim().toLowerCase();
      const trimmedName = m.name?.trim();

      if (!trimmedEmail || !trimmedName || emailsSet.has(trimmedEmail))
        return null;
      if (trimmedEmail === currentUser.email.toLowerCase()) return null;

      emailsSet.add(trimmedEmail);

      let finalMember = {
        id: trimmedEmail, // Use email as ID
        name: trimmedName,
        email: trimmedEmail,
        isAppUser: false,
        uid: null,
      };

      try {
        const appUser = await checkFriendInApp(trimmedEmail);
        if (appUser) {
          finalMember = {
            ...finalMember,
            isAppUser: true,
            uid: appUser.uid || null,
          };
        } else {
          const friend = await checkFriendInFriendList(
            currentUser.uid,
            trimmedEmail
          );
          if (friend) {
            finalMember = { ...finalMember, ...friend };
          } else {
            await addFriendToList(currentUser.uid, finalMember);
          }
        }
      } catch (err) {
        console.error("Error checking user:", err);
      }

      return finalMember;
    });

    try {
      const resolvedMembers = await Promise.all(memberPromises);
      const filteredMembers = resolvedMembers.filter(Boolean);

      filteredMembers.push({
        id: currentUser.email.toLowerCase(),
        name: currentUser.displayName,
        email: currentUser.email.toLowerCase(),
        uid: currentUser.uid,
        isAppUser: true,
      });

      const groupId = await createGroupInFirestore({
        groupName: groupName.trim(),
        members: filteredMembers,
        simplify,
        createdBy: currentUser.email.toLowerCase(), // use email as primary key
      });

      navigate(`/group/${groupId}`);
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMemberField = () => {
    setMembers([...members, { name: "", email: "" }]);
  };

  const removeMemberField = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100">
      <main className="flex-grow overflow-auto px-4 pt-8 pb-28 sm:px-6 lg:px-12">
        <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            Create a Group
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Group Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm text-gray-300">Members</label>
              {members.map((member, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-center bg-gray-900 p-4 rounded-lg border border-gray-700 transition"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    value={member.name}
                    onChange={(e) =>
                      handleMemberChange(index, "name", e.target.value)
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    value={member.email}
                    onChange={(e) =>
                      handleMemberChange(index, "email", e.target.value)
                    }
                    required
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMemberField(index)}
                      className="text-red-400 hover:text-red-300 text-lg px-2 transition"
                    >
                      ✖️
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addMemberField}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl text-sm font-semibold transition"
                >
                  ➕ Add Member
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e) => setSimplify(e.target.checked)}
              />
              <label className="text-sm text-gray-300">Simplify Debts</label>
            </div>

            <button
              type="submit"
              disabled={!groupName.trim() || creating}
              className={`w-full py-3 rounded-xl font-semibold text-lg transition ${
                groupName.trim() && !creating
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {creating ? "Creating Group..." : "🚀 Create Group"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateGroup;
