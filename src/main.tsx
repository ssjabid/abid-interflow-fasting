import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { FastProvider } from "./context/FastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AchievementProvider } from "./context/AchievementContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FastProvider>
          <AchievementProvider>
            <App />
          </AchievementProvider>
        </FastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
