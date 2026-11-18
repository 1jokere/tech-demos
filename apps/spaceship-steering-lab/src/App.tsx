import React, { useEffect, useState, useRef } from 'react';
import { SteeringMachine, type SteeringState, type Knobs } from './state/steeringMachine';
import { Knob } from './components/Knob';
import { Editor } from './components/Editor';
import { Timeline } from './components/Timeline';
import { Settings } from './components/Settings';
import { streamLLMGeneration, type LLMConfig } from './services/llm';
import { Rocket, Play, Pause, AlertTriangle } from 'lucide-react';

// Setup localstorage key
const LOCAL_STORAGE_KEY_CONFIG = 'spaceship_steering_lab_config';

const DEFAULT_CONFIG: LLMConfig = {
  provider: 'demo',
  apiKey: '',
  baseUrl: '',
  model: ''
};

export const App: React.FC = () => {
  // Initialize SteeringMachine
  const machineRef = useRef<SteeringMachine | null>(null);
  if (!machineRef.current) {
    machineRef.current = new SteeringMachine();
  }
  const machine = machineRef.current;

  // React state reflecting the internal machine state
  const [state, setState] = useState<SteeringState>(machine.getState());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Config loaded from localstorage
  const [config, setConfig] = useState<LLMConfig>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Default to demo mode if provider is missing or invalid
        if (parsed && parsed.provider) return parsed;
      }
    } catch (e) {
      console.error("Failed to load localstorage config", e);
    }
    return DEFAULT_CONFIG;
  });

  // Save config to localstorage on change
  const handleConfigChange = (newConfig: LLMConfig) => {
    setConfig(newConfig);
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  // Subscribe to state machine updates
  useEffect(() => {
    const unsubscribe = machine.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [machine]);

  // Handle generation loop execution tied to state status
  useEffect(() => {
    if (state.status !== 'generating') {
      machine.cancelGeneration();
      return;
    }

    let isSubscribed = true;
    setErrorMsg(null);

    const generator = async (
      storyText: string,
      knobs: Knobs,
      locks: string[],
      signal: AbortSignal
    ) => {
      try {
        const result = await streamLLMGeneration(
          config,
          storyText,
          knobs,
          locks,
          (streamedText, focusPhrase) => {
            if (isSubscribed && !signal.aborted) {
              // Update current streaming text inside the state machine or local component state.
              // To make it highly modular and keep state inside SteeringMachine:
              // we can manually mutate currentStreamingText in state and trigger state notify!
              (machine as any).state.currentStreamingText = streamedText;
              (machine as any).state.currentStreamingFocus = focusPhrase;
              (machine as any).notify();
            }
          },
          signal
        );
        return result;
      } catch (err: any) {
        if (err.name === 'AbortError' || signal.aborted) {
          throw err;
        }
        if (isSubscribed) {
          setErrorMsg(err.message || 'An error occurred during generation.');
        }
        throw err;
      }
    };

    // Trigger the state machine runner
    (machine as any).runGenerationLoop(generator);

    return () => {
      isSubscribed = false;
    };
  }, [state.status, config, machine]);

  const handleStartGeneration = () => {
    if (config.provider !== 'demo' && !config.apiKey) {
      setErrorMsg("Please enter an API Key first in the settings panel below, or switch to Demo Mode.");
      return;
    }
    setErrorMsg(null);

    // Dummy generator as trigger. Real one runs in the useEffect loop above.
    machine.startGeneration(async () => {
      return { text: '' };
    });
  };

  const handlePauseGeneration = () => {
    machine.pauseGeneration();
  };

  const handleUpdatePremise = (text: string) => {
    machine.setPremise(text);
  };

  const handleKnobChange = (key: keyof Knobs, value: number) => {
    machine.setKnobs({ [key]: value });
  };

  return (
    <div className="page">
      {/* Hero Section */}
      <header className="hero animate-fade-in">
        <span className="kicker">Creative Co-Writing Laboratory</span>
        <h1>Spaceship Steering Lab</h1>
        <p className="lede">
          An interactive, real-time story steering editor. As the LLM streams a cosmic sci-fi narrative, adjust the analog dials to change tone, tension, and scale on the fly, or highlight phrases to lock model attention.
        </p>
      </header>

      {/* Error Message banner */}
      {errorMsg && (
        <div className="panel error-panel-alert mb-20 animate-fade-in" style={{ borderColor: 'var(--rose)', background: 'rgba(244, 63, 94, 0.05)' }}>
          <div className="title-row" style={{ color: 'var(--rose)' }}>
            <AlertTriangle size={18} />
            <strong style={{ fontSize: '0.92rem' }}>Generation Blocked</strong>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>{errorMsg}</p>
        </div>
      )}

      {/* Main Grid Section */}
      <main className="stage">
        {/* Left Side: Editor Area */}
        <Editor
          premise={state.premise}
          sentences={state.sentences}
          activeSentenceIndex={state.activeSentenceIndex}
          attentionLocks={state.attentionLocks}
          currentStreamingText={state.currentStreamingText}
          status={state.status}
          onUpdatePremise={handleUpdatePremise}
          onAddAttentionLock={(phrase) => machine.addAttentionLock(phrase)}
          onRemoveAttentionLock={(phrase) => machine.removeAttentionLock(phrase)}
        />

        {/* Right Side: Steering Knobs & Settings */}
        <div className="side">
          {/* Controls Dial Panel */}
          <div className="panel steering-panel">
            <div className="panel-head">
              <div className="title-row">
                <Rocket className="panel-icon text-fuchsia" size={18} />
                <h2>Steering Control Deck</h2>
              </div>
              <p>Turn the analog dials to steer the narrative direction. Real-time updates cancel and regenerate speculative future sentences.</p>
            </div>

            <div className="steering-grid">
              <Knob
                label="Tone"
                minLabel="Ominous"
                maxLabel="Wondrous"
                value={state.knobs.tone}
                onChange={(val) => handleKnobChange('tone', val)}
                color="var(--cyan)"
              />
              <Knob
                label="Tension"
                minLabel="Calm"
                maxLabel="Intense"
                value={state.knobs.tension}
                onChange={(val) => handleKnobChange('tension', val)}
                color="var(--rose)"
              />
              <Knob
                label="Distance"
                minLabel="Intimate"
                maxLabel="Cinematic"
                value={state.knobs.distance}
                onChange={(val) => handleKnobChange('distance', val)}
                color="var(--violet)"
              />
            </div>

            {/* Run / Stop Button */}
            <div className="action-block">
              {state.status === 'generating' ? (
                <button 
                  className="btn-generate btn-pause" 
                  onClick={handlePauseGeneration}
                >
                  <Pause size={18} />
                  <span>Pause Engine</span>
                </button>
              ) : (
                <button 
                  className="btn-generate btn-pulse-ring" 
                  onClick={handleStartGeneration}
                >
                  <Play size={18} fill="currentColor" />
                  <span>Engage Generator</span>
                </button>
              )}

              <div className="status-badge">
                <span className={`status-dot ${state.status === 'generating' ? 'active' : ''}`} />
                <span>Engine Status: {state.status}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Branches Scrubber */}
          <Timeline
            sentences={state.sentences}
            activeSentenceIndex={state.activeSentenceIndex}
            branches={state.branches}
            onScrub={(idx) => machine.scrubTo(idx)}
            onRestoreBranch={(branchId) => machine.restoreBranch(branchId)}
          />

          {/* API Keys and Provider config */}
          <Settings
            config={config}
            onChangeConfig={handleConfigChange}
          />
        </div>
      </main>

      {/* Footer Credits */}
      <footer className="credits">
        <p>
          Re-implemented under MIT, inspired by the gorgeous <strong>Spaceship IDE</strong> by Chuanqi Sun, MIT Media Lab.
        </p>
        <div className="credit-links">
          <a href="https://github.com/chuanqisun/spaceship" target="_blank" rel="noopener noreferrer">Original Repository</a>
          <a href="https://chuanqisun.github.io/spaceship/" target="_blank" rel="noopener noreferrer">Live Simulator</a>
          <a href="https://x.com/RileyRalmuto/status/2122579675738231170" target="_blank" rel="noopener noreferrer">Original Post</a>
        </div>
      </footer>
    </div>
  );
};
