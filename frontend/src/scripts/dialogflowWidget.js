// use in index.html to manage Dialogflow Messenger visibility and style
(function () {
  const messenger = document.getElementById("df-messenger-widget");

  // Route visibility management
  function updateMessengerVisibility() {
    const path = window.location.pathname;

    // Show only on landing page (root path)
    if (path === "/" || path === "") {
      messenger.classList.add("show-on-landing");
    } else {
      messenger.classList.remove("show-on-landing");
    }
  }

  // Initial check
  updateMessengerVisibility();

  // Listen for route changes (React Router)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (lastPath !== window.location.pathname) {
      lastPath = window.location.pathname;
      updateMessengerVisibility();
    }
  });

  // Observe body for changes (React Router updates)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen to popstate for back/forward navigation
  window.addEventListener("popstate", updateMessengerVisibility);

  // Fix scroll button color in Shadow DOM
  function fixScrollButtonColor() {
    if (!messenger.shadowRoot) {
      // Wait for shadow root to be available
      setTimeout(fixScrollButtonColor, 100);
      return;
    }

    const shadowRoot = messenger.shadowRoot;
    const scrollButton = shadowRoot.querySelector('[part="scroll-button"]');

    if (scrollButton) {
      // Apply SentiLoka brand color
      scrollButton.style.setProperty(
        "background-color",
        "#2f4b4e",
        "important",
      );
      scrollButton.style.setProperty("color", "#faf6e9", "important");
      scrollButton.style.setProperty(
        "border",
        "2px solid rgba(204, 213, 174, 0.3)",
        "important",
      );
      scrollButton.style.setProperty(
        "box-shadow",
        "0 4px 12px rgba(47, 75, 78, 0.3)",
        "important",
      );

      // Add hover effect
      scrollButton.addEventListener("mouseenter", function () {
        this.style.setProperty("background-color", "#3a5c5f", "important");
        this.style.setProperty(
          "box-shadow",
          "0 6px 16px rgba(47, 75, 78, 0.4)",
          "important",
        );
        this.style.setProperty(
          "border-color",
          "rgba(204, 213, 174, 0.5)",
          "important",
        );
      });

      scrollButton.addEventListener("mouseleave", function () {
        this.style.setProperty("background-color", "#2f4b4e", "important");
        this.style.setProperty(
          "box-shadow",
          "0 4px 12px rgba(47, 75, 78, 0.3)",
          "important",
        );
        this.style.setProperty(
          "border-color",
          "rgba(204, 213, 174, 0.3)",
          "important",
        );
      });

      // Add active/click effect
      scrollButton.addEventListener("mousedown", function () {
        this.style.setProperty("background-color", "#1a2d2f", "important");
      });

      scrollButton.addEventListener("mouseup", function () {
        this.style.setProperty("background-color", "#3a5c5f", "important");
      });
    }
  }

  // Apply fix when messenger loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(fixScrollButtonColor, 500);
    });
  } else {
    setTimeout(fixScrollButtonColor, 500);
  }

  // Re-apply fix when chat opens (for scroll button to appear)
  messenger.addEventListener("df-chat-open-changed", function (event) {
    if (event.detail.isOpen) {
      setTimeout(fixScrollButtonColor, 300);
    }
  });
})();
