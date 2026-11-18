import React from 'react';
import { type Branch, type Sentence } from '../state/steeringMachine';
import { type Language, LOCALES } from '../services/locale';
import { GitFork, History, ChevronRight } from 'lucide-react';

interface TimelineProps {
  sentences: Sentence[];
  activeSentenceIndex: number;
  branches: Branch[];
  onScrub: (index: number) => void;
  onRestoreBranch: (branchId: string) => void;
  language: Language;
}

export const Timeline: React.FC<TimelineProps> = ({
  sentences,
  activeSentenceIndex,
  branches,
  onScrub,
  onRestoreBranch,
  language
}) => {
  const totalSteps = sentences.length;
  const t = LOCALES[language];

  return (
    <div className="timeline-panel panel">
      <div className="panel-head">
        <div className="title-row">
          <History className="panel-icon text-cyan" size={18} />
          <h2>{t.timelinePanel}</h2>
        </div>
        <p>{t.timelinePanelSub}</p>
      </div>

      {totalSteps === 0 ? (
        <div className="timeline-empty">
          <p>{t.timelineEmpty}</p>
        </div>
      ) : (
        <div className="timeline-content">
          {/* Custom Slider / Scrubber */}
          <div className="scrubber-container">
            <div className="scrubber-header">
              <span>{t.activeTimeline}: <strong>{activeSentenceIndex + 1}</strong> / {totalSteps} sentences</span>
              <button 
                className="btn-text" 
                onClick={() => onScrub(-1)}
                disabled={activeSentenceIndex === -1}
              >
                {t.resetPremise}
              </button>
            </div>

            <div className="scrubber-slider-wrapper">
              <input
                type="range"
                min="-1"
                max={totalSteps - 1}
                value={activeSentenceIndex}
                onChange={(e) => onScrub(parseInt(e.target.value))}
                className="timeline-slider"
              />
              <div className="slider-ticks">
                <span className={`tick-label ${activeSentenceIndex === -1 ? 'active' : ''}`}>{t.ticksPremise}</span>
                {sentences.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`tick-label ${activeSentenceIndex === idx ? 'active' : ''} ${idx > activeSentenceIndex ? 'discarded' : ''}`}
                    onClick={() => onScrub(idx)}
                  >
                    S{idx + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Segmented Interactive Timeline Track */}
          <div className="segments-track">
            <span className="track-label-side">{language === 'fr' ? 'Début' : 'Start'}</span>
            <div className="segments-container">
              <div 
                className={`segment premise-segment ${activeSentenceIndex === -1 ? 'active' : ''}`}
                onClick={() => onScrub(-1)}
                title="Premise"
              />
              {sentences.map((sentence, idx) => {
                const isActive = idx === activeSentenceIndex;
                const isPast = idx < activeSentenceIndex;
                const isDiscarded = idx > activeSentenceIndex;
                
                const toneGlow = sentence.knobs.tone >= 0.5 ? 'glow-light' : 'glow-dark';

                return (
                  <div
                    key={sentence.id}
                    onClick={() => onScrub(idx)}
                    className={`segment ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isDiscarded ? 'discarded' : ''} ${toneGlow}`}
                    title={`Sentence ${idx + 1}: ${sentence.text.substring(0, 30)}...`}
                  >
                    <span className="segment-number">{idx + 1}</span>
                  </div>
                );
              })}
            </div>
            <span className="track-label-side">Future</span>
          </div>
        </div>
      )}

      {/* Alternative Branches History */}
      <div className="branches-section">
        <div className="branches-header">
          <GitFork size={14} className="text-fuchsia" />
          <h3>{t.parallelFutures} ({branches.length})</h3>
        </div>
        
        {branches.length === 0 ? (
          <p className="branches-empty-text">{t.parallelFuturesEmpty}</p>
        ) : (
          <div className="branches-list">
            {branches.map((branch) => {
              const date = new Date(branch.timestamp);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              
              const restoredName = language === 'fr' 
                ? branch.name.replace("Alternative Future", "Futur Alternatif").replace("Before restoring branch", "Avant restauration")
                : branch.name;

              return (
                <div key={branch.id} className="branch-card" onClick={() => onRestoreBranch(branch.id)}>
                  <div className="branch-info">
                    <span className="branch-name">{restoredName}</span>
                    <span className="branch-meta">{language === 'fr' ? 'Sauvegardé à' : 'Saved at'} {timeString}</span>
                  </div>
                  <button className="btn-restore-branch" title={language === 'fr' ? 'Restaurer ce futur' : 'Restore this future'}>
                    <span>{t.jumpBtn}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
