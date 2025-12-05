import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Calendar, User, Clock, Utensils } from 'lucide-react';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I can help you book a table. When would you like to come?" }
  ]);
  const [bookingData, setBookingData] = useState(null);
  
  // REFS 
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const messagesRef = useRef(messages); // Keeps track of latest messages

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Capture one sentence at a time
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    } else {
      alert("Browser not supported. Please use Chrome.");
    }
  }, []);

  const speak = (text) => {
    // Cancel any ongoing speech to avoid overlap
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current.speak(utterance);
  };

  const handleUserMessage = async (text) => {
    // 1. Get the latest history from REF
    const currentHistory = messagesRef.current;
    
    // 2. Optimistically add user message to UI
    const newHistory = [...currentHistory, { role: 'user', content: text }];
    setMessages(newHistory);

    try {
      // 3. Send FULL history to Backend
      const response = await axios.post('http://localhost:5000/api/bookings/chat', {
        userText: text,
        history: newHistory.filter(m => m.role !== 'system') 
      });

      const { reply, isComplete, bookingDetails } = response.data;

      // 4. Update UI with Bot Reply
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);

      if (bookingDetails) setBookingData(bookingDetails);

    } catch (error) {
      console.error("API Error", error);
      const errorMsg = "I'm having trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      speak(errorMsg);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-6 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Vaiu AI Booking Agent
        </h1>
        <p className="text-slate-400 mt-2">Voice-First Restaurant Reservations</p>
      </header>

      {/* Main Chat Interface */}
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-700 text-slate-200 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-850 border-t border-slate-700 flex justify-center pb-8">
          <button
            onClick={toggleListening}
            className={`p-6 rounded-full transition-all duration-300 shadow-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>
      </div>

      {/* Live Booking Data Visualization */}
      {bookingData && (
        <div className="mt-8 w-full max-w-lg bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">Current Booking Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-slate-400" />
              <span>{bookingData.numberOfGuests || '-'} Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span>{bookingData.date || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <span>{bookingData.time || '-'}</span>
            </div>
             <div className="flex items-center gap-2">
              <Utensils size={18} className="text-slate-400" />
              <span>{bookingData.cuisine || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;