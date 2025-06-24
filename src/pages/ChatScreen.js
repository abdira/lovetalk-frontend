import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const ChatScreen = () => {
  const { bookingId } = useParams();
  const { user } = useContext(AuthContext);
  const {
    messages,
    fetchMessages,
    sendMessage,
    typing,
    setTypingStatus,
    loading,
    error,
    setError,
  } = useContext(ChatContext);

  const [input, setInput] = useState('');
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages(sessionId);
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(sessionId, input.trim(), user.role);
    setInput('');
  };

  const launchVideoCall = () => {
    const room = `lovetalk-room-${sessionId}`;
    window.open(`https://meet.jit.si/${room}`, '_blank');
  };

  return (
    <div className="container my-4" style={{ maxWidth: 720, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Session Chat</h3>
        <button className="btn btn-success" onClick={launchVideoCall}>Join Video Call</button>
      </div>

      <div
        className="border rounded p-3 mb-3 flex-grow-1 overflow-auto"
        style={{ backgroundColor: '#f8f9fa' }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {loading && (
          <div className="text-center my-2">
            <div className="spinner-border text-primary" role="status" />
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && messages.length === 0 && <p className="text-muted">No messages yet.</p>}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`d-flex mb-2 ${msg.sender === user.role ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div
              className={`p-2 rounded ${msg.sender === user.role ? 'bg-primary text-white' : 'bg-light text-dark'}`}
              style={{ maxWidth: '70%' }}
            >
              <small className="text-muted">{msg.sender}</small>
              <p className="mb-1">{msg.text}</p>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}

        {typing && (
          <div className="text-muted fst-italic mb-2">
            {user.role === 'client' ? 'Counselor is typing...' : 'Client is typing...'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="d-flex gap-2" aria-label="Send message form">
        <input
          type="text"
          className="form-control"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          aria-label="Message input"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" aria-label="Send message">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatScreen;

