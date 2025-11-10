import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HistoryView from "./HistoryView";
import ChatView from "./ChatView";
import { getUserLocations, getConversations, deleteConversation } from "../../../services/chatbotService";
import { showErrorAlert } from "../../../utils/sweetAlertConfig";

const ChatbotSidebar = ({ isOpen, onClose }) => {
  const [view, setView] = useState("history");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  
  // Location attachment state
  const [availableLocations, setAvailableLocations] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState(null);

  // Reset view when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("history");
        setCurrentSessionId(null);
        setIsLocationDropdownOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch conversation sessions when sidebar opens
  useEffect(() => {
    const fetchSessions = async () => {
      if (isOpen) {
        try {
          setSessionsLoading(true);
          setSessionsError(null);
          console.log("🔄 Fetching conversation sessions...");
          const response = await getConversations({ limit: 50, skip: 0 });
          
          // Ensure we have valid data
          const conversationData = response?.data || [];
          console.log("📦 Raw conversation data:", conversationData);
          
          // Validate and filter sessions
          const validSessions = Array.isArray(conversationData) 
            ? conversationData.filter(s => s && s.sessionId)
            : [];
          
          setSessions(validSessions);
          console.log(`✅ Loaded ${validSessions.length} valid conversation sessions`);
        } catch (error) {
          console.error("❌ Failed to fetch conversation sessions:", error);
          setSessionsError("Failed to load conversations. Please try again.");
          setSessions([]); // Set empty array on error
        } finally {
          setSessionsLoading(false);
        }
      }
    };

    fetchSessions();
  }, [isOpen]);

  // Fetch available locations when sidebar opens
  useEffect(() => {
    const fetchLocations = async () => {
      if (isOpen && availableLocations.length === 0) {
        try {
          setLocationsLoading(true);
          setLocationsError(null);
          const data = await getUserLocations();
          setAvailableLocations(data.locations || []);
        } catch (error) {
          console.error("Failed to fetch locations:", error);
          setLocationsError("Failed to load locations. Please try again.");
        } finally {
          setLocationsLoading(false);
        }
      }
    };

    fetchLocations();
  }, [isOpen, availableLocations.length]);

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setView("chat");
  };

  const handleNewSession = () => {
    // Reset state for new session
    setCurrentSessionId(null);
    setSelectedLocationIds([]);
    setIsLocationDropdownOpen(false);
    setView("chat");
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    
    try {
      console.log(`🗑️ Deleting session: ${sessionId}`);
      await deleteConversation(sessionId);
      
      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      console.log("✅ Session deleted successfully");
    } catch (error) {
      console.error("Failed to delete session:", error);
      showErrorAlert("Delete Failed", "Failed to delete conversation. Please try again.");
    }
  };

  const handleGoBack = () => {
    setView("history");
    setCurrentSessionId(null);
    setSelectedLocationIds([]);
    setIsLocationDropdownOpen(false);
    
    // Refresh sessions list when going back to history
    refetchSessions();
  };

  // Function to refresh sessions list
  const refetchSessions = async () => {
    try {
      console.log("🔄 Refreshing conversation sessions...");
      const response = await getConversations({ limit: 50, skip: 0 });

      // Validate and filter sessions
      const conversationData = response?.data || [];
      const validSessions = Array.isArray(conversationData)
        ? conversationData.filter(s => s && s.sessionId)
        : [];

      setSessions(validSessions);
      console.log(`✅ Refreshed ${validSessions.length} conversation sessions`);
    } catch (error) {
      console.error("❌ Failed to refresh conversation sessions:", error);
    }
  };

  // Function to add or update a session in the list
  const handleSessionUpdate = (sessionData) => {
    setSessions((prevSessions) => {
      // Check if session already exists
      const existingIndex = prevSessions.findIndex(s => s.sessionId === sessionData.sessionId);

      if (existingIndex >= 0) {
        // Update existing session
        const updated = [...prevSessions];
        updated[existingIndex] = { ...updated[existingIndex], ...sessionData };
        return updated;
      } else {
        // Add new session at the beginning
        return [sessionData, ...prevSessions];
      }
    });
  };

  // Handle location selection changes
  const handleLocationSelectionChange = (newSelectedIds) => {
    setSelectedLocationIds(newSelectedIds);
  };

  // Handle removing a location chip
  const handleRemoveLocation = (locationId) => {
    setSelectedLocationIds((prev) => prev.filter((id) => id !== locationId));
  };

  // Toggle location dropdown
  const handleToggleLocationDropdown = () => {
    setIsLocationDropdownOpen((prev) => !prev);
  };

  // Get selected location objects for display
  const selectedLocations = availableLocations.filter((loc) =>
    selectedLocationIds.includes(loc.locationId)
  );

  // Find the full session object to pass to ChatView
  const currentSession = sessions.find((s) => s.sessionId === currentSessionId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="top-0 right-0 z-50 fixed bg-white shadow-2xl w-full sm:w-[480px] lg:w-[540px] h-full"
        >
          <div className="flex flex-col h-full">
            {view === "history" ? (
              <HistoryView
                sessions={sessions}
                onNewSession={handleNewSession}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                onClose={onClose}
                loading={sessionsLoading}
                error={sessionsError}
              />
            ) : (
              <ChatView
                session={currentSession}
                onBack={handleGoBack}
                onClose={onClose}
                onSessionCreated={refetchSessions}
                onSessionUpdate={handleSessionUpdate}
                // Location attachment props
                availableLocations={availableLocations}
                selectedLocationIds={selectedLocationIds}
                selectedLocations={selectedLocations}
                onLocationSelectionChange={handleLocationSelectionChange}
                onRemoveLocation={handleRemoveLocation}
                isLocationDropdownOpen={isLocationDropdownOpen}
                onToggleLocationDropdown={handleToggleLocationDropdown}
                locationsLoading={locationsLoading}
                locationsError={locationsError}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatbotSidebar;
