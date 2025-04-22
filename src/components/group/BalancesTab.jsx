import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useState, useEffect } from "react";

const BalancesTab = ({ group }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { groupId } = useParams();
  const [balances, setBalances] = useState([]);
  const [settling, setSettling] = useState(null);
  const [loading, setLoading] = useState(true);

  const findMemberName = (id) =>
    group.members.find((m) => m.id === id)?.name || "Unknown";

  // Simplify debts
  const simplifyDebts = (rawBalances) => {
    const balanceSheet = {};

    rawBalances.forEach(({ from, to, amount }) => {
      balanceSheet[from] = (balanceSheet[from] || 0) - amount;
      balanceSheet[to] = (balanceSheet[to] || 0) + amount;
    });

    const creditors = [];
    const debtors = [];

    Object.keys(balanceSheet).forEach((userId) => {
      const balance = +balanceSheet[userId].toFixed(2);
      if (balance > 0.01) creditors.push({ userId, balance });
      else if (balance < -0.01) debtors.push({ userId, balance: -balance });
    });

    const simplified = [];

    while (debtors.length && creditors.length) {
      const debtor = debtors.pop();
      const creditor = creditors.pop();
      const settledAmount = Math.min(debtor.balance, creditor.balance);

      simplified.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: +settledAmount.toFixed(2),
      });

      debtor.balance -= settledAmount;
      creditor.balance -= settledAmount;

      if (debtor.balance > 0.01) debtors.push(debtor);
      if (creditor.balance > 0.01) creditors.push(creditor);
    }

    return simplified;
  };

  const fetchExpensesAndComputeBalances = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, `groups/${groupId}/expenses`));
      const allExpenses = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const tempBalances = {};
      group.members.forEach((m) => {
        tempBalances[m.id] = {};
      });

      for (const exp of allExpenses) {
        if (exp.type === "settlement") {
          const { from, to, amount } = exp;
          tempBalances[from][to] = (tempBalances[from][to] || 0) - amount;
        } else {
          const paidBy = exp.paidBy;
          const splits = exp.splitWith || [];
          splits.forEach((split) => {
            if (split.id !== paidBy) {
              tempBalances[split.id][paidBy] =
                (tempBalances[split.id][paidBy] || 0) + split.share;
            }
          });
        }
      }

      const finalBalances = [];
      Object.keys(tempBalances).forEach((from) => {
        Object.keys(tempBalances[from]).forEach((to) => {
          const amountFromTo = tempBalances[from][to] || 0;
          const amountToFrom = tempBalances[to]?.[from] || 0;
          const netAmount = amountFromTo - amountToFrom;
          if (netAmount > 0.01) {
            finalBalances.push({ from, to, amount: +netAmount.toFixed(2) });
          }
        });
      });

      const simplified = simplifyDebts(finalBalances);
      setBalances(simplified);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndComputeBalances();
  }, [groupId]);

  const handleRemind = (fromName, toName) => {
    showToast(`Reminder sent to ${fromName || toName}! 🛎️`, "info");
  };

  const handleSettle = async () => {
    if (!settling) return;

    try {
      await addDoc(collection(db, `groups/${groupId}/expenses`), {
        type: "settlement",
        title: `Settlement between ${findMemberName(
          settling.from
        )} and ${findMemberName(settling.to)}`,
        from: settling.from,
        to: settling.to,
        amount: settling.amount,
        currency: group.currency || "INR",
        notes: "",
        expenseDateTime: new Date(),
        createdAt: serverTimestamp(),
      });

      showToast("Settlement Recorded Successfully! 🎉", "success");
      setSettling(null);
      await fetchExpensesAndComputeBalances(); // Refresh balances properly
    } catch (error) {
      console.error("Error during settlement:", error);
      showToast("Failed to record settlement.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-gray-400 min-h-[20vh]">
        Loading balances...
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="text-center text-gray-400">
        All Settled Up! 🎉 No balances pending.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {balances
        .sort((a, b) => b.amount - a.amount)
        .map((balance, index) => {
          const fromName = findMemberName(balance.from);
          const toName = findMemberName(balance.to);
          const isUserInvolved =
            balance.from === currentUser.uid || balance.to === currentUser.uid;
          const isUserOwes = balance.from === currentUser.uid;
          const isUserGets = balance.to === currentUser.uid;

          let statusColor = "text-gray-300";
          if (isUserOwes) statusColor = "text-orange-400";
          if (isUserGets) statusColor = "text-green-400";

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              <div>
                <p className={`font-semibold ${statusColor}`}>
                  {fromName} owes {toName}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Amount: ₹{balance.amount.toFixed(2)}
                </p>
              </div>

              {isUserInvolved && (
                <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleRemind(fromName, toName)}
                    className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                  >
                    🛎️ Remind
                  </button>
                  <button
                    onClick={() => setSettling(balance)}
                    className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                  >
                    ✅ Settle Up
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

      {settling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl text-center space-y-6 shadow-lg">
            <h2 className="text-xl font-bold text-white">Confirm Settlement</h2>
            <p className="text-gray-300">
              Are you sure you want to settle <br />
              <span className="font-semibold text-blue-400">
                {findMemberName(settling.from)}
              </span>{" "}
              ➔{" "}
              <span className="font-semibold text-blue-400">
                {findMemberName(settling.to)}
              </span>{" "}
              for ₹{settling.amount.toFixed(2)}?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSettle}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full text-white text-sm font-semibold"
              >
                ✅ Confirm
              </button>
              <button
                onClick={() => setSettling(null)}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-full text-white text-sm font-semibold"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancesTab;
