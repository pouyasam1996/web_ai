import React, { useState, useEffect } from 'react';
import '../App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Convo {
  id: string;
  messages: Message[];
  permanent: boolean;
}

interface Props {
  currentMessages: Message[];
  onLoad: (messages: Message[]) => void;
  onNew: () => void;
}

const ConversationManager: React.FC<Props> = ({ currentMessages, onLoad, onNew }) => {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [tempConvos, setTempConvos] = useState<Convo[]>([]);
  const [permConvos, setPermConvos] = useState<Convo[]>([]);

  useEffect(() => {
    const storedTemp = JSON.parse(localStorage.getItem('temp_convos') || '[]');
    const storedPerm = JSON.parse(localStorage.getItem('permanent_convos') || '[]');
    setTempConvos(storedTemp);
    setPermConvos(storedPerm);
    setConvos([...storedTemp, ...storedPerm]);
  }, []);

  useEffect(() => {
    // Listen for saveCurrentConvo event triggered by "New" button
    const handleSaveCurrent = () => {
      if (currentMessages.length > 0 && !tempConvos.some(c => JSON.stringify(c.messages) === JSON.stringify(currentMessages))) {
        const id = Date.now().toString();
        const newConvo: Convo = { id, messages: currentMessages, permanent: false };
        let updatedTemp = [...tempConvos, newConvo];
        if (updatedTemp.length > 20) {
          updatedTemp = updatedTemp.slice(1); // Remove oldest
        }
        localStorage.setItem('temp_convos', JSON.stringify(updatedTemp));
        setTempConvos(updatedTemp);
        setConvos([...updatedTemp, ...permConvos]);
      }
    };
    window.addEventListener('saveCurrentConvo', handleSaveCurrent);
    return () => window.removeEventListener('saveCurrentConvo', handleSaveCurrent);
  }, [currentMessages, tempConvos, permConvos, convos]);

  const saveConvo = (permanent: boolean) => {
    const id = Date.now().toString();
    const newConvo: Convo = { id, messages: currentMessages, permanent };
    if (permanent) {
      const updatedPerm = [...permConvos, newConvo];
      localStorage.setItem('permanent_convos', JSON.stringify(updatedPerm));
      setPermConvos(updatedPerm);
    } else {
      let updatedTemp = [...tempConvos, newConvo];
      if (updatedTemp.length > 20) {
        updatedTemp = updatedTemp.slice(1); // Remove oldest
      }
      localStorage.setItem('temp_convos', JSON.stringify(updatedTemp));
      setTempConvos(updatedTemp);
    }
    setConvos([...tempConvos, ...permConvos, newConvo]);
  };

  const deleteConvo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      let updatedTemp = [...tempConvos];
      let updatedPerm = [...permConvos];
      if (permConvos.some(c => c.id === id)) {
        updatedPerm = permConvos.filter(c => c.id !== id);
        localStorage.setItem('permanent_convos', JSON.stringify(updatedPerm));
        setPermConvos(updatedPerm);
      } else {
        updatedTemp = tempConvos.filter(c => c.id !== id);
        localStorage.setItem('temp_convos', JSON.stringify(updatedTemp));
        setTempConvos(updatedTemp);
      }
      setConvos([...updatedTemp, ...updatedPerm]);
    }
  };

  return (
    <div className="convo-list">
      <button onClick={onNew}>New</button>
      <button onClick={() => saveConvo(false)}>Save Temporary</button>
      <button onClick={() => saveConvo(true)} style={{ marginLeft: '10px' }}>Save Permanent</button>
      <h3>Saved Conversations</h3>
      <ul>
        {convos.map(c => (
          <li key={c.id} onClick={() => onLoad(c.messages)}>
            Convo {c.id} <span className="highlight">{c.permanent ? '(Permanent)' : '(Temporary)'}</span>
            <button onClick={(e) => { e.stopPropagation(); deleteConvo(c.id); }} style={{ marginLeft: '10px' }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationManager;