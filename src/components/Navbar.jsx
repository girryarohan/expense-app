import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/authService";
import { FaChevronDown } from "react-icons/fa";

function Navbar() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const avatar =
    currentUser?.photoURL ||
    currentUser?.providerData?.[0]?.photoURL ||
    "/avatar.png";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="w-full bg-white text-gray-900 px-4 sm:px-6 py-4 shadow-md flex justify-between items-center">
      {/* TTMM Logo */}
      <h1
        onClick={() => navigate("/")}
        className="text-2xl font-extrabold tracking-wide cursor-pointer"
      >
        <span className="text-blue-600">TT</span>
        <span className="text-pink-500">MM</span>
      </h1>

      {/* Avatar Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:text-blue-600"
        >
          <img
            src={avatar}
            alt="avatar"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full border border-gray-300"
          />
          <FaChevronDown className="text-sm" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => navigate("/create-group")}
            >
              ➕ Create Group
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => navigate("/friends")}
            >
              👥 Friend List
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => navigate("/settings")}
            >
              ⚙️ Settings
            </button>
            <button
              className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 text-sm"
              onClick={logout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
