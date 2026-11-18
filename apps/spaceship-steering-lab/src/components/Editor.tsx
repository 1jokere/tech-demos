import React, { useState, useRef, useEffect } from 'react';
import { type Sentence } from '../state/steeringMachine';
import { type Language, LOCALES } from '../services/locale';
import { Pin, X, Edit3, Compass, Zap, Lock } from 'lucide-react';

interface EditorProps {
  premise: string;
  onChangePremise: (text: string) => void;
  sentences: Sentence[];
  activeSentenceIndex: number;
  attentionLocks: string[];
  streamingSentence: string;
  isGenerating: boolean;
  onRegenerateActive: () => void;
  onAddAttentionLock: (phrase: string) => void;
  onRemoveAttentionLock: (phrase: string) => void;
  language: Language;
}

export const Editor: React.FC<EditorProps> = ({
  premise,
  onChangePremise,
  sentences,
  activeSentenceIndex,
  attentionLocks,
  streamingSentence,
  isGenerating,
  onRegenerateActive,
  onAddAttentionLock,
  onRemoveAttentionLock,
  language
}) => {
  const [isEditingPremise, setIsEditingPremise] = useState(false);
  const [premiseInput, setPremiseInput] = useState(premise);
  
  // State for floating selection popover
  const [selectionRange, setSelectionRange] = useState<{ text: string; x: number; y: number } | null>(null);
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = LOCALES[language];

  // Synchronize premise input when premise changes from state machine
  useEffect(() => {
    setPremiseInput(premise);
  }, [premise]);

  // Auto scroll story panel to bottom when new chunks arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sentences, streamingSentence, activeSentenceIndex]);

  // Monitor text selection to show floating attention-lock popover
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3 || selectedText.length > 60) {
      setSelectionRange(null);
      return;
    }

    // Check if the selection is inside our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setSelectionRange(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectionRange({
      text: selectedText,
      // Position floating button just above selection
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 40
    });
  };

  useEffect(() => {
    const handleDocumentMouseUp = () => {
      // Delay slightly so click events on the button can register before popover is cleared
      setTimeout(() => {
        handleTextSelection();
      }, 50);
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, []);

  const handleLockAttention = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectionRange) {
      onAddAttentionLock(selectionRange.text);
      setSelectionRange(null);
      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  const handlePremiseSubmit = () => {
    setIsEditingPremise(false);
    onChangePremise(premiseInput);
  };

  // Slices up to the scrubber cursor position
  const visibleSentences = sentences.slice(0, activeSentenceIndex + 1);
  const discardedSentences = sentences.slice(activeSentenceIndex + 1);

  // Get active focus phrase from the hovered sentence
  const activeFocusPhrase = hoveredSentenceIndex !== null && visibleSentences[hoveredSentenceIndex]
    ? visibleSentences[hoveredSentenceIndex].focusPhrase
    : undefined;

  // Helper function to render text and highlight focus phrase
  const renderTextWithHighlights = (text: string) => {
    if (!activeFocusPhrase) return text;
    
    // Clean phrase and text for comparison (case-insensitive, ignore punctuation)
    const cleanPhrase = activeFocusPhrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    if (!cleanPhrase || cleanPhrase.length < 3) return text;

    const escapedPhrase = cleanPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedPhrase})`, 'gi');

    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (part.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() === cleanPhrase) {
        return (
          <span 
            key={idx} 
            className="focus-highlight-text"
            title={language === 'fr' ? "Une phrase suivante s'est appuyée sur cette expression." : "A subsequent sentence self-reported reliance on this phrase."}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="editor-panel panel" ref={containerRef}>
      <div className="panel-head">
        <div className="title-row">
          <Compass className="panel-icon text-cyan" size={18} />
          <h2>{t.storyEditor}</h2>
        </div>
        <p>{t.storyEditorSub}</p>
      </div>

      <div className="story-content-container" style={{ position: 'relative' }}>
        {/* Floating popover button */}
        {selectionRange && (
          <button
            className="floating-lock-btn animate-fade-in"
            style={{
              left: `${selectionRange.x}px`,
              top: `${selectionRange.y}px`,
            }}
            onClick={handleLockAttention}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
          >
            <Pin size={12} />
            <span>{t.lockAttentionBtn} &ldquo;{selectionRange.text.substring(0, 15)}...&rdquo;</span>
          </button>
        )}

        <div className="story-container" ref={scrollRef} style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '20px' }}>
          <div className="story-text-area">
            {/* Premise Section */}
            {isEditingPremise ? (
              <div className="premise-edit-wrapper" style={{ marginBottom: '16px' }}>
                <textarea
                  value={premiseInput}
                  onChange={(e) => setPremiseInput(e.target.value)}
                  className="premise-textarea"
                  rows={3}
                  placeholder={language === 'fr' ? 'Entrez un prémisse de science-fiction...' : 'Enter a sci-fi premise for the story...'}
                />
                <div className="premise-actions">
                  <button className="btn-secondary btn-sm" onClick={() => setIsEditingPremise(false)}>
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button className="btn-primary btn-sm" onClick={handlePremiseSubmit}>
                    {language === 'fr' ? 'Sauvegarder et Réinitialiser' : 'Save & Reset Story'}
                  </button>
                </div>
              </div>
            ) : (
              <span className="story-premise group">
                {renderTextWithHighlights(premise)}
                <button 
                  className="btn-edit-premise"
                  onClick={() => setIsEditingPremise(true)}
                  disabled={isGenerating}
                  title={language === 'fr' ? 'Modifier le prémisse (réinitialisera l\'histoire)' : 'Edit starting premise (will reset story)'}
                >
                  <Edit3 size={12} />
                </button>
              </span>
            )}

            {/* Generated Sentences */}
            {visibleSentences.map((sentence, idx) => {
              const isHovered = hoveredSentenceIndex === idx;
              const toneLabel = sentence.knobs.tone >= 0.5 ? 'sentence-light' : 'sentence-dark';

              return (
                <span
                  key={sentence.id}
                  onMouseEnter={() => setHoveredSentenceIndex(idx)}
                  onMouseLeave={() => setHoveredSentenceIndex(null)}
                  className={`story-sentence ${toneLabel} ${isHovered ? 'is-hovered' : ''}`}
                  title={`Tone: ${Math.round(sentence.knobs.tone * 100)}%, Tension: ${Math.round(sentence.knobs.tension * 100)}%`}
                >
                  {' '}{renderTextWithHighlights(sentence.text)}
                  
                  {sentence.focusPhrase && isHovered && (
                    <span className="focus-phrase-tag animate-fade-in">
                      Focus: &ldquo;{sentence.focusPhrase}&rdquo;
                    </span>
                  )}
                </span>
              );
            })}

            {/* In-flight streaming sentence */}
            {isGenerating && streamingSentence && (
              <span className="story-sentence streaming-text">
                {' '}{streamingSentence}
                <span className="blinking-cursor">▋</span>
              </span>
            )}

            {isGenerating && !streamingSentence && (
              <span className="story-sentence streaming-pending">
                {' '}<span className="pulse-dots">{t.thinking}<span>.</span><span>.</span><span>.</span></span>
              </span>
            )}

            {/* Scrubbed/Discarded future preview in grey italic */}
            {discardedSentences.length > 0 && !isGenerating && (
              <span className="discarded-futures-preview" title={language === 'fr' ? 'Sera écrasé lors du prochain virage' : 'Will be overwritten upon next steering'}>
                {' '}{discardedSentences.map((s) => s.text).join(' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="editor-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={onRegenerateActive}
          disabled={isGenerating || visibleSentences.length === 0}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Zap size={14} />
          <span>{t.regenerateButton}</span>
        </button>
        {isGenerating && (
          <span className="status-label text-cyan animate-pulse" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
            {t.steeringFuture}...
          </span>
        )}
      </div>

      {/* Attention Locks Container */}
      <div className="attention-locks-container" style={{ marginTop: '20px' }}>
        <div className="locks-header">
          <Lock size={14} className="text-cyan" />
          <span>{t.attentionLocks}:</span>
        </div>
        
        {attentionLocks.length === 0 ? (
          <span className="no-locks-hint">
            {t.attentionLocksEmpty}
          </span>
        ) : (
          <div className="locks-chips">
            {attentionLocks.map((lock) => (
              <div key={lock} className="lock-chip">
                <Pin size={10} className="text-cyan" />
                <span className="lock-text">{lock}</span>
                <button 
                  className="btn-remove-lock" 
                  onClick={() => onRemoveAttentionLock(lock)}
                  title={language === 'fr' ? 'Déverrouiller l\'attention' : 'Unlock attention'}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
