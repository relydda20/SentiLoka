import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import sentilokaLogo from "../assets/sentiloka_logo.png"; 

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
    <div className="flex md:flex-row flex-col justify-center items-center bg-linear-to-br from-[#FAFAFA] to-[#FAF6E9] p-4 min-h-screen">
      {/* Left side - Logo */}
      <div className="flex flex-col items-center md:mr-30 mb-8 md:mb-0">
        <img
          src={sentilokaLogo}
          alt="SentiLoka Logo"
          className="mb-4 w-100 h-100"
        />
        <h1 className="font-serif font-semibold text-[#2f4c4a] text-6xl">
          Senti<span className="text-[#416c68]">Loka</span>
        </h1>
        <p className="mt-2 text-gray-600 text-sm">Every Reviews Matter!</p>
      </div>

      {/* Right side - Login card */}
      <div className="bg-[#2f4c4a] shadow-lg p-10 rounded-2xl w-full max-w-sm h-[659] text-white">
        <h2 className="mb-6 font-semibold text-3xl text-center">
          Senti<span className="text-[#FAF6E9]">Loka</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#b6d1ce] focus:ring-2 w-full text-[#CED7B0]-800"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#b6d1ce] focus:ring-2 w-full text-[#CED7B0]-800"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-[#ECE8D9] hover:bg-[#c9c1b3] mb-0 py-2 rounded-lg w-full font-semibold text-[#2f4c4a] transition"
          >
            Login
          </button>

          <div className="flex justify-center items-center mt-3">
            <span className="text-gray-300 text-sm">or</span>
          </div>

          <button
            type="button"
            className="flex justify-center items-center bg-white hover:bg-gray-100 py-2 rounded-lg w-full text-gray-700 transition"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="mr-2 w-5"
            />
            Login with Google
          </button>
        </form>

        <p className="mt-6 text-gray-300 text-sm text-center">
          New here?{" "}
          <Link to="/register" className="text-[#b6d1ce] hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
