import React, { useEffect, useState, useRef } from 'react';
import { SteeringMachine, type SteeringState, type Knobs } from './state/steeringMachine';
import { Knob } from './components/Knob';
import { Editor } from './components/Editor';
import { Timeline } from './components/Timeline';
import { Settings } from './components/Settings';
import { streamLLMGeneration, type LLMConfig } from './services/llm';
import { type Language, LOCALES } from './services/locale';
import { Rocket, Play, Pause, AlertTriangle, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_KEY_CONFIG = 'spaceship_steering_lab_config';
const LOCAL_STORAGE_KEY_LANG = 'spaceship_steering_lab_language';

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

  // Language Selection (default FR)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LANG);
      if (stored === 'en' || stored === 'fr') return stored as Language;
    } catch (_) {}
    return 'fr'; // Default French
  });

  // Local immediate state for dial knobs to keep visual rotations fluid
  const [localKnobs, setLocalKnobs] = useState<Knobs>(state.knobs);

  // Auto-retry countdown states for 429
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const retryAttemptRef = useRef<number>(0);

  // Config loaded from localstorage
  const [config, setConfig] = useState<LLMConfig>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
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

  // Sync visual knobs with state machine knobs when they are loaded/updated from outside dragging
  useEffect(() => {
    setLocalKnobs(state.knobs);
  }, [state.knobs]);

  // Initialize premise based on language on mount and if story is empty
  useEffect(() => {
    if (state.sentences.length === 0 && (
      state.premise === "A lone exploration vessel drifts in the silent shadow of a massive, dead stellar gate." ||
      state.premise === "Un vaisseau d'exploration solitaire dérive dans l'ombre silencieuse d'une gigantesque porte stellaire éteinte." ||
      state.premise === ""
    )) {
      machine.setPremise(LOCALES[language].premiseDefault);
    }
  }, [language, machine]);

  // Debounced knob state commitment (~800ms) to avoid speculative over-generation and rate limits
  useEffect(() => {
    const hasChanged =
      localKnobs.tone !== state.knobs.tone ||
      localKnobs.tension !== state.knobs.tension ||
      localKnobs.distance !== state.knobs.distance;

    if (!hasChanged) return;

    const timer = setTimeout(() => {
      machine.setKnobs(localKnobs);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [localKnobs, state.knobs, machine]);

  // Handle generation loop execution tied to state status
  useEffect(() => {
    if (state.status !== 'generating') {
      machine.cancelGeneration();
      retryAttemptRef.current = 0;
      setRetryCountdown(null);
      return;
    }

    let isSubscribed = true;
    setErrorMsg(null);
    setRetryCountdown(null);

    const generator = async (
      storyText: string,
      knobs: Knobs,
      locks: string[],
      signal: AbortSignal
    ): Promise<{ text: string, focusPhrase?: string }> => {
      try {
        const result = await streamLLMGeneration(
          config,
          storyText,
          knobs,
          locks,
          (streamedText, focusPhrase) => {
            if (isSubscribed && !signal.aborted) {
              (machine as any).state.currentStreamingText = streamedText;
              (machine as any).state.currentStreamingFocus = focusPhrase;
              (machine as any).notify();
            }
          },
          signal,
          language
        );
        retryAttemptRef.current = 0; // reset retry attempts on successful generation
        return result;
      } catch (err: any) {
        if (err.name === 'AbortError' || signal.aborted) {
          throw err;
        }

        // Friendly 429 RateLimit Countdown & Auto-Retry Loop
        if (err.name === 'RateLimitError' && isSubscribed && !signal.aborted) {
          const seconds = parseInt(err.message.split(':')[1]) || 8;
          
          if (retryAttemptRef.current < 3) {
            retryAttemptRef.current += 1;
            
            // Trigger visual countdown ticking
            setRetryCountdown(seconds);
            for (let i = seconds; i > 0; i--) {
              if (signal.aborted || !isSubscribed) {
                setRetryCountdown(null);
                throw new DOMException('Aborted', 'AbortError');
              }
              setRetryCountdown(i);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            setRetryCountdown(null);

            // Re-execute generation once the countdown finishes
            if (isSubscribed && !signal.aborted) {
              return generator(storyText, knobs, locks, signal);
            }
          } else {
            // Maximum retry attempts reached
            if (isSubscribed) {
              setErrorMsg(
                language === 'fr'
                  ? "Limite de requêtes atteinte après plusieurs tentatives de réessai. Veuillez réessayer plus tard."
                  : "Too many failed rate-limit retries. Please wait and try again later."
              );
            }
            throw err;
          }
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
      machine.cancelGeneration();
    };
  }, [state.status, state.activeSentenceIndex, state.knobs, state.attentionLocks, config, machine, language]);

  const handleStartGeneration = () => {
    if (config.provider !== 'demo' && !config.apiKey) {
      setErrorMsg(
        language === 'fr'
          ? "Veuillez entrer une clé d'API dans le panneau de configuration ci-dessous, ou activez le Mode Démo."
          : "Please enter an API Key first in the settings panel below, or switch to Demo Mode."
      );
      return;
    }
    setErrorMsg(null);

    // Start generation on the state machine
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
    // Update local visual state immediately for 100% fluid visual drag rotations
    setLocalKnobs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRegenerateActive = () => {
    if (state.activeSentenceIndex === -1) return;
    
    // Save current layout as an alternative future branch before overwriting
    machine.saveCurrentAsBranch(language === 'fr' ? "Avant régénération" : "Before regeneration");

    // Scrub back by one (which pauses the engine)
    machine.scrubTo(state.activeSentenceIndex - 1);
    
    // Instantly engage generation again to overwrite the sentence with updated dials
    handleStartGeneration();
  };

  const handleLanguageToggle = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LOCAL_STORAGE_KEY_LANG, lang);

    // Swap default starting premise if the user has not edited it yet
    const oldDefault = lang === 'fr' ? LOCALES.en.premiseDefault : LOCALES.fr.premiseDefault;
    const newDefault = lang === 'fr' ? LOCALES.fr.premiseDefault : LOCALES.en.premiseDefault;

    if (state.premise === oldDefault || state.premise === '' || state.premise === "A lone exploration vessel drifts in the silent shadow of a massive, dead stellar gate.") {
      machine.setPremise(newDefault);
    }
  };

  const t = LOCALES[language];

  return (
    <div className="page">
      {/* Floating Language Selector Toggle FR/EN */}
      <div className="language-selector-floating">
        <button
          type="button"
          onClick={() => handleLanguageToggle('fr')}
          className={`lang-btn ${language === 'fr' ? 'is-active' : ''}`}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => handleLanguageToggle('en')}
          className={`lang-btn ${language === 'en' ? 'is-active' : ''}`}
        >
          EN
        </button>
      </div>

      {/* Hero Section */}
      <header className="hero animate-fade-in">
        <span className="kicker">{t.kicker}</span>
        <h1>{t.title}</h1>
        <p className="lede">{t.subtitle}</p>
      </header>

      {/* Countdown and Error Message banners */}
      {retryCountdown !== null ? (
        <div className="panel error-panel-alert mb-20 animate-fade-in" style={{ borderColor: 'var(--amber)', background: 'rgba(245, 158, 11, 0.05)', marginBottom: '24px' }}>
          <div className="title-row animate-pulse" style={{ color: 'var(--amber)', gap: '10px' }}>
            <RefreshCw size={18} className="animate-spin" />
            <strong style={{ fontSize: '0.92rem' }}>
              {language === 'fr' 
                ? `Limite de requêtes atteinte (Groq 429). Réessai automatique dans ${retryCountdown} seconde${retryCountdown > 1 ? 's' : ''}...` 
                : `Rate limit hit (Groq 429). Auto-retrying in ${retryCountdown} second${retryCountdown > 1 ? 's' : ''}...`}
            </strong>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--muted)', paddingLeft: '28px' }}>
            {language === 'fr'
              ? `Tentative de contournement de la limite gratuite de Groq. Tentative de réessai en cours.`
              : `Bypassing the Groq free-tier rate limits. Retry in progress.`}
          </p>
        </div>
      ) : errorMsg ? (
        <div className="panel error-panel-alert mb-20 animate-fade-in" style={{ borderColor: 'var(--rose)', background: 'rgba(244, 63, 94, 0.05)', marginBottom: '24px' }}>
          <div className="title-row" style={{ color: 'var(--rose)', gap: '8px' }}>
            <AlertTriangle size={18} />
            <strong style={{ fontSize: '0.92rem' }}>
              {language === 'fr' ? "Génération Bloquée" : "Generation Blocked"}
            </strong>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--muted)', paddingLeft: '26px' }}>{errorMsg}</p>
        </div>
      ) : null}

      {/* Main Grid Section */}
      <main className="stage">
        {/* Left Side: Editor Area */}
        <Editor
          premise={state.premise}
          onChangePremise={handleUpdatePremise}
          sentences={state.sentences}
          activeSentenceIndex={state.activeSentenceIndex}
          attentionLocks={state.attentionLocks}
          streamingSentence={state.currentStreamingText}
          isGenerating={state.status === 'generating'}
          onRegenerateActive={handleRegenerateActive}
          onAddAttentionLock={(phrase) => machine.addAttentionLock(phrase)}
          onRemoveAttentionLock={(phrase) => machine.removeAttentionLock(phrase)}
          language={language}
        />

        {/* Right Side: Steering Knobs & Settings */}
        <div className="side">
          {/* Controls Dial Panel */}
          <div className="panel steering-panel">
            <div className="panel-head">
              <div className="title-row">
                <Rocket className="panel-icon text-fuchsia" size={18} />
                <h2>{t.steeringPanel}</h2>
              </div>
              <p>{t.steeringPanelSub}</p>
            </div>

            <div className="steering-grid">
              <Knob
                label={t.knobTone}
                minLabel={t.knobToneMin}
                maxLabel={t.knobToneMax}
                value={localKnobs.tone}
                onChange={(val) => handleKnobChange('tone', val)}
                color="var(--cyan)"
              />
              <Knob
                label={t.knobTension}
                minLabel={t.knobTensionMin}
                maxLabel={t.knobTensionMax}
                value={localKnobs.tension}
                onChange={(val) => handleKnobChange('tension', val)}
                color="var(--rose)"
              />
              <Knob
                label={t.knobDistance}
                minLabel={t.knobDistanceMin}
                maxLabel={t.knobDistanceMax}
                value={localKnobs.distance}
                onChange={(val) => handleKnobChange('distance', val)}
                color="var(--violet)"
              />
            </div>

            {/* Run / Stop Button */}
            <div className="action-block">
              {state.status === 'generating' ? (
                <button 
                  type="button"
                  className="btn-generate btn-pause" 
                  onClick={handlePauseGeneration}
                >
                  <Pause size={18} />
                  <span>{t.pauseBtn}</span>
                </button>
              ) : (
                <button 
                  type="button"
                  className={`btn-generate ${state.sentences.length === 0 ? 'btn-pulse-ring' : ''}`} 
                  onClick={handleStartGeneration}
                >
                  <Play size={18} fill="currentColor" />
                  <span>{t.engageBtn}</span>
                </button>
              )}

              <div className="status-badge">
                <span className={`status-dot ${state.status === 'generating' ? 'active' : ''}`} />
                <span>
                  {t.engineStatus} : {
                    state.status === 'generating' 
                      ? t.engineGenerating 
                      : state.status === 'paused' 
                        ? t.enginePaused 
                        : t.engineIdle
                  }
                </span>
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
            language={language}
          />

          {/* API Keys and Provider config */}
          <Settings
            config={config}
            onChangeConfig={handleConfigChange}
            language={language}
          />
        </div>
      </main>

      {/* Footer Credits */}
      <footer className="credits">
        <p>{t.creditOriginal}</p>
        <div className="credit-links">
          <a href="https://github.com/chuanqisun/spaceship" target="_blank" rel="noopener noreferrer">Original Repository</a>
          <a href="https://chuanqisun.github.io/spaceship/" target="_blank" rel="noopener noreferrer">Live Simulator</a>
          <a href="https://x.com/RileyRalmuto/status/2122579675738231170" target="_blank" rel="noopener noreferrer">Original Post</a>
        </div>
      </footer>
    </div>
  );
};
