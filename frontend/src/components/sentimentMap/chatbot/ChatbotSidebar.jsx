import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HistoryView from "./HistoryView"; // Assuming in same folder
import ChatView from "./ChatView"; // Assuming in same folder

// --- Dummy Data ---
const initialSessions = [
  {
    id: "1",
    title: "Understanding Market Trends",
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "2",
    title: "Product Feedback Analysis",
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "3",
    title: "New Feature Brainstorming Session and it will be a long title",
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
];
// -------------------

const ChatbotSidebar = ({ isOpen, onClose }) => {
  // 'history' or 'chat'
  const [view, setView] = useState("history");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState(initialSessions);

  // Reset view to history when sidebar is closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("history");
        setCurrentSessionId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // --- Event Handlers ---

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    setView("chat");
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setView("chat");
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleGoBack = () => {
    setView("history");
    setCurrentSessionId(null);
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="top-0 right-0 z-50 fixed bg-white shadow-2xl w-full sm:w-96 h-full"
        >
          <div className="flex flex-col h-full">
            {view === "history" ? (
              <HistoryView
                sessions={sessions}
                onNewSession={handleNewSession}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                onClose={onClose}
              />
            ) : (
              <ChatView
                session={currentSession}
                onBack={handleGoBack}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatbotSidebar;
