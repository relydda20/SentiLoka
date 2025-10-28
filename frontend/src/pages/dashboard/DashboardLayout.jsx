import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import logo from "../../assets/sentiloka_logo.png";

import NavItem from "../../components/features/NavItem";
import DropdownItem from "../../components/common/DropdownItem";
import {
  hoverScale,
  hoverScaleTap,
  springTransition,
  dropdownMotion,
} from "../../utils/motionConfig";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const profileUrl = null; // or your actual image URL

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/sentiment-map", label: "Sentiment Map" },
    { path: "/dashboard/ai-reply", label: "Reply Generator" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const isLinkActive = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Floating Fixed Navbar */}
      <div className="top-4 left-1/2 z-30 fixed w-full max-w-[1440px] -translate-x-1/2">
        <nav className="flex justify-between items-center bg-[#2F4B4E] shadow-md mx-auto px-6 py-2 rounded-full w-[97%] h-21">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            {...hoverScale}
          >
            <img src={logo} alt="SentiLoka Logo" className="w-16 h-16" />
            <h1 className="font-mate font-medium text-white text-2xl leading-8 [text-shadow:0_0_2px_#CCD5AE]">
              SentiLoka
            </h1>
          </motion.div>

          {/* Links */}
          <div className="flex font-semibold text-[#FAF6E9] text-2xl leading-8">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                <NavItem active={isLinkActive(item.path)}>{item.label}</NavItem>
              </NavLink>
            ))}
          </div>

          {/* Profile + Dropdown */}
          <div className="relative">
            <motion.div
              className="flex items-center gap-8 px-4 py-2 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              {...hoverScaleTap}
            >
              {profileUrl ? (
                <motion.img
                  src={profileUrl}
                  alt="Profile"
                  className="rounded-full w-10 h-10 object-cover pointer-events-none"
                  whileHover={{ scale: 1.1 }}
                  transition={springTransition}
                />
              ) : (
                <motion.div
                  className="bg-[#D9D9D9] rounded-full w-10 h-10 pointer-events-none"
                  whileHover={{ scale: 1.1, backgroundColor: "#C9C9C9" }}
                  transition={springTransition}
                />
              )}

              <motion.svg
                width="33"
                height="19"
                viewBox="0 0 33 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none"
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={springTransition}
              >
                <path
                  d="M1.5 1.5L16.5 16.5L31.5 1.5"
                  stroke="#ECE8D9"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.svg>
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  {...dropdownMotion}
                  className="right-0 absolute bg-white shadow-lg mt-2 rounded-2xl w-48 overflow-hidden"
                >
                  <DropdownItem
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="hover:bg-[#FAF6E9] text-[#2F4B4E]"
                  >
                    Profile
                  </DropdownItem>

                  <DropdownItem
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/dashboard/settings");
                    }}
                    className="hover:bg-[#FAF6E9] text-[#2F4B4E]"
                  >
                    Settings
                  </DropdownItem>

                  <div className="bg-gray-200 mx-4 h-px" />

                  <DropdownItem
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="hover:bg-red-50 text-red-600"
                  >
                    Logout
                  </DropdownItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
