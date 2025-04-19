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
    <form onSubmit={handleAdd} className="mt-4 space-y-3">
      <input
        type="text"
        placeholder="Name"
        className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={loading || !name.trim() || !email.trim()}
        className={`w-full py-2 rounded transition ${
          loading || !name.trim() || !email.trim()
            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Adding..." : "Add Friend"}
      </button>
      {msg && (
        <p
          className={`text-sm mt-2 ${
            isError ? "text-red-400" : "text-green-400"
          }`}
        >
          {msg}
        </p>
      )}
    </form>
  );
};

export default AddFriendForm;
