import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; 
import sentilokaLogo from "../assets/sentiloka_logo.png"; 

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Registration attempt:", formData);

    // Simulate successful registration
    localStorage.setItem("authToken", "demo-token");
    navigate("/dashboard");
  };

  return (
    <div className="flex md:flex-row flex-col justify-center items-center bg-linear-to-br from-[#FAFAFA] to-[#FAF6E9] p-4 min-h-screen">
      {/* Left side - Logo */}
      <div className="hidden md:flex flex-col items-center md:mr-30 mb-8 md:mb-0">
        <img src={sentilokaLogo} alt="SentiLoka Logo" className="mb-4 w-100 h-100" />
        <h1 className="font-mate font-semibold text-[#2f4c4a] text-7xl">
          Senti<span className="text-[#416c68]">Loka</span>
        </h1>
        <p className="mt-2 text-gray-600 text-sm">Every Review Matters!</p>
      </div>

      {/* Right side - Register card */}
      <div className="relative bg-[#2f4c4a] shadow-lg p-10 rounded-2xl w-full max-w-sm text-white">
        {/* Back button */}
        <button
          onClick={() => navigate("/login")}
          className="top-4 left-4 absolute text-gray-300 hover:text-white transition"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="mb-6 font-semibold text-3xl text-center">
          Senti<span className="text-[#FAF6E9]">Loka</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-sm">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-white px-4 py-2 border border-gray-300 rounded-4xl focus:ring-[#b6d1ce] focus:ring-2 w-full text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-white px-4 py-2 border border-gray-300 rounded-4xl focus:ring-[#b6d1ce] focus:ring-2 w-full text-gray-800"
              required = {true}
              pattern = {"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"}
              title="Masukkan alamat email yang valid (contoh: user@domain.com)"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-white px-4 py-2 border border-gray-300 rounded-4xl focus:ring-[#b6d1ce] focus:ring-2 w-full text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-white px-4 py-2 border border-gray-300 rounded-4xl focus:ring-[#b6d1ce] focus:ring-2 w-full text-gray-800"
              required
            />
          </div>

          <div className="mt-10 border-[#E1E6C3] border-b w-full">
          </div>

          <div className="flex justify-center">
          <button
            type="submit"
            className="bg-[#ECE8D9] hover:bg-[#c9c1b3] mt-4 py-2 rounded-4xl w-[80%] font-semibold text-[#2f4c4a] transition"
          >
            Sign Up
          </button>
          </div>         
        </form>

        <p className="mt-6 text-[#FAF6E9] text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-[#FAF6E9] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
