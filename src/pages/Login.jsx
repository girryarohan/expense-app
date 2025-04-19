import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

function Login() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) navigate("/");
  }, [currentUser]);

  const handleLogin = async () => {
    await signInWithGoogle();
    navigate("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-[350px] text-center">
        <h2 className="text-2xl font-bold mb-4">Expense App Login</h2>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
