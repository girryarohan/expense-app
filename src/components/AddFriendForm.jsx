import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  checkFriendInApp,
  checkFriendInFriendList,
  addFriendToList,
} from "../services/friendService";

const AddFriendForm = ({ onAdded }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setMsg("Name and Email are required.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const existing = await checkFriendInFriendList(
        currentUser.uid,
        trimmedEmail
      );
      if (existing) {
        setMsg("Friend already exists.");
        setIsError(true);
        setLoading(false);
        return;
      }

      const appUser = await checkFriendInApp(trimmedEmail);
      const friend = {
        id: appUser?.id || trimmedEmail,
        name: trimmedName,
        email: trimmedEmail,
        isAppUser: !!appUser,
      };

      await addFriendToList(currentUser.uid, friend);
      setMsg("✅ Friend added!");
      setIsError(false);
      setName("");
      setEmail("");
      onAdded?.();
    } catch (error) {
      console.error(error);
      setMsg("Something went wrong. Try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleAdd}
      className="mt-6 space-y-5 bg-gray-800 p-6 rounded-2xl shadow-lg"
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Name</label>
        <input
          type="text"
          placeholder="Enter friend's name"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-500/40 transition"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Email</label>
        <input
          type="text"
          placeholder="Enter friend's email"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-500/40 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim() || !email.trim()}
        className={`w-full py-2 mt-3 rounded-xl font-semibold text-base transition ${
          loading || !name.trim() || !email.trim()
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
        }`}
      >
        {loading ? "Adding..." : "➕ Add Friend"}
      </button>

      {msg && (
        <div
          className={`text-center text-sm font-medium mt-4 ${
            isError ? "text-red-400" : "text-green-400"
          }`}
        >
          {msg}
        </div>
      )}
    </form>
  );
};

export default AddFriendForm;
