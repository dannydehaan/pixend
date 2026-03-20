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
