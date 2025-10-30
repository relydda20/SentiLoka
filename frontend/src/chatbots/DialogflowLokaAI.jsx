import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Global flag to prevent multiple script loads
let isDialogflowLoaded = false;
let isDialogflowLoading = false;
const loadListeners = [];

const DialogflowLokaAI = () => {
  const [isLoaded, setIsLoaded] = useState(isDialogflowLoaded);

  useEffect(() => {
    // If already loaded, just set state
    if (isDialogflowLoaded) {
      setIsLoaded(true);
      return;
    }

    // Add this component to the queue
    loadListeners.push(setIsLoaded);

    // If already loading, wait for it
    if (isDialogflowLoading) {
      return;
    }

    // Mark as loading
    isDialogflowLoading = true;

    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="df-messenger.js"]',
    );
    const existingLink = document.querySelector(
      'link[href*="df-messenger-default.css"]',
    );

    if (existingScript && existingLink) {
      // Scripts already loaded
      isDialogflowLoaded = true;
      isDialogflowLoading = false;
      loadListeners.forEach((listener) => listener(true));
      return;
    }

    // Load Dialogflow messenger script
    const script = document.createElement("script");
    script.src =
      "https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js";
    script.async = true;
    script.onload = () => {
      isDialogflowLoaded = true;
      isDialogflowLoading = false;
      // Notify all waiting components
      loadListeners.forEach((listener) => listener(true));
      loadListeners.length = 0; // Clear the queue
    };
    script.onerror = () => {
      isDialogflowLoading = false;
      console.error("Failed to load Dialogflow messenger script");
    };

    // Only append if not already in DOM
    if (!existingScript) {
      document.body.appendChild(script);
    }

    // Load Dialogflow messenger styles
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css";
      document.head.appendChild(link);
    }

    // Check if custom styles already exist
    const existingCustomStyles = document.getElementById(
      "dialogflow-custom-styles",
    );

    if (!existingCustomStyles) {
      // Create and inject custom styles
      const styleElement = document.createElement("style");
      styleElement.id = "dialogflow-custom-styles";
      styleElement.textContent = `
        df-messenger {
          z-index: 999;
          position: fixed;
          bottom: 20px;
          right: 20px;

          /* SentiLoka Theme Colors - Matching your design system */
          --df-messenger-font-color: #2f4b4e;
          --df-messenger-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

          /* Chat window background */
          --df-messenger-chat-background: #faf6e9;
          --df-messenger-chat-background-color: #faf6e9;

          /* User messages (your brand color) */
          --df-messenger-message-user-background: #2f4b4e;
          --df-messenger-message-user-font-color: #faf6e9;

          /* Bot messages */
          --df-messenger-message-bot-background: #ffffff;
          --df-messenger-message-bot-font-color: #2f4b4e;
          --df-messenger-message-bot-border: 1px solid #e5e7eb;

          /* Input box */
          --df-messenger-input-box-background: #ffffff;
          --df-messenger-input-font-color: #2f4b4e;
          --df-messenger-input-placeholder-font-color: #9ca3af;

          /* Send button */
          --df-messenger-send-icon: #2f4b4e;
          --df-messenger-send-icon-color-hover: #1a2d2f;

          /* Title bar */
          --df-messenger-button-titlebar-color: #2f4b4e;
          --df-messenger-button-titlebar-font-color: #faf6e9;

          /* Chat bubble */
          --df-messenger-chat-bubble-background: #2f4b4e;
          --df-messenger-chat-bubble-icon-color: #faf6e9;
          --df-messenger-minimized-chat-close-icon-color: #faf6e9;

          /* Border radius and padding */
          --df-messenger-titlebar-padding: 18px 24px;
          --df-messenger-message-border-radius: 16px;
          --df-messenger-message-padding: 14px 18px;
          --df-messenger-input-box-padding: 14px 20px;
          --df-messenger-input-border-radius: 28px;
          --df-messenger-chat-border-radius: 20px;

          /* Typography */
          --df-messenger-font-size: 14px;
          --df-messenger-titlebar-font-size: 18px;

          /* Spacing */
          --df-messenger-message-spacing: 12px;
          --df-messenger-message-stack-spacing: 8px;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          df-messenger {
            bottom: 12px;
            right: 12px;
            left: 12px;
            --df-messenger-chat-window-height: calc(100vh - 120px);
            --df-messenger-chat-window-width: calc(100vw - 24px);
            --df-messenger-titlebar-font-size: 16px;
            --df-messenger-font-size: 14px;
          }

          df-messenger::part(chat-bubble) {
            width: 56px;
            height: 56px;
          }
        }

        /* Tablet */
        @media (min-width: 641px) and (max-width: 1024px) {
          df-messenger {
            bottom: 20px;
            right: 20px;
            --df-messenger-chat-window-height: 520px;
            --df-messenger-chat-window-width: 400px;
          }
        }

        /* Desktop */
        @media (min-width: 1025px) {
          df-messenger {
            bottom: 24px;
            right: 24px;
            --df-messenger-chat-window-height: 640px;
            --df-messenger-chat-window-width: 440px;
          }
        }

        /* Large desktop */
        @media (min-width: 1440px) {
          df-messenger {
            bottom: 32px;
            right: 32px;
          }
        }

        /* Enhanced shadows matching your design */
        df-messenger::part(chat-window) {
          box-shadow: 0 20px 60px rgba(47, 75, 78, 0.12),
            0 8px 24px rgba(47, 75, 78, 0.08),
            0 2px 8px rgba(47, 75, 78, 0.04);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(204, 213, 174, 0.2);
        }

        /* Chat bubble styling with hover effect */
        df-messenger::part(chat-bubble) {
          box-shadow: 0 8px 24px rgba(47, 75, 78, 0.2),
            0 4px 12px rgba(47, 75, 78, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(204, 213, 174, 0.3);
        }

        df-messenger::part(chat-bubble):hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 12px 32px rgba(47, 75, 78, 0.25),
            0 6px 16px rgba(47, 75, 78, 0.15);
          border-color: rgba(204, 213, 174, 0.5);
        }

        df-messenger::part(chat-bubble):active {
          transform: scale(1.02);
        }

        /* Title bar enhancement */
        df-messenger::part(titlebar) {
          background: linear-gradient(135deg, #2f4b4e 0%, #3a5c5f 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Input box styling */
        df-messenger::part(input-box) {
          border: 2px solid #e5e7eb;
          transition: border-color 0.2s ease;
        }

        df-messenger::part(input-box):focus-within {
          border-color: #ccd5ae;
          box-shadow: 0 0 0 3px rgba(204, 213, 174, 0.1);
        }

        /* Custom scrollbar */
        df-messenger::part(message-list) {
          scrollbar-width: thin;
          scrollbar-color: #ccd5ae #faf6e9;
        }

        df-messenger::part(message-list)::-webkit-scrollbar {
          width: 8px;
        }

        df-messenger::part(message-list)::-webkit-scrollbar-track {
          background: #faf6e9;
          border-radius: 4px;
        }

        df-messenger::part(message-list)::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ccd5ae 0%, #b8c499 100%);
          border-radius: 4px;
          border: 2px solid #faf6e9;
        }

        df-messenger::part(message-list)::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #b8c499 0%, #a4b085 100%);
        }

        /* Message animations */
        df-messenger::part(user-message),
        df-messenger::part(bot-message) {
          animation: messageSlideIn 0.3s ease-out;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Loading indicator */
        df-messenger::part(loading-indicator) {
          color: #ccd5ae;
        }

        /* Timestamp styling */
        df-messenger::part(message-timestamp) {
          color: #9ca3af;
          font-size: 12px;
        }

        /* Send button hover effect */
        df-messenger::part(send-button) {
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        df-messenger::part(send-button):hover {
          transform: scale(1.1);
          background-color: rgba(204, 213, 174, 0.1);
        }

        df-messenger::part(send-button):active {
          transform: scale(0.95);
        }

        /* Smooth fade in animation */
        df-messenger {
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Accessibility: Focus styles */
        df-messenger::part(input-box):focus-visible {
          outline: 3px solid #ccd5ae;
          outline-offset: 2px;
        }

        
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Cleanup function - but DON'T remove global scripts
    return () => {
      // Remove this component from the listeners queue
      const index = loadListeners.indexOf(setIsLoaded);
      if (index > -1) {
        loadListeners.splice(index, 1);
      }
      // Don't remove scripts/styles as they're global and may be used by other instances
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <df-messenger
            project-id="loka-ai"
            agent-id="c1b7a670-f33f-45a2-ac62-41a57e64c9e2"
            language-code="en"
            max-query-length="-1"
          >
            <df-messenger-chat-bubble chat-title="LokaAI"></df-messenger-chat-bubble>
          </df-messenger>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DialogflowLokaAI;
