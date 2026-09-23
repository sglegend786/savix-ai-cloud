import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSpeech, setAiSpeech] = useState('');
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [history, setHistory] = useState([]);
  const [autoListen, setAutoListen] = useState(true);
  
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;
  
  const autoListenRef = useRef(true);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isAwakeRef = useRef(false);
  const awakeTimerRef = useRef(null);

  useEffect(() => {
    autoListenRef.current = autoListen;
  }, [autoListen]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Default, AI handles parsing

      recognition.onstart = () => {
        setIsListening(true);
        setShowVoiceUI(true);
      };

      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        const lowerText = text.toLowerCase();
        
        // Relaxed regex: starts with any Sav/Sab sounding prefix, followed by AI
        const wakeWordRegex = /(sav|sab|sev|sib|say|sub|shiv|shab|serve)[a-z]*\s*(ai|a i|hi|hai|i)/i;
        
        // Only enforce wake word if in continuous listening mode
        if (autoListenRef.current) {
           if (isAwakeRef.current) {
              // System is awake, accept the next phrase as a command!
              clearTimeout(awakeTimerRef.current);
              isAwakeRef.current = false;
              
              if (!text.trim()) return;
              import('react-toastify').then(({ toast }) => toast.success(`Command: "${text}"`, { autoClose: 1500, position: "bottom-center" }));
              
              setTranscript(text);
              setHistory(prev => [...prev, { role: 'user', text }]);
              await processIntent(text);
              return;
           }

           const match = lowerText.match(wakeWordRegex);
           if (!match) {
             console.log("Ignored transcript (No wake word 'Savix AI'):", text);
             import('react-toastify').then(({ toast }) => {
                toast.info(`Heard: "${text}" (Say 'Savix AI' to trigger)`, { autoClose: 2000, position: "bottom-center" });
             });
             return; // Ignore completely
           }

           // Strip the wake word
           const commandText = lowerText.replace(wakeWordRegex, '').trim();
           
           if (!commandText) {
              // User just said "Savix AI" and paused. Wake up!
              isAwakeRef.current = true;
              import('react-toastify').then(({ toast }) => toast.success("Listening... Speak your command now!", { autoClose: 3000, position: "bottom-center" }));
              
              awakeTimerRef.current = setTimeout(() => {
                 isAwakeRef.current = false;
                 import('react-toastify').then(({ toast }) => toast.error("Command timed out.", { autoClose: 2000, position: "bottom-center" }));
              }, 6000); // Wait up to 6 seconds for the next phrase
              return;
           }

           // They said the command in the same breath
           setTranscript(commandText);
           setHistory(prev => [...prev, { role: 'user', text: commandText }]);
           await processIntent(commandText);
        } else {
           // Manual click - process anything
           setTranscript(text);
           setHistory(prev => [...prev, { role: 'user', text }]);
           await processIntent(text);
        }
      };

      recognition.onerror = (event) => {
        console.log("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (autoListenRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
           setTimeout(() => {
             try { recognition.start(); } catch(e) {}
           }, 300);
        }
      };

      recognitionRef.current = recognition;
    }
    
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => synth.getVoices();
    }

    const handleFirstClick = () => {
      if (recognitionRef.current && !isListening) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);

    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, [token]);

  const toggleListen = () => {
    if (isListening) {
      setAutoListen(false);
      recognitionRef.current?.stop();
    } else {
      setAutoListen(true);
      synth.cancel();
      if (audioRef) audioRef.pause();
      setAiSpeech('');
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const getTTSLang = (gLang) => {
    const map = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN'
    };
    return map[gLang] || 'en-IN';
  };

  const [audioRef, setAudioRef] = useState(null);

  const speak = (text, lang = 'en') => {
    setAiSpeech(text);
    
    // Stop any currently playing audio
    if (audioRef) {
      audioRef.pause();
    }
    if (synth) synth.cancel();
    
    const cleanedText = text.replace(/[*#]/g, ''); 
    isSpeakingRef.current = true;
    recognitionRef.current?.stop();
    
    // For non-English languages, force Google Translate TTS to guarantee native voice
    if (lang !== 'en') {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanedText)}`;
      const audio = new Audio(audioUrl);
      setAudioRef(audio);
      audio.onended = () => {
        isSpeakingRef.current = false;
        if (autoListenRef.current && !isProcessingRef.current) {
          try { recognitionRef.current?.start(); } catch(e) {}
        }
      };
      audio.play().catch(err => {
        console.error("Google TTS playback failed, falling back to native synth:", err);
        playNativeSynth(cleanedText, lang);
      });
      return;
    }

    playNativeSynth(cleanedText, lang);
  };

  const playNativeSynth = (text, lang) => {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = getTTSLang(lang);
    utterance.lang = targetLang;

    let voices = synth.getVoices();
    const setVoiceAndSpeak = () => {
      let voice = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase());
      if (!voice) voice = voices.find(v => v.lang.startsWith(lang));
      if (!voice && lang === 'hi') voice = voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
      
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        isSpeakingRef.current = false;
        if (autoListenRef.current && !isProcessingRef.current) {
          try { recognitionRef.current?.start(); } catch(e) {}
        }
      };
      synth.speak(utterance);
    };

    if (voices.length === 0) {
      setTimeout(() => {
        voices = synth.getVoices();
        setVoiceAndSpeak();
      }, 50);
    } else {
      setVoiceAndSpeak();
    }
  };

  const processIntent = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    
    try {
      // Determine language context
      let lang = 'en';
      const combo = document.querySelector('.goog-te-combo');
      if (combo && combo.value) lang = combo.value;
      
      // Get some context data from the page if we are on a scheme page
      let contextData = null;
      if (location.pathname.startsWith('/scheme/')) {
        const titleEl = document.querySelector('h1');
        contextData = { currentScheme: titleEl ? titleEl.innerText : 'Unknown Scheme' };
      }

      const res = await axios.post('/api/ai/intent', {
        transcript: text,
        currentUrl: location.pathname,
        contextData,
        conversationHistory: history.slice(-5) // Send last 5 messages for context
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const intent = res.data.intent;
      console.log('Parsed Intent:', intent);
      
      setHistory(prev => [...prev, { role: 'ai', text: intent.reply }]);
      speak(intent.reply, intent.language || lang);
      
      executeAction(intent);

    } catch (error) {
      console.error("Intent processing error", error);
      speak("I'm sorry, I encountered an error processing your command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = (intent) => {
    switch (intent.action) {
      case 'NAVIGATE':
        if (intent.target) navigate(intent.target);
        break;
      case 'SEARCH':
        if (intent.filters) {
          const queryParams = new URLSearchParams();
          if (intent.filters.state) queryParams.set('state', intent.filters.state);
          if (intent.filters.category) queryParams.set('category', intent.filters.category);
          if (intent.filters.gender) queryParams.set('gender', intent.filters.gender);
          if (intent.filters.age) queryParams.set('age', intent.filters.age);
          if (intent.filters.isStudent) queryParams.set('isStudent', 'true');
          if (intent.filters.isFarmer) queryParams.set('isFarmer', 'true');
          navigate(`/find-schemes?${queryParams.toString()}`);
        } else if (intent.query) {
          navigate(`/find-schemes?query=${encodeURIComponent(intent.query)}`);
        }
        break;
      case 'AUTO_COMPARE':
        if (intent.query) navigate(`/compare?autoCompare=${encodeURIComponent(intent.query)}`);
        break;
      case 'INTERACTIVE_COMPARE':
        if (intent.target) navigate(intent.target);
        // The backend already provided the question in intent.reply
        break;
      case 'INTERACTIVE_SEARCH':
        if (intent.target) {
          const queryParams = new URLSearchParams();
          if (intent.filters) {
             if (intent.filters.state) queryParams.set('state', intent.filters.state);
             if (intent.filters.category) queryParams.set('category', intent.filters.category);
             if (intent.filters.gender) queryParams.set('gender', intent.filters.gender);
             if (intent.filters.age) queryParams.set('age', intent.filters.age);
             if (intent.filters.isStudent) queryParams.set('isStudent', 'true');
             if (intent.filters.isFarmer) queryParams.set('isFarmer', 'true');
          }
          const queryString = queryParams.toString();
          navigate(queryString ? `${intent.target}?${queryString}` : intent.target);
        }
        break;
      case 'SCROLL':
        if (intent.direction === 'down') window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        else if (intent.direction === 'up') window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        else if (intent.direction === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (intent.direction === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
      case 'ACCESSIBILITY':
        if (intent.command === 'dark_mode') {
           document.body.classList.add('dark-mode');
        } else if (intent.command === 'light_mode') {
           document.body.classList.remove('dark-mode');
        } else if (intent.command === 'font_increase') {
           document.body.style.fontSize = '120%';
        } else if (intent.command === 'font_decrease') {
           document.body.style.fontSize = '100%';
        } else if (intent.command === 'high_contrast') {
           document.body.style.filter = 'contrast(1.5)';
        }
        break;
      case 'SPEAK':
      case 'EXPLAIN':
      case 'UNKNOWN':
      default:
        // Already handled by speak(intent.reply)
        break;
    }
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      isProcessing,
      transcript,
      aiSpeech,
      showVoiceUI,
      setShowVoiceUI,
      toggleListen,
      history,
      autoListen,
      setAutoListen
    }}>
      {children}
    </VoiceContext.Provider>
  );
};
