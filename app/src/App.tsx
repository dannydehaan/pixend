import "./App.css";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspacesProvider } from "./contexts/WorkspaceContext";
import { AppRouter } from "./router/AppRouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import SettingsDrawer from "./components/SettingsDrawer";

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <HashRouter>
          <AuthProvider>
            <WorkspacesProvider>
              <AppRouter />
              <SettingsDrawer />
            </WorkspacesProvider>
          </AuthProvider>
        </HashRouter>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
