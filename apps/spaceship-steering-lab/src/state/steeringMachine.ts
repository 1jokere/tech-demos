export interface Knobs {
  tone: number; // 0.0 (Dark) to 1.0 (Light)
  tension: number; // 0.0 (Calm) to 1.0 (Intense)
  distance: number; // 0.0 (Close) to 1.0 (Far)
}

export interface Sentence {
  id: string;
  text: string;
  knobs: Knobs;
  attentionLocks: string[];
  focusPhrase?: string;
}

export interface Branch {
  id: string;
  name: string;
  sentences: Sentence[];
  knobs: Knobs;
  activeSentenceIndex: number;
  timestamp: number;
}

export interface SteeringState {
  premise: string;
  sentences: Sentence[];
  activeSentenceIndex: number; // -1 means only premise, 0 means premise + 1 sentence, etc.
  knobs: Knobs;
  attentionLocks: string[];
  branches: Branch[];
  status: 'idle' | 'generating' | 'paused';
  currentStreamingText: string;
  currentStreamingFocus?: string;
}

export class SteeringMachine {
  private state: SteeringState;
  private listeners: Set<(state: SteeringState) => void> = new Set();
  private abortController: AbortController | null = null;

  constructor(initialPremise = "A lone exploration vessel drifts in the silent shadow of a massive, dead stellar gate.") {
    this.state = {
      premise: initialPremise,
      sentences: [],
      activeSentenceIndex: -1,
      knobs: { tone: 0.3, tension: 0.5, distance: 0.5 },
      attentionLocks: [],
      branches: [],
      status: 'idle',
      currentStreamingText: '',
      currentStreamingFocus: undefined
    };
  }

  public getState(): SteeringState {
    return { ...this.state };
  }

  public subscribe(listener: (state: SteeringState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = { ...this.state };
    this.listeners.forEach(listener => listener(currentState));
  }

  public setPremise(premise: string) {
    this.cancelGeneration();
    this.state.premise = premise;
    this.state.sentences = [];
    this.state.activeSentenceIndex = -1;
    this.state.currentStreamingText = '';
    this.state.currentStreamingFocus = undefined;
    this.notify();
  }

  public setKnobs(newKnobs: Partial<Knobs>) {
    this.state.knobs = { ...this.state.knobs, ...newKnobs };
    // If generating, cancel current in-flight stream and regenerate from the active index
    if (this.state.status === 'generating') {
      this.regenerateCurrentOrNext();
    } else {
      this.notify();
    }
  }

  public addAttentionLock(phrase: string) {
    const trimmed = phrase.trim();
    if (trimmed && !this.state.attentionLocks.includes(trimmed)) {
      this.state.attentionLocks = [...this.state.attentionLocks, trimmed];
      if (this.state.status === 'generating') {
        this.regenerateCurrentOrNext();
      } else {
        this.notify();
      }
    }
  }

  public removeAttentionLock(phrase: string) {
    this.state.attentionLocks = this.state.attentionLocks.filter(p => p !== phrase);
    if (this.state.status === 'generating') {
      this.regenerateCurrentOrNext();
    } else {
      this.notify();
    }
  }

  public clearAttentionLocks() {
    this.state.attentionLocks = [];
    if (this.state.status === 'generating') {
      this.regenerateCurrentOrNext();
    } else {
      this.notify();
    }
  }

  public scrubTo(index: number) {
    // Scrub to an index. -1 means premise only.
    if (index < -1 || index >= this.state.sentences.length) return;

    this.cancelGeneration();
    this.state.activeSentenceIndex = index;
    this.state.currentStreamingText = '';
    this.state.currentStreamingFocus = undefined;
    this.state.status = 'paused';
    this.notify();
  }

  public restoreBranch(branchId: string) {
    const branch = this.state.branches.find(b => b.id === branchId);
    if (!branch) return;

    this.cancelGeneration();

    // Save current active state as a branch first if it has sentences and differs from the branch we are restoring
    this.saveCurrentAsBranch("Before restoring branch");

    this.state.sentences = [...branch.sentences];
    this.state.knobs = { ...branch.knobs };
    this.state.activeSentenceIndex = branch.activeSentenceIndex;
    this.state.currentStreamingText = '';
    this.state.currentStreamingFocus = undefined;
    this.state.status = 'paused';

    // Remove the branch we just restored from the branches history to avoid duplication
    this.state.branches = this.state.branches.filter(b => b.id !== branchId);

    this.notify();
  }

  public saveCurrentAsBranch(description: string) {
    // Only save if there are generated sentences to save
    if (this.state.sentences.length === 0) return;

    // Check if this path is already saved as a branch (to avoid duplicates)
    const currentSentencesText = this.state.sentences.map(s => s.text).join(' ');
    const alreadySaved = this.state.branches.some(b => {
      const branchText = b.sentences.map(s => s.text).join(' ');
      return branchText === currentSentencesText && b.activeSentenceIndex === this.state.activeSentenceIndex;
    });

    if (alreadySaved) return;

    const toneLabel = this.state.knobs.tone < 0.35 ? "Dark" : this.state.knobs.tone > 0.65 ? "Light" : "Neutral";
    const tensionLabel = this.state.knobs.tension < 0.35 ? "Calm" : this.state.knobs.tension > 0.65 ? "Intense" : "Steady";
    const name = `${description} (${toneLabel}/${tensionLabel}, ${this.state.activeSentenceIndex + 1} s.)`;

    const newBranch: Branch = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      sentences: [...this.state.sentences],
      knobs: { ...this.state.knobs },
      activeSentenceIndex: this.state.activeSentenceIndex,
      timestamp: Date.now()
    };

    // Keep the history capped at last 5 branches (user asked for 2-3 viewable, 5 is safe)
    this.state.branches = [newBranch, ...this.state.branches].slice(0, 5);
  }

