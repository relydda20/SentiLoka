import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 min-h-screen">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 font-bold text-gray-900 text-5xl">
          Welcome to Sentiment AI
        </h1>
        <p className="mb-8 text-gray-600 text-xl">
          Analyze sentiment and generate AI-powered replies with ease
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg text-white transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-white hover:bg-indigo-50 px-6 py-3 border-2 border-indigo-600 rounded-lg text-indigo-600 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
