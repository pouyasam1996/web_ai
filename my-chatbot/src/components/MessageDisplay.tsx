import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from '../CodeBlock';

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
}

interface Props {
  messages: Message[];
}

const MessageDisplay: React.FC<Props> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-container" style={{ height: 'calc(100% - 150px)', overflowY: 'scroll', margin: '10px 0' }}>
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <strong>{msg.role}:</strong>

          {/* File Display Section */}
          {msg.files && msg.files.length > 0 && (
            <div className="message-files">
              {msg.files.map((file, fileIndex) => (
                <div key={fileIndex} className="message-file">
                  {file.type.startsWith('image/') ? (
                    <div>
                      <img src={file.url} alt={file.name} className="message-image" />
                      <div className="file-debug-info" style={{ fontSize: '10px', color: '#888' }}>
                        {file.name} - Size: {(file.size / 1024).toFixed(1)}KB - Content Length: {file.content.length} chars
                      </div>
                    </div>
                  ) : (
                    <div className="message-file-info">
                      📁 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      <div className="file-debug-info" style={{ fontSize: '10px', color: '#888' }}>
                        Content Length: {file.content.length} chars
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
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageDisplay;