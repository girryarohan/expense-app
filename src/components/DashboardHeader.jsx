import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

function DashboardHeader({ currentUser, navigate, logout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto close dropdown on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const avatar =
    currentUser?.photoURL ||
    currentUser?.providerData?.[0]?.photoURL ||
    "/avatar.png";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <img
          src={avatar}
          alt="avatar"
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full border border-gray-300"
        />
        <span className="font-medium">
          {currentUser?.displayName || "User"}
        </span>
        <FaChevronDown className="text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50 text-sm">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              navigate("/settings");
              setOpen(false);
            }}
          >
            ⚙️ Settings
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              navigate("/friends");
              setOpen(false);
            }}
          >
            👥 Friend List
          </button>
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            onClick={logout}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;
