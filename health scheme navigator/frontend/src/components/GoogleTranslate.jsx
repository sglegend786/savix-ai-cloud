import React, { useEffect } from 'react';

const GoogleTranslate = () => {
  useEffect(() => {
    // Prevent double initialization in React strict mode
    if (document.getElementById('google-translate-script')) {
      return;
    }

    // Set up the initialization callback
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
    };

    // Load the script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div 
      id="google_translate_element" 
      style={{ display: 'inline-block', margin: '0 15px', verticalAlign: 'middle' }}
    ></div>
  );
};

export default GoogleTranslate;
