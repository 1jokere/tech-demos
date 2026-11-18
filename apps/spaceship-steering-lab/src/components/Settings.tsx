import React, { useState } from 'react';
import { type LLMConfig } from '../services/llm';
import { type Language, LOCALES } from '../services/locale';
import { Settings as SettingsIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface SettingsProps {
  config: LLMConfig;
  onChangeConfig: (config: LLMConfig) => void;
  language: Language;
}

export const Settings: React.FC<SettingsProps> = ({
  config,
  onChangeConfig,
  language
}) => {
  const [showKey, setShowKey] = useState(false);
  const t = LOCALES[language];

  const handleProviderChange = (provider: LLMConfig['provider']) => {
    let defaultModel = '';
    let defaultUrl = '';
    
    if (provider === 'openai') {
      defaultModel = 'gpt-4o-mini';
      defaultUrl = 'https://api.openai.com/v1';
    } else if (provider === 'groq') {
      defaultModel = 'openai/gpt-oss-20b';
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
          <h2>{t.apiSettings}</h2>
        </div>
        <p>{t.apiSettingsSub}</p>
      </div>

      <div className="settings-form">
        {/* Provider Select */}
        <div className="form-group">
          <label className="form-label">{t.provider}</label>
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
            >
              Cerebras
            </button>
            <button
              type="button"
              className={`provider-tab ${config.provider === 'groq' ? 'is-active' : ''}`}
              onClick={() => handleProviderChange('groq')}
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
                <label className="form-label">{t.apiKey}</label>
                <span className="secure-badge">
                  <ShieldCheck size={10} />
                  <span>{t.localStorageOnly}</span>
                </span>
              </div>
              <div className="input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => onChangeConfig({ ...config, apiKey: e.target.value })}
                  placeholder={language === 'fr' ? `Entrez votre clé d'API ${config.provider.toUpperCase()}` : `Enter your ${config.provider.toUpperCase()} API Key`}
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
              <label className="form-label">{t.model}</label>
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
              <label className="form-label">{t.customBaseUrl}</label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={(e) => onChangeConfig({ ...config, baseUrl: e.target.value })}
                placeholder="Custom base URL"
                className="form-input font-mono"
              />
            </div>
          </div>
        )}

        {config.provider === 'demo' && (
          <div className="demo-info-card animate-fade-in">
            <span className="demo-badge">Active</span>
            <p>{t.demoActive}</p>
          </div>
        )}
      </div>
    </div>
  );
};
