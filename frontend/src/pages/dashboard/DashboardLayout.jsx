import { Outlet, Link, useNavigate } from "react-router-dom";

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="font-bold text-indigo-600 text-xl">
                Sentiment AI
              </h1>

              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="hover:bg-indigo-50 px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/sentiment-map"
                  className="hover:bg-indigo-50 px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 transition"
                >
                  Sentiment Map
                </Link>
                <Link
                  to="/dashboard/ai-reply"
                  className="hover:bg-indigo-50 px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 transition"
                >
                  AI Reply Generator
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
