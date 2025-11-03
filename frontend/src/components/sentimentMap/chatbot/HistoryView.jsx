import React from "react";
import { X, Bot, Plus, Trash2 } from "lucide-react";

const HistoryView = ({
  sessions,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onClose,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center gap-3 bg-gradient-to-r from-[#2F4B4E] to-[#42676B] p-6 text-white shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5" />
          <h2 className="font-bold text-xl">SentiAI</h2>
          <button
            onClick={onNewSession}
            className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
            title="New Chat"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-white hover:text-[#E1E6C3] transition-colors shrink-0"
            title="Close Sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Session History List */}
      <div className="flex flex-col flex-1 space-y-2 p-3 overflow-y-auto">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            // Use first user message as title, or "New Chat"
            const title = session.messages[0]?.content || "New Chat";
            return (
              <button
                key={session._id}
                onClick={() => onSelectSession(session._id)}
                className="group flex justify-between items-center gap-3 hover:bg-gray-100 p-4 rounded-lg w-full text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    Last updated:{" "}
                    {new Date(session.lastActivity).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => onDeleteSession(e, session._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0"
                  title="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>
            );
          })
        ) : (
          <div className="m-auto text-gray-500 text-center">
            <p>No chat history.</p>
            <p className="text-sm">Click '+' to start a new chat.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryView;
