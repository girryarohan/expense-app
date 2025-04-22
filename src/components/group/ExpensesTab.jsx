import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ExpensesTab = ({ group }) => {
  const { currentUser } = useAuth();
  const { groupId } = useParams();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const findMemberName = (id) =>
    group.members.find((m) => m.id === id)?.name || "Unknown";

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, `groups/${groupId}/expenses`));
      const allExpenses = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort latest first
      allExpenses.sort((a, b) => {
        const aTime = a.expenseDateTime?.seconds || 0;
        const bTime = b.expenseDateTime?.seconds || 0;
        return bTime - aTime;
      });

      setExpenses(allExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-gray-400 min-h-[20vh]">
        Loading expenses...
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center text-gray-400">
        No expenses yet. Start adding some!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const isSettlement = expense.type === "settlement";

        const paidByName = findMemberName(expense.paidBy);
        const date = expense.expenseDateTime?.toDate
          ? expense.expenseDateTime.toDate().toLocaleString()
          : "Unknown";

        const userSplit = expense.splitWith?.find(
          (s) => s.id === currentUser.uid
        );

        let status = "Not involved";
        let amount = 0;

        if (!isSettlement && userSplit) {
          if (expense.paidBy === currentUser.uid) {
            const otherShare = expense.splitWith.reduce(
              (acc, s) => acc + (s.id !== currentUser.uid ? s.share : 0),
              0
            );
            amount = +(expense.amount - otherShare).toFixed(2);
            status = amount > 0 ? "You lent" : "Self paid";
          } else {
            if (userSplit.share > 0) {
              status = "You owe";
              amount = userSplit.share;
            }
          }
        }

        return (
          <div
            key={expense.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between ${
              isSettlement ? "bg-gray-800" : "bg-gray-900"
            } p-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition`}
          >
            {/* Left Section */}
            <div>
              {isSettlement ? (
                <>
                  <p className="font-semibold text-blue-400 flex items-center gap-2">
                    🤝 Settlement
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {findMemberName(expense.from)} ➔{" "}
                    {findMemberName(expense.to)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{date}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">{expense.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Paid by {paidByName} · {date}
                  </p>
                  {expense.notes && (
                    <p className="text-xs text-yellow-400 mt-1 italic">
                      💬 {expense.notes}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="text-right mt-3 sm:mt-0">
              <p className="text-lg font-bold text-green-400">
                {expense.currency === "USD"
                  ? "$"
                  : expense.currency === "YEN"
                  ? "¥"
                  : "₹"}
                {expense.amount?.toFixed(2) || "0.00"}
              </p>

              {!isSettlement && (
                <>
                  {status === "You owe" && (
                    <p className="text-sm text-orange-400 mt-1 font-semibold">
                      You owe{" "}
                      {expense.currency === "USD"
                        ? "$"
                        : expense.currency === "YEN"
                        ? "¥"
                        : "₹"}
                      {amount.toFixed(2)}
                    </p>
                  )}
                  {status === "You lent" && (
                    <p className="text-sm text-green-400 mt-1 font-semibold">
                      You lent{" "}
                      {expense.currency === "USD"
                        ? "$"
                        : expense.currency === "YEN"
                        ? "¥"
                        : "₹"}
                      {amount.toFixed(2)}
                    </p>
                  )}
                  {status === "Self paid" && (
                    <p className="text-sm text-gray-400 mt-1 font-semibold">
                      Self paid
                    </p>
                  )}
                  {status === "Not involved" && (
                    <p className="text-sm text-gray-400 mt-1 font-semibold">
                      Not involved
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpensesTab;
