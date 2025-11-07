import React from "react";
import { X, Bot, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";

const HistoryView = ({
  sessions,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onClose,
  loading = false,
  error = null,
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
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 mx-3 px-3 py-2 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center gap-3 m-auto text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading conversations...</p>
          </div>
        ) : Array.isArray(sessions) && sessions.length > 0 ? (
          sessions.map((session) => {
            // Safely get first user message as title
            const messages = Array.isArray(session.messages) ? session.messages : [];
            const firstMessage = messages.find(m => m.role === 'user');
            const title = firstMessage?.content?.substring(0, 60) || "New Chat";
            const displayTitle = title.length > 60 ? title + "..." : title;
            
            return (
              <button
                key={session.sessionId || session._id}
                onClick={() => onSelectSession(session.sessionId)}
                className="group flex justify-between items-center gap-3 hover:bg-gray-100 p-4 rounded-lg w-full text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {displayTitle}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    Last updated:{" "}
                    {session.lastActivity 
                      ? new Date(session.lastActivity).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
                <button
                  onClick={(e) => onDeleteSession(e, session.sessionId)}
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
