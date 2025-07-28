import React, { useState, useRef } from 'react';
import ApiKeyInput from './components/ApiKeyInput';
import ChatInterface from './components/ChatInterface';
import ConversationManager from './components/ConversationManager';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [keySaved, setKeySaved] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const currentConvoRef = useRef<Message[]>([]);

  const handleNew = () => {
    if (currentConvoRef.current.length > 0) {
      // Save current conversation as temporary before starting new
      window.dispatchEvent(new Event('saveCurrentConvo'));
    }
    setMessages([]);
    currentConvoRef.current = [];
  };

  return (
    <div className="App">
      <ApiKeyInput onSave={() => setKeySaved(true)} />
      {keySaved && (
        <div className="main-container">
          <ConversationManager currentMessages={messages} onLoad={setMessages} onNew={handleNew} />
          <ChatInterface messages={messages} setMessages={setMessages} />
        </div>
      )}
    </div>
  );
}

export default App;