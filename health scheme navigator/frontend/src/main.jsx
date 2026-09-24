import axios from 'axios';
axios.defaults.baseURL = 'https://savix-scheme-api.onrender.com';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { BrowserRouter } from "react-router-dom";

import { VoiceProvider } from "./context/VoiceContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <VoiceProvider>
            <App />
          </VoiceProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
