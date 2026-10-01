import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./app/App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);