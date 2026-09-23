import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bot, X, Mic, Send, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

function AIChatbot() {
  const { token, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am SchemeSathi AI. How can I help you find government schemes today?' }]);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [botLang, setBotLang] = useState('en');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Preload TTS voices
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => synth.getVoices();
    }
  }, []);

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

  const speak = (text, lang = 'en') => {
    if (!isSpeaking || !synth) return;
    synth.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    // basic cleanup for voice
    utterance.text = text.replace(/[*#]/g, ''); 
    
    const targetLang = getTTSLang(lang);
    utterance.lang = targetLang;

    // Retry fetching voices if empty
    let voices = synth.getVoices();
    if (voices.length === 0) {
      setTimeout(() => {
        voices = synth.getVoices();
        setVoiceAndSpeak(utterance, voices, targetLang, lang);
      }, 50);
      return;
    }
    
    setVoiceAndSpeak(utterance, voices, targetLang, lang);
  };

  const setVoiceAndSpeak = (utterance, voices, targetLang, lang) => {
    let voice = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase());
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(lang));
    }
    // Final fallback: try searching by name
    if (!voice && lang === 'hi') {
       voice = voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
    }
    
    if (voice) {
      utterance.voice = voice;
    }
    
    synth.speak(utterance);
  };



  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const lang = botLang;

      const res = await axios.post('/api/ai/chat', { message: text, language: lang }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const aiReply = res.data.reply;
      setMessages((prev) => [...prev, { role: 'ai', text: aiReply }]);
      speak(aiReply, lang);
    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role === 'admin') return null; // Hide for admin/unauthenticated

  return (
    <div className="ai-chatbot-wrapper">
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <Bot size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} /> SchemeSathi AI
            </div>
            <div className="chatbot-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={botLang} 
                onChange={(e) => setBotLang(e.target.value)}
                style={{ fontSize: '12px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
              <button onClick={() => { setIsSpeaking(!isSpeaking); synth.cancel(); }} title={isSpeaking ? "Mute Voice" : "Enable Voice"}>
                {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="chat-message ai loading">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about schemes..."
            />
            <button className="send-btn" onClick={() => handleSend()}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatbot;
