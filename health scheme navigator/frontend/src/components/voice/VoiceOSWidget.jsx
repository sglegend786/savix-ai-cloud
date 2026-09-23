import React, { useContext, useEffect, useRef } from 'react';
import { VoiceContext } from '../../context/VoiceContext';
import { Mic, X, Minimize2, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './VoiceOS.css';

const VoiceOSWidget = () => {
  const { 
    isListening, 
    isProcessing, 
    transcript, 
    aiSpeech, 
    showVoiceUI, 
    setShowVoiceUI, 
    toggleListen, 
    history,
    recognitionRef,
    token
  } = useContext(VoiceContext);

  const [expanded, setExpanded] = React.useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, aiSpeech, transcript]);

  return null;
};

export default VoiceOSWidget;
