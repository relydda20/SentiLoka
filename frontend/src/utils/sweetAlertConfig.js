import Swal from "sweetalert2";

/**
 * Custom SweetAlert2 configurations matching SentiLoka's design system
 * Colors: #2F4B4E (dark teal), #5F7F7A (secondary teal), #E8E5D5 (light cream)
 */

// Base configuration with responsive settings
const baseConfig = {
  customClass: {
    popup: "swal-popup-sentiloka",
    title: "swal-title-sentiloka",
    htmlContainer: "swal-html-sentiloka",
    confirmButton: "swal-confirm-btn",
    cancelButton: "swal-cancel-btn",
  },
  buttonsStyling: false,
  showClass: {
    popup: "animate-fade-in",
  },
  hideClass: {
    popup: "animate-fade-out",
  },
};

/**
 * Success alert with teal theme
 */
export const showSuccessAlert = (title, text = "") => {
  return Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text,
    iconColor: "#5F7F7A",
    confirmButtonText: "Got it!",
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * Error alert with red theme
 */
export const showErrorAlert = (title, text = "") => {
  return Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text,
    iconColor: "#ef4444",
    confirmButtonText: "Okay",
  });
};

/**
 * Confirmation dialog for destructive actions
 */
export const showConfirmDialog = ({
  title,
  text,
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Cancel",
  icon = "warning",
}) => {
  return Swal.fire({
    ...baseConfig,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    iconColor: "#f59e0b",
    reverseButtons: true,
    focusCancel: true,
  });
};

/**
 * Info alert with neutral theme
 */
export const showInfoAlert = (title, text = "") => {
  return Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text,
    iconColor: "#5F7F7A",
    confirmButtonText: "Okay",
  });
};

/**
 * Success alert with custom HTML content (for detailed messages)
 */
export const showSuccessAlertWithHtml = (title, html) => {
  return Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    html,
    iconColor: "#5F7F7A",
    confirmButtonText: "Got it!",
    timer: 4000,
    timerProgressBar: true,
  });
};

/**
 * Inject custom styles for SentiLoka theme
 * Call this once in your main app component
 */
export const injectSweetAlertStyles = () => {
  if (document.getElementById("sentiloka-swal-styles")) return;

  const style = document.createElement("style");
  style.id = "sentiloka-swal-styles";
  style.textContent = `
    /* Popup container with rounded corners and responsive sizing */
    .swal-popup-sentiloka {
      border-radius: 1rem !important;
      padding: 2rem !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
      max-width: 90vw !important;
    }

    @media (min-width: 640px) {
      .swal-popup-sentiloka {
        padding: 2.5rem !important;
        max-width: 32rem !important;
      }
    }

    /* Title styling with teal color */
    .swal-title-sentiloka {
      color: #2F4B4E !important;
      font-size: 1.5rem !important;
      font-weight: 600 !important;
      margin-bottom: 0.75rem !important;
      font-family: 'Mate SC', serif !important;
    }

    @media (min-width: 640px) {
      .swal-title-sentiloka {
        font-size: 1.875rem !important;
      }
    }

    /* HTML content styling */
    .swal-html-sentiloka {
      color: #4b5563 !important;
      font-size: 0.875rem !important;
      line-height: 1.5 !important;
      margin: 0 !important;
    }

    @media (min-width: 640px) {
      .swal-html-sentiloka {
        font-size: 1rem !important;
      }
    }

    /* Confirm button - teal gradient */
    .swal-confirm-btn {
      background: linear-gradient(to right, #2F4B4E, #42676B) !important;
      color: white !important;
      padding: 0.625rem 1.5rem !important;
      border-radius: 0.75rem !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      border: none !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      min-width: 100px !important;
    }

    .swal-confirm-btn:hover {
      background: linear-gradient(to right, #42676B, #4B7069) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
      transform: translateY(-1px) !important;
    }

    .swal-confirm-btn:focus {
      outline: 2px solid #5F7F7A !important;
      outline-offset: 2px !important;
    }

    @media (min-width: 640px) {
      .swal-confirm-btn {
        padding: 0.75rem 2rem !important;
        font-size: 1rem !important;
      }
    }

    /* Cancel button - light gray */
    .swal-cancel-btn {
      background-color: #f3f4f6 !important;
      color: #374151 !important;
      padding: 0.625rem 1.5rem !important;
      border-radius: 0.75rem !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      border: none !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      min-width: 100px !important;
    }

    .swal-cancel-btn:hover {
      background-color: #e5e7eb !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      transform: translateY(-1px) !important;
    }

    .swal-cancel-btn:focus {
      outline: 2px solid #9ca3af !important;
      outline-offset: 2px !important;
    }

    @media (min-width: 640px) {
      .swal-cancel-btn {
        padding: 0.75rem 2rem !important;
        font-size: 1rem !important;
      }
    }

    /* Actions container spacing */
    .swal2-actions {
      margin-top: 1.5rem !important;
      gap: 0.75rem !important;
      flex-wrap: wrap !important;
    }

    @media (min-width: 640px) {
      .swal2-actions {
        gap: 1rem !important;
      }
    }

    /* Icon sizing for mobile */
    .swal2-icon {
      width: 4rem !important;
      height: 4rem !important;
      margin: 0 auto 1.25rem !important;
    }

    @media (min-width: 640px) {
      .swal2-icon {
        width: 5rem !important;
        height: 5rem !important;
      }
    }

    /* Timer progress bar with teal color */
    .swal2-timer-progress-bar {
      background-color: #5F7F7A !important;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-fade-out {
      animation: fadeOut 0.15s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    /* Backdrop styling */
    .swal2-backdrop-show {
      background-color: rgba(47, 75, 78, 0.15) !important;
      backdrop-filter: blur(4px) !important;
    }

    /* Mobile optimizations */
    @media (max-width: 639px) {
      .swal2-popup {
        width: calc(100vw - 2rem) !important;
        margin: 1rem !important;
      }

      .swal2-actions {
        width: 100% !important;
      }

      .swal-confirm-btn,
      .swal-cancel-btn {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
};
