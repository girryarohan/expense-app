import { useNavigate, useParams } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const AddExpenseButton = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const controls = useAnimation();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        controls.start({ y: 0, opacity: 1 });
      } else {
        controls.start({ y: 20, opacity: 0.85 });
      }
      lastScrollY = currentScrollY;
    };

    // Always show on mount
    controls.start({ y: 0, opacity: 1 });

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [controls]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={controls}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 20,
      }}
      className="fixed bottom-5 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none"
    >
      <button
        onClick={() => navigate(`/group/${groupId}/add-expense`)}
        className="pointer-events-auto w-full max-w-md sm:max-w-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-2xl shadow-md hover:shadow-lg transition text-lg"
      >
        ➕ Add New Expense
      </button>
    </motion.div>
  );
};

export default AddExpenseButton;
