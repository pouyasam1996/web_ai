import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import FileUpload from './FileUpload';
import CodeBlock from '../CodeBlock';
import '../App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
}

interface ApiResponse {
  choices?: { message: { content: string } }[];
  content?: string;
}

interface RequestBody {
  model: string;
  messages: Message[];
  max_tokens?: number;
}

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// DEBUG: Function to estimate token count
const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// DEBUG: Function to analyze message size
const analyzeMessageSize = (message: Message): void => {
  console.log('🔍 MESSAGE SIZE ANALYSIS:');
  console.log(`Text content: ${message.content.length} chars (≈${estimateTokenCount(message.content)} tokens)`);

  if (message.files && message.files.length > 0) {
    let totalFileSize = 0;
    message.files.forEach((file, index) => {
      const fileTokens = estimateTokenCount(file.content);
      totalFileSize += fileTokens;
      console.log(`File ${index + 1} (${file.name}): ${file.content.length} chars (≈${fileTokens} tokens)`);

      if (file.type.startsWith('image/')) {
        console.log(`  📸 Image - Original size: ${(file.size / 1024).toFixed(1)}KB, Base64 size: ${(file.content.length / 1024).toFixed(1)}KB`);
      }
    });
    console.log(`Total file tokens: ≈${totalFileSize}`);
    console.log(`TOTAL MESSAGE TOKENS: ≈${estimateTokenCount(message.content) + totalFileSize}`);
  }
};

const formatMessageContent = (message: Message): string => {
  let content = message.content;

  // DEBUG: Analyze message size before processing
  analyzeMessageSize(message);

  if (message.files && message.files.length > 0) {
    const fileInfo = message.files.map(file => {
      if (file.type.startsWith('image/')) {
        console.log(`🖼️ Adding image to API request: ${file.name} (${file.content.length} chars)`);
        return `[Image: ${file.name}] - ${file.content}`;
      } else {
        console.log(`📄 Adding file to API request: ${file.name} (${file.content.length} chars)`);
        return `[File: ${file.name}]\n${file.content}`;
      }
    }).join('\n\n');

    content = content + '\n\n' + fileInfo;
  }

  const finalTokens = estimateTokenCount(content);
  console.log(`📤 FINAL API MESSAGE: ${content.length} chars (≈${finalTokens} tokens)`);

  if (finalTokens > 100000) {
    console.warn(`⚠️ WARNING: Message is very large (≈${finalTokens} tokens). This might cause API errors.`);
  }

  return content;
};

const ChatInterface: React.FC<Props> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gpt');
  const [gptModel, setGptModel] = useState('o4-mini');
  const [apiKey, setApiKey] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem(`${model}_api_key`);
    if (key) setApiKey(key.trim());
  }, [model]);

  useEffect(() => {
    const handleClearFiles = () => {
      setUploadedFiles([]);
    };
    window.addEventListener('clearFiles', handleClearFiles);
    return () => window.removeEventListener('clearFiles', handleClearFiles);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!apiKey) {
      alert('Save API key first');
      return;
    }
    if (!input.trim() && uploadedFiles.length === 0) {
      return;
    }

    setIsLoading(true);

    const newMessage: Message = {
      role: 'user',
      content: input,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    const newMessages: Message[] = [...messages, newMessage];
    setMessages(newMessages);
    setInput('');
    setUploadedFiles([]);

    try {
      const apiMessages = newMessages.map(msg => ({
        role: msg.role,
        content: formatMessageContent(msg)
      }));

      const totalTokens = apiMessages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0);
      console.log(`📊 TOTAL CONVERSATION SIZE: ≈${totalTokens} tokens`);

      let url = '';
      let headers: any = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      let body: RequestBody = { model: gptModel, messages: apiMessages };

      if (model === 'gpt') {
        url = 'https://api.openai.com/v1/chat/completions';
      } else if (model === 'claude') {
        url = 'https://api.anthropic.com/v1/messages';
        headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
        body = { model: 'claude-3-5-sonnet-20241022', messages: apiMessages, max_tokens: 1000 };
      } else if (model === 'grok') {
        url = 'https://api.x.ai/v1/chat/completions';
        body = { model: 'grok-beta', messages: apiMessages };
      }

      console.log('🚀 API Request:', { url, model, messageCount: apiMessages.length, estimatedTokens: totalTokens });

      const response = await axios.post<ApiResponse>(url, body, { headers });
      const aiReply = response.data.choices ? response.data.choices[0].message.content : response.data.content;

      console.log('✅ API Response received');
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply || 'No response' }]);
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.data?.error || error.message);

      let errorMessage = 'Unknown API error';
      if (error.response?.status === 413) {
        errorMessage = 'Request too large - try reducing image sizes or removing some files';
      } else if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('token')) {
        errorMessage = 'Token limit exceeded - try reducing message length or file sizes';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }

      alert(`API call failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, input, uploadedFiles, messages, setMessages, model, gptModel]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newInput = input.substring(0, start) + '\n' + input.substring(end);
      setInput(newInput);

      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1;
        textarea.focus();
      }, 0);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    console.log('📁 Files uploaded to chat interface:', files.map(f => ({
      name: f.name,
      size: f.size,
      contentLength: f.content.length,
      type: f.type
    })));
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="chat-container">
      {/* Model Selection */}
      <div className="model-selection">
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="gpt">GPT</option>
          <option value="grok">Grok</option>
          <option value="claude">Claude</option>
        </select>

        {model === 'gpt' && (
          <select
            value={gptModel}
            onChange={(e) => setGptModel(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            <option value="o4-mini">o4-mini (Default)</option>
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
          </select>
        )}
      </div>

      {/* Messages Display */}
      <div className="message-container" style={{ height: 'calc(100% - 150px)', overflowY: 'scroll', margin: '10px 0' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong>

            {/* File Display Section with Debug Info */}
            {msg.files && msg.files.length > 0 && (
              <div className="message-files">
                {msg.files.map((file, fileIndex) => (
                  <div key={fileIndex} className="message-file">
                    {file.type.startsWith('image/') ? (
                      <div>
                        <img src={file.url} alt={file.name} className="message-image" />
                        <div className="file-debug-info" style={{ fontSize: '10px', color: '#888' }}>
                          {file.name} - Original: {(file.size / 1024).toFixed(1)}KB → Base64: {(file.content.length / 1024).toFixed(1)}KB (≈{estimateTokenCount(file.content)} tokens)
                        </div>
                      </div>
                    ) : (
                      <div className="message-file-info">
                        📁 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        <div className="file-debug-info" style={{ fontSize: '10px', color: '#888' }}>
                          Content: {(file.content.length / 1024).toFixed(1)}KB (≈{estimateTokenCount(file.content)} tokens)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Content */}
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
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const childrenString = String(children).replace(/\n$/, '');
                    const isMultiline = childrenString.includes('\n');
                    const isCodeBlock = match || isMultiline;

                    return isCodeBlock ? (
                      <CodeBlock className={className} inline={false}>
                        {childrenString}
                      </CodeBlock>
                    ) : (
                      <CodeBlock className={className} inline={true}>
                        {childrenString}
                      </CodeBlock>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              <div className="user-message-content">{msg.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* File Upload Area */}
      <FileUpload onFilesUploaded={handleFilesUploaded} />

      {/* Uploaded Files Preview with Enhanced Debug Info */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-preview">
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>
            📊 Debug Info: {uploadedFiles.length} files, Total: {(uploadedFiles.reduce((sum, f) => sum + f.content.length, 0) / 1024).toFixed(1)}KB (≈{uploadedFiles.reduce((sum, f) => sum + estimateTokenCount(f.content), 0)} tokens)
          </div>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="uploaded-file-item">
              {file.type.startsWith('image/') ? (
                <div>
                  <img src={file.url} alt={file.name} className="uploaded-file-image" />
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {file.name} - {(file.size / 1024).toFixed(1)}KB → {(file.content.length / 1024).toFixed(1)}KB base64 (≈{estimateTokenCount(file.content)} tokens)
                  </div>
                </div>
              ) : (
                <div className="uploaded-file-info">
                  📁 {file.name}
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {(file.size / 1024).toFixed(1)}KB → {(file.content.length / 1024).toFixed(1)}KB processed (≈{estimateTokenCount(file.content)} tokens)
                  </div>
                </div>
              )}
              <button
                className="remove-file-btn"
                onClick={() => removeFile(index)}
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message... (Shift+Enter for new line)"
          className="chat-input"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          className="send-button"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', color: '#60a5fa', margin: '10px' }}>
          🤖 Sending message to AI...
        </div>
      )}
    </div>
  );
};

export default ChatInterface;