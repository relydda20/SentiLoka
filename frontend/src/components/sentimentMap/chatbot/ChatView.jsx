import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, Send } from "lucide-react";
import ReactMarkdown from "react-markdown"; // <-- IMPORT
import remarkGfm from "remark-gfm"; // <-- IMPORT

/**
 * A component to render a single chat bubble.
 * Now supports Markdown for assistant messages.
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  const bubbleBaseStyles =
    "max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-md text-sm";

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
const ChatView = ({ session, onBack, onClose }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // If a session object is passed, use its first message as title.
  // Otherwise, it's a new chat.
  const title = session?.messages[0]?.content || "New Chat";

  // Auto-scroll to the bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // In a real app, you would send this message to your backend,
    // update the session state, and get a response.
    console.log("Sending message:", input);

    // Example of adding message locally (you'd get this from state management)
    // const newUserMessage = { role: 'user', content: input, _id: Date.now() };
    // onNewMessage(session._id, newUserMessage);

    setInput("");
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

      {/* Chat Content - This is now the message list */}
      <div className="flex flex-col flex-1 space-y-4 p-6 overflow-y-auto">
        {session && session.messages.length > 0 ? (
          session.messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        ) : (
          <div className="m-auto text-gray-500 text-center">
            <p>This is a new chat.</p>
            <p className="text-sm">Type your first message below to start.</p>
          </div>
        )}
        {/* Empty div for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="bg-gray-50 p-4 border-gray-200 border-t">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
