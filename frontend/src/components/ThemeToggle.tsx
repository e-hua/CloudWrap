import { Sun, Moon } from "lucide-react";
import { useTheme, useThemeSetter } from "../hooks/UseTheme";
import React from "react";

export default function ThemeToggle() {
  const theme = useTheme();
  const themeSetter = useThemeSetter();

  const isDark = theme === "dark";

  const toggleTheme = () => {
    if (isDark) {
      themeSetter("light");
    } else {
      themeSetter("dark");
    }
  };

  return (
    <div className="text-text-primary" onClick={toggleTheme}>
      {isDark ? <Sun /> : <Moon />}
    </div>
  );
}
