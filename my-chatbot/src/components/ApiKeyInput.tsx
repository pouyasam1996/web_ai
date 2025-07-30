import React, { useState } from 'react';

interface Props {
  onSave: (key: string, model: string) => void;
}

const ApiKeyInput: React.FC<Props> = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gpt');
  const [error, setError] = useState('');

  const validateApiKey = (trimmedKey: string, selectedModel: string): { valid: boolean; error?: string } => {
    if (!trimmedKey) {
      return { valid: false, error: 'API key cannot be empty.' };
    }

    // Remove quotes if present
    if ((trimmedKey.startsWith("'") && trimmedKey.endsWith("'")) ||
        (trimmedKey.startsWith('"') && trimmedKey.endsWith('"'))) {
      return { valid: false, error: 'Please enter the API key without quotes.' };
    }

    // Validate based on the selected model
    switch (selectedModel) {
      case 'gpt':
        if (!trimmedKey.startsWith('sk-') && !trimmedKey.startsWith('sk-proj-')) {
          return { valid: false, error: 'OpenAI API key should start with "sk-" or "sk-proj-".' };
        }
        break;

      case 'grok':
        if (!trimmedKey.startsWith('xai-')) {
          return { valid: false, error: 'Grok (xAI) API key should start with "xai-".' };
        }
        break;

      case 'claude':
        if (!trimmedKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Claude (Anthropic) API key should start with "sk-ant-".' };
        }
        break;

      default:
        return { valid: false, error: 'Unknown model selected.' };
    }

    return { valid: true };
  };

  const handleSave = () => {
    const trimmedKey = key.trim();
    const validation = validateApiKey(trimmedKey, model);

    if (!validation.valid) {
      setError(validation.error || 'Invalid API key');
      return;
    }

    localStorage.setItem(`${model}_api_key`, trimmedKey);
    onSave(trimmedKey, model);
    setKey('');
    setError('');

    console.log(`✅ API key saved for ${model.toUpperCase()}`);
  };

  const getKeyPlaceholder = () => {
    switch (model) {
      case 'gpt':
        return 'Enter OpenAI API Key (sk-proj-... or sk-...)';
      case 'grok':
        return 'Enter Grok API Key (xai-...)';
      case 'claude':
        return 'Enter Claude API Key (sk-ant-...)';
      default:
        return 'Enter API Key';
    }
  };

  const getKeyExample = () => {
    switch (model) {
      case 'gpt':
        return 'Example: sk-proj-abc123... or sk-abc123...';
      case 'grok':
        return 'Example: xai-abc123...';
      case 'claude':
        return 'Example: sk-ant-abc123...';
      default:
        return '';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#222', borderBottom: '1px solid #333' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ color: '#fff', marginRight: '10px' }}>Select AI Provider:</label>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setKey(''); // Clear key when switching models
            setError(''); // Clear error when switching models
          }}
          style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
        >
          <option value="gpt">GPT (OpenAI)</option>
          <option value="grok">Grok (xAI)</option>
          <option value="claude">Claude (Anthropic)</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(''); // Clear error when typing
          }}
          placeholder={getKeyPlaceholder()}
          style={{
            padding: '8px',
            width: '400px',
            borderRadius: '4px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            marginRight: '10px'
          }}
        />
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Save Key
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
        {getKeyExample()}
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '5px' }}>
          ❌ {error}
        </div>
      )}

      {/* Show saved keys status */}
      <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '10px' }}>
        {localStorage.getItem('gpt_api_key') && '✅ OpenAI key saved'} {' '}
        {localStorage.getItem('grok_api_key') && '✅ Grok key saved'} {' '}
        {localStorage.getItem('claude_api_key') && '✅ Claude key saved'}
      </div>
    </div>
  );
};

export default ApiKeyInput;