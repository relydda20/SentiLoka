import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Replace with your actual authentication logic
    console.log("Login attempt:", { email, password });

    // Simulate successful login
    localStorage.setItem("authToken", "demo-token");
    navigate("/dashboard");
  };

  return (
    <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
      <div className="bg-white shadow-md p-8 rounded-lg w-full max-w-md">
        <h2 className="mb-6 font-bold text-3xl text-center">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700 text-sm">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700 text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg w-full text-white transition"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-gray-600 text-sm text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register
          </Link>
        </p>

        <Link
          to="/"
          className="block mt-4 text-gray-600 text-sm text-center hover:underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Login;
