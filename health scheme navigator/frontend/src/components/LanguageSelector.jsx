import React, { useContext, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी - Hindi' },
  { code: 'or', name: 'ଓଡ଼ିଆ - Odia' },
  { code: 'as', name: 'অসমীয়া - Assamese' },
  { code: 'bn', name: 'বাংলা - Bengali' },
  { code: 'gu', name: 'ગુજરાતી - Gujarati' },
  { code: 'kn', name: 'ಕನ್ನಡ - Kannada' },
  { code: 'ml', name: 'മലയാളം - Malayalam' },
  { code: 'mr', name: 'मराठी - Marathi' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ - Punjabi' },
  { code: 'ta', name: 'தமிழ் - Tamil' },
  { code: 'te', name: 'తెలుగు - Telugu' },
  { code: 'ur', name: 'اردو - Urdu' },
];

function LanguageSelector() {
  const { language, setLanguage } = useContext(LanguageContext);

  // Google Translate widget handles language changes natively. 
  // We no longer programmatically trigger it to prevent refresh loops.

  return (
    <select
      className="language-selector"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid #c2d6c9',
        background: '#f8faf8',
        color: '#17221b',
        fontWeight: '500',
        cursor: 'pointer',
        outline: 'none',
        marginRight: '12px'
      }}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}

export default LanguageSelector;
