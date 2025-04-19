import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGroupData = async () => {
      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, "groups", groupId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Group not found.");
          setLoading(false);
          return;
        }

        setGroup({ id: docSnap.id, ...docSnap.data() });

        const expenseSnap = await getDocs(
          collection(db, `groups/${groupId}/expenses`)
        );
        const expenseList = expenseSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setExpenses(expenseList);
      } catch (err) {
        console.error("Error loading group:", err);
        setError("Failed to load group data.");
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading group...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-12">
      {/* Group Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{group.name}</h1>
        <p className="text-sm text-gray-500">
          {group.members.length} members · Total Spent: ₹{group.totalSpent || 0}
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            👥 Members
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {group.members.map((m, i) => (
              <li key={i} className="border-b pb-1">
                • <span className="font-medium">{m.name}</span>{" "}
                <span className="text-xs text-gray-400">({m.email})</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            💸 Expenses
          </h2>
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium text-gray-800">{exp.title}</p>
                  <p className="text-xs text-gray-400">
                    Paid by: {exp.paidBy || "Unknown"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  ₹{exp.amount}
                </span>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-sm text-gray-400">No expenses yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="fixed bottom-5 left-0 right-0 px-4 sm:px-0 flex justify-center lg:static lg:mt-10">
        <button
          className="w-full max-w-md lg:max-w-sm bg-blue-600 text-white py-3 px-6 rounded-xl shadow hover:bg-blue-700 transition"
          onClick={() => navigate(`/group/${groupId}/add-expense`)}
        >
          + Add Expense
        </button>
      </div>
    </div>
  );
}

export default GroupDetail;
