import "./App.css";
import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspacesProvider } from "./contexts/WorkspaceContext";
import { AppRouter } from "./router/AppRouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import SettingsDrawer from "./components/SettingsDrawer";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  useEffect(() => {
    const enforceFullscreen = async () => {
      try {
        const win = getCurrentWindow();
        await win.setFullscreen(true);
      } catch {
        // ignore when running in a browser without the Tauri API
      }
    };

    enforceFullscreen();
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <WorkspacesProvider>
              <AppRouter />
              <SettingsDrawer />
            </WorkspacesProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
