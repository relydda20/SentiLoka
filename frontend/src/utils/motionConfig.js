export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  transition: springTransition,
};

export const hoverLift = {
  whileHover: { y: -2 },
  transition: springTransition,
};

export const hoverShadow = {
  whileHover: {
    boxShadow: "0px 6px 12px rgba(0,0,0,0.15)",
  },
  transition: springTransition,
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.8 },
  whileHover: { opacity: 1, scale: 1 },
  transition: { duration: 0.2 },
};

export const dropdownMotion = {
  initial: { opacity: 0, x: 10, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0.2, x: 10, scale: 0.95 },
  transition: { duration: 0.2 },
};

export const hoverScaleTapShadow = {
  whileHover: {
    scale: 1.05,
    y: -1,
    boxShadow: "0px 6px 12px rgba(0,0,0,0.15)",
  },
  whileTap: { scale: 0.95, y: 0, boxShadow: "0px 2px 6px rgba(0,0,0,0.1)" },
  transition: springTransition,
};

export const hoverScaleTap = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: springTransition,
};
