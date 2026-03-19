import "./App.css";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspacesProvider } from "./contexts/WorkspaceContext";
import { AppRouter } from "./router/AppRouter";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <WorkspacesProvider>
        <AppRouter />
        </WorkspacesProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
