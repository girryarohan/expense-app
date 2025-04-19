import Navbar from "../components/Navbar";
import FriendList from "../components/FriendList";

const FriendsPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <FriendList />
    </div>
  );
};

export default FriendsPage;
