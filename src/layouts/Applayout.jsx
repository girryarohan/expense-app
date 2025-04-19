import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <main className="pt-4 px-4 sm:px-6 lg:px-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
