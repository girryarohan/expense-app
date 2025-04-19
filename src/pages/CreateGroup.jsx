import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createGroupInFirestore } from "../services/groupService";
import {
  checkFriendInApp,
  checkFriendInFriendList,
  addFriendToList,
} from "../services/friendService";
import Navbar from "../components/Navbar";

function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([
    { name: "", email: "", isAppUser: false, id: "" },
  ]);
  const [simplify, setSimplify] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    const emailsSet = new Set();
    const finalMembers = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const trimmedEmail = m.email?.trim();
      const trimmedName = m.name?.trim();

      if (!trimmedEmail || !trimmedName || emailsSet.has(trimmedEmail))
        continue;
      emailsSet.add(trimmedEmail);

      let finalMember = {
        name: trimmedName,
        email: trimmedEmail,
        isAppUser: false,
        id: trimmedEmail,
      };

      try {
        const appUser = await checkFriendInApp(trimmedEmail);
        if (appUser) {
          finalMember = { ...finalMember, ...appUser };
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

      finalMembers.push(finalMember);
    }

    finalMembers.push({
      id: currentUser.uid,
      name: currentUser.displayName,
      email: currentUser.email,
      isAppUser: true,
    });

    try {
      const groupId = await createGroupInFirestore({
        groupName: groupName.trim(),
        members: finalMembers,
        simplify,
        createdBy: currentUser.uid,
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
    updated[index][field] = value.trimStart();
    setMembers(updated);
  };

  const addMemberField = () => {
    setMembers([...members, { name: "", email: "", isAppUser: false, id: "" }]);
  };

  const removeMemberField = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-grow px-4 pt-6 pb-24 sm:px-6 lg:px-12">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 sm:p-8 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-6 text-center text-white">
            Create a Group
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            {/* Members */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Members
              </label>
              {members.map((member, index) => (
                <div
                  key={index}
                  className="flex gap-2 flex-wrap sm:flex-nowrap mb-2"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    className="flex-1 px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded"
                    value={member.name}
                    onChange={(e) =>
                      handleMemberChange(index, "name", e.target.value)
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="flex-1 px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded"
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
                      className="text-red-400 text-xl"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMemberField}
                className="text-sm text-blue-400 hover:underline mt-1"
              >
                + Add Member
              </button>
            </div>

            {/* Simplify Debts */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e) => setSimplify(e.target.checked)}
              />
              <label className="text-sm text-gray-300">Simplify Debts</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!groupName.trim() || creating}
              className={`w-full py-2 rounded ${
                groupName.trim() && !creating
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {creating ? "Creating..." : "Create Group"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateGroup;
