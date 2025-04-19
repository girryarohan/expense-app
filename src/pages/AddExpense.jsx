import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitWith, setSplitWith] = useState([]);

  useEffect(() => {
    const fetchGroup = async () => {
      const docRef = doc(db, "groups", groupId);
      const snapshot = await getDoc(docRef);
      const groupData = snapshot.data();
      setGroup(groupData);
      setPaidBy(groupData.members[0].id); // default
      setSplitWith(
        groupData.members.map((m) => ({
          id: m.id,
          share: 0, // will be auto-calculated
        }))
      );
    };
    fetchGroup();
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    const perPersonShare = +(numericAmount / splitWith.length).toFixed(2);

    const updatedSplitWith = splitWith.map((s) => ({
      ...s,
      share: perPersonShare,
    }));

    // Save expense
    await addDoc(collection(db, `groups/${groupId}/expenses`), {
      title,
      amount: numericAmount,
      paidBy,
      splitWith: updatedSplitWith,
      notes: "",
      createdAt: serverTimestamp(),
    });

    // Update group total
    await updateDoc(doc(db, "groups", groupId), {
      totalSpent: group.totalSpent + numericAmount,
    });

    navigate(`/group/${groupId}`);
  };

  if (!group) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Paid By</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
