import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

function formatLocalDateTime(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [remark, setRemark] = useState("");
  const [splitMethod, setSplitMethod] = useState("equal");
  const [splitWith, setSplitWith] = useState([]);
  const [expenseDateTime, setExpenseDateTime] = useState(() =>
    formatLocalDateTime()
  );
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      const docRef = doc(db, "groups", groupId);
      const snapshot = await getDoc(docRef);
      const groupData = snapshot.data();
      setGroup(groupData);
      setPaidBy(currentUser.email.toLowerCase());
      setSplitWith(
        groupData?.members?.map((m) => ({
          id: m.email.toLowerCase(),
          name: m.name,
          share: 0,
          selected: true,
        })) || []
      );
    };
    fetchGroup();
  }, [groupId, currentUser.email]);

  const handleSplitChange = (index, field, value) => {
    const updated = [...splitWith];
    updated[index][field] = value;
    setSplitWith(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast("Please enter a valid amount!", "error");
      setCreating(false);
      return;
    }

    const selectedMembers = splitWith.filter((m) => m.selected);
    if (selectedMembers.length === 0) {
      showToast("Please select at least one member to split with!", "error");
      setCreating(false);
      return;
    }

    let finalSplit = [];

    try {
      if (splitMethod === "equal") {
        const perPerson = +(numericAmount / selectedMembers.length).toFixed(2);
        finalSplit = selectedMembers.map((m) => ({
          id: m.id,
          name: m.name,
          share: perPerson,
        }));
      } else if (splitMethod === "exact") {
        const totalEntered = selectedMembers.reduce(
          (sum, m) => sum + parseFloat(m.share || 0),
          0
        );
        if (Math.abs(totalEntered - numericAmount) > 0.01) {
          showToast("Exact shares don't add up to total amount!", "error");
          setCreating(false);
          return;
        }
        finalSplit = selectedMembers.map((m) => ({
          id: m.id,
          name: m.name,
          share: +parseFloat(m.share || 0).toFixed(2),
        }));
      } else if (splitMethod === "percentage") {
        const totalPercentage = selectedMembers.reduce(
          (sum, m) => sum + parseFloat(m.share || 0),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.1) {
          showToast("Total percentage must be 100%!", "error");
          setCreating(false);
          return;
        }
        finalSplit = selectedMembers.map((m) => ({
          id: m.id,
          name: m.name,
          share: +((numericAmount * parseFloat(m.share)) / 100).toFixed(2),
        }));
      } else if (splitMethod === "shares") {
        const totalShares = selectedMembers.reduce(
          (sum, m) => sum + parseInt(m.share || 0),
          0
        );
        if (totalShares === 0) {
          showToast("Total shares cannot be zero!", "error");
          setCreating(false);
          return;
        }
        finalSplit = selectedMembers.map((m) => ({
          id: m.id,
          name: m.name,
          share: +((numericAmount * parseInt(m.share)) / totalShares).toFixed(
            2
          ),
        }));
      }

      const localDateTime = new Date(expenseDateTime);

      await addDoc(collection(db, `groups/${groupId}/expenses`), {
        title: title.trim(),
        amount: numericAmount,
        paidBy: paidBy.toLowerCase(),
        splitWith: finalSplit,
        currency,
        notes: remark.trim(),
        expenseDateTime: Timestamp.fromDate(localDateTime),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "groups", groupId), {
        totalSpent: (group?.totalSpent ?? 0) + numericAmount,
      });

      showToast("Expense added successfully! 🎉", "success");
      navigate(`/group/${groupId}`);
    } catch (error) {
      console.error("Error adding expense:", error);
      showToast("Failed to add expense. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading group...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100">
      <main className="flex-grow overflow-auto px-4 pt-8 pb-28 sm:px-6 lg:px-12">
        <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            ➕ Add Expense
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter expense title"
                className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm text-gray-300">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  required
                />
              </div>
              <div className="w-32 space-y-2">
                <label className="block text-sm text-gray-300">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                >
                  <option value="INR">₹ INR</option>
                  <option value="YEN">¥ YEN</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              >
                {group.members.map((m) => (
                  <option key={m.email} value={m.email.toLowerCase()}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              {["equal", "exact", "percentage", "shares"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSplitMethod(method)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    splitMethod === method
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {splitWith.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 bg-gray-900 p-3 rounded-xl border border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={member.selected}
                    onChange={(e) =>
                      handleSplitChange(index, "selected", e.target.checked)
                    }
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{member.name}</p>
                  </div>
                  {splitMethod !== "equal" && member.selected && (
                    <input
                      type="number"
                      placeholder={
                        splitMethod === "exact"
                          ? "Amount"
                          : splitMethod === "percentage"
                          ? "%"
                          : "Shares"
                      }
                      value={member.share}
                      onChange={(e) =>
                        handleSplitChange(index, "share", e.target.value)
                      }
                      className="w-24 px-3 py-1 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Date & Time</label>
              <input
                type="datetime-local"
                value={expenseDateTime}
                onChange={(e) => setExpenseDateTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">
                Remark (optional)
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add any notes about the expense..."
                className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white resize-none"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !amount.trim() || creating}
              className={`w-full py-3 rounded-xl font-semibold text-lg transition ${
                title.trim() && amount.trim() && !creating
                  ? "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {creating ? "Adding..." : "🚀 Add Expense"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddExpense;
