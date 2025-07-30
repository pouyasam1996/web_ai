import React from 'react';

interface Props {
  model: string;
  gptModel: string;
  onModelChange: (model: string) => void;
  onGptModelChange: (gptModel: string) => void;
}

const ModelSelector: React.FC<Props> = ({ model, gptModel, onModelChange, onGptModelChange }) => {
  return (
    <div className="model-selection">
      <select value={model} onChange={(e) => onModelChange(e.target.value)}>
        <option value="gpt">GPT</option>
        <option value="grok">Grok</option>
        <option value="claude">Claude</option>
      </select>

      {model === 'gpt' && (
        <select
          value={gptModel}
          onChange={(e) => onGptModelChange(e.target.value)}
          style={{ marginLeft: '10px' }}
        >
          <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
          <option value="gpt-4.1">GPT-4.1</option>
          <option value="gpt-o4-mini">GPT-o4 mini</option>
          <option value="gpt-o3">GPT-o3</option>
        </select>
      )}
    </div>
  );
};

export default ModelSelector;