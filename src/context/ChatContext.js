import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to your Socket.IO server (adjust URL if needed)
    socketRef.current = io('http://localhost:6001'); // Laravel Echo Server or custom Node

    // Listen for incoming messages
    socketRef.current.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing status
    socketRef.current.on('typing', () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1000);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchMessages = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      // Normally you'd fetch messages from backend API like:
      // const res = await axios.get(`/api/sessions/${sessionId}/messages`);
      // setMessages(res.data);
      
      // Temporary mock
      await new Promise(r => setTimeout(r, 500));
      setMessages([
        { id: 1, sender: 'counselor', text: 'Welcome to your session.', timestamp: Date.now() - 600000 },
        { id: 2, sender: 'client', text: 'Thanks for your time.', timestamp: Date.now() - 580000 },
      ]);
    } catch (err) {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (sessionId, text, sender) => {
    const newMessage = {
      id: Date.now(),
      sessionId,
      sender,
      text,
      timestamp: Date.now(),
    };

    // Emit message via Socket.IO
    socketRef.current.emit('message', newMessage);

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    // Optionally send to backend for persistence
    // await axios.post(`/api/sessions/${sessionId}/messages`, newMessage);
  };

  const setTypingStatus = () => {
    socketRef.current.emit('typing');
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        fetchMessages,
        sendMessage,
        typing,
        setTypingStatus,
        loading,
        error,
        setError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

