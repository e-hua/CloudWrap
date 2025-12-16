import { createContext, useContext, useState, useEffect } from "react";
import React from "react";
import Cookies from "js-cookie";

type ThemeType = "dark" | "light";

const ThemeContext = createContext<ThemeType>("dark");
const ThemeSetterContext = createContext((val: ThemeType) => {
  console.log(val);
});

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentState, setCurrentState] = useState<ThemeType>(() => {
    return (Cookies.get("theme") as ThemeType | undefined) || "light";
  });

  useEffect(() => {
    Cookies.set("theme", currentState);

    document.documentElement.setAttribute("data-theme", currentState);

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(currentState);
  }, [currentState]);

  return (
    <ThemeContext.Provider value={currentState}>
      <ThemeSetterContext.Provider value={setCurrentState}>
        <div className="bg-background h-full">{children}</div>
      </ThemeSetterContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  if (!useContext(ThemeContext)) {
    throw new Error("useTheme must be used within a context provider");
  }
  return useContext(ThemeContext);
}

export function useThemeSetter() {
  if (!useContext(ThemeSetterContext)) {
    throw new Error("useThemeSetter must be used within a context provider");
  }
  return useContext(ThemeSetterContext);
}

export type { ThemeType };
