import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('language', language);
    // Language switching is handled by Google Translate Widget script in index.html
  }, [language]);

  const t = (key) => key; // Dummy translation function since Google Translate handles DOM

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
