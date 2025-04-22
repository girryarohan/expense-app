import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import ExpensesTab from "../components/group/ExpensesTab";
import BalancesTab from "../components/group/BalancesTab";
import ExportTab from "../components/group/ExportTab";
import ManageGroupTab from "../components/group/ManageGroupTab";
import AddExpenseButton from "../components/AddExpenseButton";

function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expenses");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = { id: groupSnap.id, ...groupSnap.data() };
          setGroup(groupData);

          const expensesSnap = await getDocs(
            collection(db, `groups/${groupId}/expenses`)
          );
          const expensesData = expensesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          expensesData.sort(
            (a, b) => b.expenseDateTime?.seconds - a.expenseDateTime?.seconds
          );
          setExpenses(expensesData);

          const tempBalances = {};
          groupData.members.forEach((m) => {
            tempBalances[m.id] = {};
          });

          for (const expense of expensesData) {
            const paidBy = expense.paidBy;
            const splits = expense.splitWith || [];

            splits.forEach((split) => {
              if (split.id !== paidBy) {
                tempBalances[split.id][paidBy] =
                  (tempBalances[split.id][paidBy] || 0) + split.share;
              }
            });
          }

          const finalBalances = [];
          Object.keys(tempBalances).forEach((from) => {
            Object.keys(tempBalances[from]).forEach((to) => {
              const amountFromTo = tempBalances[from][to] || 0;
              const amountToFrom = tempBalances[to]?.[from] || 0;

              if (amountFromTo > amountToFrom) {
                finalBalances.push({
                  from,
                  to,
                  amount: +(amountFromTo - amountToFrom).toFixed(2),
                });
              }
            });
          });

          setBalances(finalBalances);
        }
      } catch (error) {
        console.error("Error fetching group:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-gray-400">
        Loading...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-red-400">
        Group not found.
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100 flex flex-col">
      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 pt-8 pb-36 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          <p className="text-gray-400">
            {group.members?.length || 0} members · ₹
            {group.totalSpent?.toFixed(2) || "0.00"} total spent
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-center gap-4 flex-wrap">
          {["expenses", "balances", "export", "manage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tab === "expenses" && "Expenses"}
              {tab === "balances" && "Balances"}
              {tab === "export" && "Export"}
              {tab === "manage" && "Manage Group"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
          {activeTab === "expenses" && (
            <ExpensesTab expenses={expenses} group={group} />
          )}
          {activeTab === "balances" && (
            <BalancesTab balances={balances} group={group} />
          )}
          {activeTab === "export" && (
            <ExportTab group={group} expenses={expenses} />
          )}
          {activeTab === "manage" && <ManageGroupTab group={group} />}
        </div>
      </div>

      {/* Floating Add Expense Button */}
      <AddExpenseButton />
    </div>
  );
}

export default GroupDetail;
