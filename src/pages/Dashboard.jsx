import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchUserGroups } from "../services/groupService";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGroups = async () => {
      if (!currentUser) return;

      // Always use ONLY email as the identifier moving forward
      const userGroups = await fetchUserGroups(currentUser.email.toLowerCase());
      setGroups(userGroups);
    };

    loadGroups();
  }, [currentUser]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100 relative">
      {/* Scrollable Main Content */}
      <main className="flex-grow overflow-auto px-4 pt-6 pb-36 sm:px-6 lg:px-12">
        {/* Groups Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            🧾 Your Groups
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="cursor-pointer p-5 bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-100 text-base">
                    {group.name}
                  </h3>
                  <span className="text-gray-400 text-xl">➤</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {group.members?.length || 0} members
                </p>
                <p className="text-sm font-medium text-blue-400 mt-2">
                  ₹{group.totalSpent?.toFixed(2) || "0.00"} spent
                </p>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                No groups yet. Start by creating one!
              </p>
            )}
          </div>
        </div>

        {/* Personal Expenses Placeholder */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            👤 Personal Expenses
          </h2>

          <div className="space-y-3">
            <div className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <span className="font-medium text-sm">Akash</span>
              <span className="text-red-400 font-semibold text-sm">
                You owe ₹300
              </span>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <span className="font-medium text-sm">Priya</span>
              <span className="text-green-400 font-semibold text-sm">
                She owes you ₹200
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 px-4 py-4 shadow-inner z-50 flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 border-t border-gray-800">
        <button
          onClick={() => navigate("/create-group")}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow-md text-base font-medium"
        >
          + Create Group
        </button>

        <button
          onClick={() => alert("Coming soon")}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl shadow-md text-base font-medium"
        >
          + Personal Expense
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
