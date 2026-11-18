import React, { useState } from 'react';
import { type LLMConfig } from '../services/llm';
import { Settings as SettingsIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface SettingsProps {
  config: LLMConfig;
  onChangeConfig: (config: LLMConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  config,
  onChangeConfig
}) => {
  const [showKey, setShowKey] = useState(false);

  const handleProviderChange = (provider: LLMConfig['provider']) => {
    let defaultModel = '';
    let defaultUrl = '';
    
    if (provider === 'openai') {
      defaultModel = 'gpt-4o-mini';
      defaultUrl = 'https://api.openai.com/v1';
    } else if (provider === 'groq') {
      defaultModel = 'llama-3.3-70b-specdec';
      defaultUrl = 'https://api.groq.com/openai/v1';
    } else if (provider === 'cerebras') {
      defaultModel = 'llama3.1-8b';
      defaultUrl = 'https://api.cerebras.ai/v1';
    } else if (provider === 'gemini') {
      defaultModel = 'gemini-1.5-flash';
      defaultUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
    }

    onChangeConfig({
      ...config,
      provider,
      model: defaultModel,
      baseUrl: defaultUrl
    });
  };

  return (
    <div className="settings-panel panel">
      <div className="panel-head">
        <div className="title-row">
          <SettingsIcon className="panel-icon text-cyan" size={18} />
          <h2>API Engine Settings</h2>
        </div>
        <p>Choose between local Demo Mode (no key needed) or direct streaming to cloud providers.</p>
      </div>

      <div className="settings-form">
        {/* Provider Select */}
        <div className="form-group">
          <label className="form-label">Provider</label>
          <div className="provider-tabs">
            <button
              type="button"
              className={`provider-tab ${config.provider === 'demo' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('demo')}
            >
              Demo Mode
            </button>
            <button
              type="button"
              className={`provider-tab ${config.provider === 'cerebras' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('cerebras')}
              title="Fastest open-weights model"
            >
              Cerebras
            </button>
            <button
              type="button"
              className={`provider-tab ${config.provider === 'groq' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('groq')}
              title="Ultra-low latency inference"
            >
              Groq
            </button>
            <button
              type="button"
              className={`provider-tab ${config.provider === 'openai' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('openai')}
            >
              OpenAI
            </button>
            <button
              type="button"
              className={`provider-tab ${config.provider === 'gemini' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('gemini')}
            >
              Gemini
            </button>
          </div>
        </div>

        {config.provider !== 'demo' && (
          <div className="api-config-fields animate-fade-in">
            {/* API Key */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label">API Key</label>
                <span className="secure-badge">
                  <ShieldCheck size={10} />
                  <span>localStorage only</span>
                </span>
              </div>
              <div className="input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => onChangeConfig({ ...config, apiKey: e.target.value })}
                  placeholder={`Enter your ${config.provider.toUpperCase()} API Key`}
                  className="form-input font-mono"
                />
                <button
                  type="button"
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Model Name */}
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                value={config.model || ''}
                onChange={(e) => onChangeConfig({ ...config, model: e.target.value })}
                placeholder="Model name"
                className="form-input font-mono"
              />
            </div>

            {/* Custom Endpoint URL */}
            <div className="form-group">
              <label className="form-label">Custom Base URL (Optional)</label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={(e) => onChangeConfig({ ...config, baseUrl: e.target.value })}
                placeholder="Custom endpoint URL"
                className="form-input font-mono"
              />
            </div>
          </div>
        )}

        {config.provider === 'demo' && (
          <div className="demo-info-card animate-fade-in">
            <span className="demo-badge">Active</span>
            <p>Runs fully in-browser with highly responsive, procedural canned starlit sci-fi logs. Move knobs or lock highlights to see the procedural story react instantly!</p>
          </div>
        )}
      </div>
    </div>
  );
};
