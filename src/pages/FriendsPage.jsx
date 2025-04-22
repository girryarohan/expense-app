import FriendList from "../components/FriendList";

const FriendsPage = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-100 relative">
      <main className="flex-grow overflow-auto px-4 pt-6 pb-28 sm:px-6 lg:px-12">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 sm:p-8 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-6 text-center text-white">
            👥 Your Friends
          </h2>

          <FriendList />
        </div>
      </main>
    </div>
  );
};

export default FriendsPage;
