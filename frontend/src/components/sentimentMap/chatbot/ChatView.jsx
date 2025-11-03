import React from "react";
import { X, ArrowLeft, Send } from "lucide-react";

const ChatView = ({ session, onBack, onClose }) => {
  // If a session object is passed, use its title.
  // Otherwise, it's a new chat, so show "New Chat".
  const title = session ? session.title : "New Chat";

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center gap-3 bg-gradient-to-r from-[#2F4B4E] to-[#42676B] p-6 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
            title="Back to History"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-xl truncate" title={title}>
            {title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
          title="Close Sidebar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex flex-col flex-1 p-6 overflow-y-auto">
        <div className="m-auto text-gray-500 text-center">
          <p>Chat interface for</p>
          <p className="font-semibold text-gray-700">
            {session ? session.title : "New Chat"}
          </p>
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="bg-gray-50 p-4 border-gray-200 border-t">
        <form className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#4B7069] focus:ring-1 w-full"
          />
          <button
            type="submit"
            className="bg-[#42676B] hover:bg-[#2F4B4E] p-2 rounded-lg text-white transition-colors shrink-0"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatView;
