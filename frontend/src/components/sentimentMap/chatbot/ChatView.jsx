import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, Send, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LocationSelectorButton from "./LocationSelectorButton";
import LocationSelectorDropdown from "./LocationSelectorDropdown";
import SelectedLocationChips from "./SelectedLocationChips";
import { sendChatMessage } from "../../../services/chatbotService";

/**
 * A component to render a single chat bubble.
 * Now supports Markdown for assistant messages.
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  const bubbleBaseStyles =
    "max-w-[85%] px-4 py-3 rounded-lg shadow-md text-sm";

  // User bubble: remains plain text with whitespace preserved
  const userStyles =
    "bg-[#42676B] text-white rounded-br-none whitespace-pre-wrap";

  // Assistant bubble: styles for markdown content
  const assistantStyles = `
    bg-gray-100 text-gray-800 rounded-bl-none
    [&>p]:my-0 [&>p:not(:last-child)]:mb-2
    [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:list-inside
    [&>ul]:my-2 [&>ul]:list-disc [&>ul]:list-inside
    [&>strong]:font-semibold
  `;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          ${bubbleBaseStyles} 
          ${isUser ? userStyles : assistantStyles}
        `}
      >
        {isUser ? (
          // Render user content as plain text
          message.content
        ) : (
          // Render assistant content as Markdown
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

/**
 * The main chat view component.
 */
const ChatView = ({ 
  session, 
  onBack, 
  onClose,
  // Location attachment props
  availableLocations = [],
  selectedLocationIds = [],
  selectedLocations = [],
  onLocationSelectionChange,
  onRemoveLocation,
  isLocationDropdownOpen,
  onToggleLocationDropdown,
  locationsLoading,
  locationsError,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize messages from session or empty array
  useEffect(() => {
    if (session) {
      setMessages(session.messages || []);
      setCurrentSessionId(session._id);
    } else {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [session]);

  // Title for chat header
  const title = messages.length > 0 
    ? messages[0]?.content?.substring(0, 50) + (messages[0]?.content?.length > 50 ? "..." : "")
    : "New Chat";

  // Auto-scroll to the bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!input.trim()) return;
    
    if (selectedLocationIds.length === 0) {
      setError("Please attach at least one location before sending a message.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setIsLoading(true);

    // Add user message optimistically
    const optimisticUserMessage = {
      role: "user",
      content: userMessage,
      _id: `temp_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      // Build conversation history from current messages
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send message to backend
      const response = await sendChatMessage({
        message: userMessage,
        locationIds: selectedLocationIds,
        conversationHistory,
        sessionId: currentSessionId,
      });

      // Update session ID if it's a new conversation
      if (!currentSessionId && response.sessionId) {
        setCurrentSessionId(response.sessionId);
      }

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        content: response.response,
        _id: `assistant_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Close location dropdown after successful send
      if (isLocationDropdownOpen) {
        onToggleLocationDropdown();
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticUserMessage._id));
      
      // Show error message
      const errorMsg = error.response?.data?.error || error.message || "Failed to send message. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Chat Content - Message list */}
      <div className="flex flex-col flex-1 space-y-4 p-6 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        ) : (
          <div className="m-auto text-gray-500 text-center">
            <p>This is a new chat.</p>
            <p className="text-sm">Attach locations and ask questions about customer reviews.</p>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-gray-100 shadow-md px-4 py-3 rounded-lg max-w-xs">
              <div className="flex gap-1">
                <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="text-gray-600 text-sm">Analyzing reviews...</span>
            </div>
          </div>
        )}
        
        {/* Empty div for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="bg-gray-50 p-4 border-gray-200 border-t">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 mb-3 px-3 py-2 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Locations Error */}
        {locationsError && (
          <div className="flex items-center gap-2 bg-amber-50 mb-3 px-3 py-2 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{locationsError}</span>
          </div>
        )}

        {/* Selected Location Chips */}
        <SelectedLocationChips
          selectedLocations={selectedLocations}
          onRemove={onRemoveLocation}
        />

        {/* Input Form */}
        <form className="relative flex items-center gap-2" onSubmit={handleSubmit}>
          {/* Location Selector Dropdown */}
          <div className="relative">
            <LocationSelectorButton
              selectedCount={selectedLocationIds.length}
              onToggle={onToggleLocationDropdown}
              isOpen={isLocationDropdownOpen}
              disabled={isLoading}
            />
            
            <LocationSelectorDropdown
              locations={availableLocations}
              selectedIds={selectedLocationIds}
              onSelect={onLocationSelectionChange}
              maxSelections={10}
              isOpen={isLocationDropdownOpen}
              loading={locationsLoading}
            />
          </div>

          {/* Message Input */}
          <input
            type="text"
            placeholder={
              selectedLocationIds.length === 0
                ? "Attach locations first..."
                : "Ask about customer reviews..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#4B7069] focus:ring-1 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !input.trim() || selectedLocationIds.length === 0}
            className="bg-[#42676B] hover:bg-[#2F4B4E] disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg text-white transition-colors shrink-0"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Helper text */}
        {selectedLocationIds.length === 0 && (
          <p className="mt-2 text-center text-gray-500 text-xs">
            📎 Click the paperclip to attach locations for analysis
          </p>
        )}
      </div>
    </>
  );
};

export default ChatView;
