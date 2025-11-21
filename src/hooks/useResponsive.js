import { useState, useEffect } from "react";

const BREAKPOINT = 900;

export const useResponsive = () => {
  const [isWideScreen, setIsWideScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= BREAKPOINT;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isWideScreen;
};

export default useResponsive;
