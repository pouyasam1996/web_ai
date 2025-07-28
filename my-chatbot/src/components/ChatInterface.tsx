import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const key = localStorage.getItem(`${model}_api_key`);
    if (key) setApiKey(key.trim()); // Trim when retrieving
  }, [model]);

  const sendMessage = async () => {
    if (!apiKey) return alert('Save API key first');
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    let url = '';
    let headers: Headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    let body: RequestBody = { model: 'gpt-4o', messages: newMessages };

    if (model === 'gpt') {
      url = 'https://api.openai.com/v1/chat/completions';
    } else if (model === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
      body = { model: 'claude-3-5-sonnet-20241022', messages: newMessages, max_tokens: 1000 };
    } else if (model === 'grok') {
      url = 'https://api.x.ai/v1/chat/completions';
    }

    console.log('Request:', { url, headers, body }); // Log full request
    try {
      const response = await axios.post<ApiResponse>(url, body, { headers });
      const aiReply = response.data.choices ? response.data.choices[0].message.content : response.data.content;
      setMessages([...newMessages, { role: 'assistant', content: aiReply || 'No response' }]);
    } catch (error: any) {
      console.error('Error:', error.response?.data?.error || error.message);
      alert('API call failed: ' + (error.response?.data?.error?.message || 'Unknown error'));
    }
  };

  return (
    <div className="chat-container">
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="gpt">GPT</option>
        <option value="grok">Grok</option>
        <option value="claude">Claude</option>
      </select>
      <div className="message-container" style={{ height: 'calc(100% - 60px)', overflowY: 'scroll', margin: '10px 0' }}>
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, marginRight: '10px' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;