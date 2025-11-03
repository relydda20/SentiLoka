import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HistoryView from "./HistoryView";
import ChatView from "./ChatView";

// --- Cleaned-up data based on your DB schema ---
const initialSessions = [
  {
    _id: "69078e14bc9a1dbffbfb8f5d",
    userId: "6901de2e14021de323be209a",
    sessionId: "c6177d58-1c6c-433e-b51a-38839721caf7",
    attachedLocationIds: ["690591c3416498a05d07c628"],
    createdAt: "2025-11-02T17:00:04.710Z",
    lastActivity: "2025-11-02T17:06:05.766Z",
    locationMetadata: [
      {
        locationId: "690591c3416498a05d07c628",
        name: "KFC Thamrin Lippo Cikarang",
        reviewCount: 0,
        analyzedReviewCount: 0,
        attachedAt: "2025-11-02T17:06:05.766Z",
        _id: "69078f7d4c688b83728fe163",
      },
    ],
    messages: [
      {
        role: "user",
        content:
          "What are the main complaints customers have about this KFC location?",
        _id: "69078e144c688b83728fe154",
        timestamp: "2025-11-02T17:00:04.715Z",
      },
      {
        role: "assistant",
        content:
          "The main complaints from customers about KFC Thamrin Lippo Cikarang include:\n\n1. **Long Wait Times**: Many customers expressed frustration regarding the lengthy wait times, particularly during peak hours. This was especially noted in the drive-thru service, where delays were commonly mentioned.\n\n2. **Slow Service**: Some reviews highlighted that the service was perceived as slow, which contributed to the overall dissatisfaction for several customers.\n\n3. **Staff Friendliness**: There were complaints about the staff being unfriendly or unhelpful, which negatively impacted the customer experience for some patrons.\n\n4. **Order Accuracy**: A number of customers reported issues with their orders not being accurate, leading to dissatisfaction with their meals.\n\n5. **Cleanliness Issues**: While the restaurant was generally considered clean, some customers pointed out problems with cleanliness, particularly in the restroom facilities.\n\nDespite these complaints, it's worth noting that the overall sentiment towards the location remains positive, with many customers enjoying the food quality and ambiance.",
        _id: "69078e144c688b83728fe155",
        timestamp: "2025-11-02T17:00:04.715Z",
      },
      {
        role: "user",
        content: "What do customers love about this KFC",
        _id: "69078f7d4c688b83728fe164",
        timestamp: "2025-11-02T17:06:05.770Z",
      },
      {
        role: "assistant",
        content:
          "Customers at KFC Thamrin Lippo Cikarang express a strong appreciation for several aspects of their experience, including:\n\n1. **Delicious Food**: The taste of the food, particularly the fried chicken, is frequently praised. Many customers describe it as delicious and of high quality.\n\n2. **Comfortable Atmosphere**: The restaurant is noted for its comfortable and pleasant environment, making it a great place for gatherings with family and friends.\n\n3. **Quick Service**: Although there are some complaints about wait times, many customers still appreciate the quick service provided by the staff, especially during less busy periods.\n\n4. **Cleanliness**: Many patrons commend the overall cleanliness of the restaurant, which contributes to a positive dining experience.\n\n5. **Family-Friendly Facilities**: Customers appreciate the amenities available, such as play areas for children, making it a suitable choice for families.\n\n6. **Accessibility**: The efficient drive-thru service is highlighted as a convenience, making it easy for customers to pick up their orders.\n\nOverall, the combination of tasty food, a welcoming atmosphere, and good facilities makes KFC Thamrin Lippo Cikarang a popular choice among its patrons.",
        _id: "69078f7d4c688b83728fe165",
        timestamp: "2025-11-02T17:06:05.770Z",
      },
    ],
    metadata: {
      locationsAnalyzed: [
        {
          locationId: "690591c3416498a05d07c628",
          locationName: "KFC Thamrin Lippo Cikarang",
          _id: "69078f7d4c688b83728fe162",
        },
      ],
      reviewSnapshot: { totalReviews: 977, averageRating: 4.16 },
      totalMessages: 4,
    },
    updatedAt: "2025-11-02T17:06:05.767Z",
  },
  // Add other sessions here
];
// -------------------

const ChatbotSidebar = ({ isOpen, onClose }) => {
  const [view, setView] = useState("history");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState(initialSessions);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setView("history");
        setCurrentSessionId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    setView("chat");
  };

  const handleNewSession = () => {
    // In a real app, you'd create a new session in the DB
    // and then switch to it.
    const newSession = {
      _id: `temp_${Date.now()}`, // Temporary ID
      messages: [],
      lastActivity: new Date().toISOString(),
      // ...other new session defaults
    };
    // setSessions([newSession, ...sessions]); // Add new session to list
    // setCurrentSessionId(newSession._id);
    // setView("chat");

    // For this example, we'll just go to a blank chat view
    setCurrentSessionId(null);
    setView("chat");
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s._id !== id));
  };

  const handleGoBack = () => {
    setView("history");
    setCurrentSessionId(null);
  };

  // Find the full session object to pass to ChatView
  const currentSession = sessions.find((s) => s._id === currentSessionId);

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
                session={currentSession} // Pass the full session object
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
