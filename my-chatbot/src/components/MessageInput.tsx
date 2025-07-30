import React, { KeyboardEvent, useRef } from 'react';

interface Props {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<Props> = ({ input, onInputChange, onSendMessage, disabled = false }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newInput = input.substring(0, start) + '\n' + input.substring(end);
      onInputChange(newInput);

      // Use setTimeout to ensure state update completes before setting cursor
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = start + 1;
          inputRef.current.selectionStart = newCursorPos;
          inputRef.current.selectionEnd = newCursorPos;
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="input-area">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message... (Shift+Enter for new line)"
        className="chat-input"
        rows={3}
        disabled={disabled}
      />
      <button
        onClick={onSendMessage}
        className="send-button"
        disabled={disabled}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;