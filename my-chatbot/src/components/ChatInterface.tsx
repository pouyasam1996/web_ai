import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import '../App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiResponse {
  choices?: { message: { content: string } }[];
  content?: string; // For Claude
}

interface RequestBody {
  model: string;
  messages: Message[];
  max_tokens?: number; // Optional for Claude
}

interface OpenAIHeaders {
  Authorization: string;
  'Content-Type': string;
}

interface AnthropicHeaders {
  'x-api-key': string;
  'anthropic-version': string;
  'Content-Type': string;
}

type Headers = OpenAIHeaders | AnthropicHeaders;

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatInterface: React.FC<Props> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gpt');
  const [apiKey, setApiKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = localStorage.getItem(`${model}_api_key`);
    if (key) setApiKey(key.trim()); // Trim when retrieving
  }, [model]);

  const sendMessage = async () => {
    if (!apiKey) return alert('Save API key first');
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const start = e.currentTarget.selectionStart || 0;
      const end = e.currentTarget.selectionEnd || 0;
      const newInput = input.substring(0, start) + '\n' + input.substring(end);
      setInput(newInput);
      // Set cursor position immediately after state update
      if (inputRef.current) {
        const newCursorPos = start + 1;
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos;
        inputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (!apiKey) return;
    let url = '';
    let headers: Headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    let body: RequestBody = { model: 'gpt-4o', messages };

    if (model === 'gpt') {
      url = 'https://api.openai.com/v1/chat/completions';
    } else if (model === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
      body = { model: 'claude-3-5-sonnet-20241022', messages, max_tokens: 1000 };
    } else if (model === 'grok') {
      url = 'https://api.x.ai/v1/chat/completions';
    }

    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      console.log('Request:', { url, headers, body });
      axios.post<ApiResponse>(url, body, { headers })
        .then(response => {
          const aiReply = response.data.choices ? response.data.choices[0].message.content : response.data.content;
          setMessages(prev => [...prev, { role: 'assistant', content: aiReply || 'No response' }]);
        })
        .catch((error: any) => {
          console.error('Error:', error.response?.data?.error || error.message);
          alert('API call failed: ' + (error.response?.data?.error?.message || 'Unknown error'));
        });
    }
  }, [messages, model, apiKey]);

  return (
    <div className="chat-container">
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="gpt">GPT</option>
        <option value="grok">Grok</option>
        <option value="claude">Claude</option>
      </select>
      <div className="message-container" style={{ height: 'calc(100% - 100px)', overflowY: 'scroll', margin: '10px 0' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong>
            {msg.role === 'assistant' ? (
              <ReactMarkdown
                components={{
                  p({ children }) {
                    return <p className="markdown-content">{children}</p>;
                  },
                  h3({ children }) {
                    return <h3 className="markdown-content">{children}</h3>;
                  },
                  ul({ children }) {
                    return <ul className="markdown-content">{children}</ul>;
                  },
                  li({ children }) {
                    return <li className="markdown-content">{children}</li>;
                  },
                  a({ children, href }) {
                    return (
                      <a className="markdown-content" href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    );
                  },
                  code({ children }) {
                    return <code className="markdown-content">{children}</code>;
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 20px 0' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ flex: 1, marginRight: '10px' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;