  public startGeneration(generatorFn: (storyText: string, knobs: Knobs, locks: string[], signal: AbortSignal) => Promise<{ text: string, focusPhrase?: string }>) {
    if (this.state.status === 'generating') return;

    this.state.status = 'generating';
    this.notify();
    this.runGenerationLoop(generatorFn);
  }

  public pauseGeneration() {
    this.cancelGeneration();
    this.state.status = 'paused';
    this.notify();
  }

  public cancelGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state.currentStreamingText = '';
    this.state.currentStreamingFocus = undefined;
  }

  private async runGenerationLoop(
    generatorFn: (storyText: string, knobs: Knobs, locks: string[], signal: AbortSignal) => Promise<{ text: string, focusPhrase?: string }>
  ) {
    while (this.state.status === 'generating') {
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      // Construct story context up to active sentence
      const visibleSentences = this.state.sentences.slice(0, this.state.activeSentenceIndex + 1);
      const storyText = [this.state.premise, ...visibleSentences.map(s => s.text)].join(' ');

      try {
        const nextIndex = this.state.activeSentenceIndex + 1;
        
        // If we are about to generate a sentence but there are speculative/discarded future sentences after activeSentenceIndex,
        // we should save the entire current future as a branch before truncating it!
        if (this.state.sentences.length > nextIndex) {
          this.saveCurrentAsBranch("Alternative Future");
          // Truncate the future path
          this.state.sentences = this.state.sentences.slice(0, nextIndex);
        }

        const result = await generatorFn(
          storyText,
          { ...this.state.knobs },
          [...this.state.attentionLocks],
          signal
        );

        if (signal.aborted) return;

        const newSentence: Sentence = {
          id: Math.random().toString(36).substring(2, 9),
          text: result.text,
          knobs: { ...this.state.knobs },
          attentionLocks: [...this.state.attentionLocks],
          focusPhrase: result.focusPhrase
        };

        this.state.sentences.push(newSentence);
        this.state.activeSentenceIndex = nextIndex;
        this.state.currentStreamingText = '';
        this.state.currentStreamingFocus = undefined;
        this.notify();

        // Brief delay between sentences in continuous generation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 800);
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });

      } catch (err: any) {
        if (err.name === 'AbortError' || signal.aborted) {
          // Normal abort, exit loop or handle rebuild
          return;
        }
        console.error("Generation error:", err);
        this.state.status = 'paused';
        this.notify();
        break;
      }
    }
  }

  private regenerateCurrentOrNext() {
    // If we are currently generating, we should cancel the in-flight generation
    this.cancelGeneration();

    // If activeSentenceIndex is at the end, we will generate the next.
    // If we are currently generating, let's keep status as generating and restart loop.
    
    // We trigger the generator loop to run again. 
    // To do this smoothly in React, we let the hook or component detect the change or we store the generator function reference.
    // However, the cleanest way is to notify listeners that a restart is needed, or we can just pause generation and let the React UI trigger a restart!
    // Let's pause status to trigger the React hook to restart.
    // Actually, let's set a flag or just let the React component handle the restart of runGenerationLoop.
    // A beautiful design is: the SteeringMachine triggers an event or sets status to 'generating' but cancels the active stream.
    // Let's let the state transition to 'generating' or let the hook handle it.
    // In React, when state.knobs or state.attentionLocks change, the useEffect can handle AbortController canceling the in-flight,
    // and if status is 'generating', it triggers the next call. This is incredibly declarative and robust!
    // So here, we just cancel the stream, truncate any spec futures if activeIndex is set back, and let the React effect trigger the next call.
    this.notify();
  }
}
