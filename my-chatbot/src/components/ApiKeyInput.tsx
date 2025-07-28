import React, { useState } from 'react';

interface Props {
  onSave: (key: string, model: string) => void;
}

const ApiKeyInput: React.FC<Props> = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gpt');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError('API key cannot be empty.');
      return;
    }
    if (trimmedKey.startsWith("'") || trimmedKey.endsWith("'") || trimmedKey.startsWith('"') || trimmedKey.endsWith('"')) {
      setError('Please enter the API key without quotes (e.g., sk-proj-...).');
      return;
    }
    if (!trimmedKey.startsWith('sk-') && !trimmedKey.startsWith('sk-proj-')) {
      setError('Invalid API key format. It should start with "sk-" or "sk-proj-".');
      return;
    }
    localStorage.setItem(`${model}_api_key`, trimmedKey);
    onSave(trimmedKey, model);
    setKey('');
    setError('');
  };

  return (
    <div>
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="gpt">GPT (OpenAI)</option>
        <option value="grok">Grok (xAI)</option>
        <option value="claude">Claude (Anthropic)</option>
      </select>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Enter API Key (e.g., sk-proj-...)"
      />
      <button onClick={handleSave}>Save Key</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ApiKeyInput;