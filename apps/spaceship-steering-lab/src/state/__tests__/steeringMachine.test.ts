import { describe, test, expect } from 'bun:test';
import { SteeringMachine } from '../steeringMachine';

describe('SteeringMachine State Machine', () => {
  test('should initialize with default values', () => {
    const machine = new SteeringMachine();
    const state = machine.getState();

    expect(state.premise).toContain('vessel drifts');
    expect(state.sentences).toHaveLength(0);
    expect(state.activeSentenceIndex).toBe(-1);
    expect(state.knobs.tone).toBe(0.3);
    expect(state.attentionLocks).toHaveLength(0);
    expect(state.branches).toHaveLength(0);
    expect(state.status).toBe('idle');
  });

  test('should update premise', () => {
    const machine = new SteeringMachine();
    machine.setPremise('New premise text');
    const state = machine.getState();

    expect(state.premise).toBe('New premise text');
    expect(state.sentences).toHaveLength(0);
    expect(state.activeSentenceIndex).toBe(-1);
  });

  test('should handle knobs update', () => {
    const machine = new SteeringMachine();
    machine.setKnobs({ tone: 0.8, tension: 0.2 });
    const state = machine.getState();

    expect(state.knobs.tone).toBe(0.8);
    expect(state.knobs.tension).toBe(0.2);
    expect(state.knobs.distance).toBe(0.5); // unchanged
  });

  test('should manage attention locks', () => {
    const machine = new SteeringMachine();
    
    machine.addAttentionLock('glowing engine');
    expect(machine.getState().attentionLocks).toContain('glowing engine');

    // Prevent duplicates
    machine.addAttentionLock('glowing engine');
    expect(machine.getState().attentionLocks).toHaveLength(1);

    machine.addAttentionLock('solar sails');
    expect(machine.getState().attentionLocks).toHaveLength(2);

    machine.removeAttentionLock('glowing engine');
    expect(machine.getState().attentionLocks).not.toContain('glowing engine');
    expect(machine.getState().attentionLocks).toContain('solar sails');

    machine.clearAttentionLocks();
    expect(machine.getState().attentionLocks).toHaveLength(0);
  });

  test('should scrub timeline', () => {
    const machine = new SteeringMachine();
    // Manually push some mock sentences to state for test
    const dummyKnobs = { tone: 0.5, tension: 0.5, distance: 0.5 };
    const state = (machine as any).state;
    state.sentences = [
      { id: '1', text: 'Sentence one.', knobs: dummyKnobs, attentionLocks: [] },
      { id: '2', text: 'Sentence two.', knobs: dummyKnobs, attentionLocks: [] },
      { id: '3', text: 'Sentence three.', knobs: dummyKnobs, attentionLocks: [] },
    ];
    state.activeSentenceIndex = 2;

    machine.scrubTo(0); // Scrub back to sentence one
    expect(machine.getState().activeSentenceIndex).toBe(0);
    expect(machine.getState().status).toBe('paused');

    machine.scrubTo(-1); // Scrub back to premise only
    expect(machine.getState().activeSentenceIndex).toBe(-1);
  });

  test('should fork alternative branches when generating over existing sentences', async () => {
    const machine = new SteeringMachine();
    const dummyKnobs = { tone: 0.5, tension: 0.5, distance: 0.5 };
    const state = (machine as any).state;
    state.sentences = [
      { id: '1', text: 'Sentence one.', knobs: dummyKnobs, attentionLocks: [] },
      { id: '2', text: 'Sentence two.', knobs: dummyKnobs, attentionLocks: [] },
      { id: '3', text: 'Sentence three.', knobs: dummyKnobs, attentionLocks: [] },
    ];
    state.activeSentenceIndex = 1; // active is sentence two

    // Simulate starting generation
    const mockGenerator = async () => {
      return { text: 'New alternative sentence three.', focusPhrase: 'Sentence two.' };
    };

    // When starting generation, since index is 1 and sentences has length 3,
    // the old continuation (length 3) should be saved as an alternative branch,
    // and sentences truncated to length 2.
    machine.startGeneration(mockGenerator);
    
    // Wait briefly for the first async tick of startGeneration
    await new Promise(resolve => setTimeout(resolve, 50));

    const currentState = machine.getState();
    expect(currentState.branches).toHaveLength(1);
    expect(currentState.branches[0].name).toContain('Alternative Future');
    expect(currentState.branches[0].sentences).toHaveLength(3); // holds original 3 sentences
    expect(currentState.sentences[2].text).toBe('New alternative sentence three.'); // new generated sentence
    
    machine.pauseGeneration();
  });
});
