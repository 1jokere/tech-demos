import { describe, test, expect } from 'bun:test';
import { sanitizeSentence, extractFocusPhrase } from '../llm';

describe('Story Sanitizer & Helper Services', () => {
  describe('sanitizeSentence', () => {
    test('should clean thought and reasoning XML blocks', () => {
      const input = '<thought>Let me think. The tone is dark.</thought>My actual story sentence here.';
      const result = sanitizeSentence(input);
      expect(result.cleanText).toBe('My actual story sentence here.');
    });

    test('should clean unfinished thought blocks at the end', () => {
      const input = 'My actual story sentence.<thought>And now I start thinking...';
      const result = sanitizeSentence(input);
      expect(result.cleanText).toBe('My actual story sentence.');
    });

    test('should strip leading "Focus:" and "Focus :" prefixes', () => {
      const input1 = 'Focus: This is the sentence.';
      const input2 = 'Focus   : This is another sentence.';
      
      expect(sanitizeSentence(input1).cleanText).toBe('This is the sentence.');
      expect(sanitizeSentence(input2).cleanText).toBe('This is another sentence.');
    });

    test('should strip Focus-Sentence dual compound formats', () => {
      const input = 'Focus: "the silent ring" Sentence: The spacecraft engaged its secondary thrusters.';
      const result = sanitizeSentence(input);
      expect(result.cleanText).toBe('The spacecraft engaged its secondary thrusters.');
    });

    test('should strip leading "Sentence:" prefixes', () => {
      const input = 'Sentence: A brilliant light flashed in the distance.';
      const result = sanitizeSentence(input);
      expect(result.cleanText).toBe('A brilliant light flashed in the distance.');
    });

    test('should trim wrapping double and single quotes', () => {
      const input1 = '"The stardust shimmered."';
      const input2 = "'A cold chill swept the cabin.'";
      
      expect(sanitizeSentence(input1).cleanText).toBe('The stardust shimmered.');
      expect(sanitizeSentence(input2).cleanText).toBe('A cold chill swept the cabin.');
    });

    test('should detect exact duplicate sentences after normalization', () => {
      const current = 'Les étoiles brillent dans le ciel.';
      const prev = 'Les étoiles brillent dans le ciel!';
      
      const result = sanitizeSentence(current, prev);
      expect(result.isDuplicate).toBe(true);
    });

    test('should detect substring containment duplicate sentences', () => {
      const current = 'Le vent de l\'ombre s\'estompe lentement.';
      const prev = 'Le vent de l\'ombre s\'estompe';
      
      const result1 = sanitizeSentence(current, prev);
      const result2 = sanitizeSentence(prev, current);
      
      expect(result1.isDuplicate).toBe(true);
      expect(result2.isDuplicate).toBe(true);
    });

    test('should detect duplicates based on high word overlap (>65%)', () => {
      const current = 'The exploration ship sailed quietly into the gateway.';
      const prev = 'The exploration vessel sailed quietly into that gateway.';
      // overlapping words: "The", "exploration", "sailed", "quietly", "into", "gateway" (6 out of 8 words identical)
      
      const result = sanitizeSentence(current, prev);
      expect(result.isDuplicate).toBe(true);
    });

    test('should NOT flag completely different sentences as duplicates', () => {
      const current = 'A warm surge of power initialized the primary reactors.';
      const prev = 'A cold chill swept across the cockpit as alarms flared.';
      
      const result = sanitizeSentence(current, prev);
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('extractFocusPhrase', () => {
    test('should return an active attention lock if present', () => {
      const locks = ['ancient ring', 'solar flare'];
      const focus = extractFocusPhrase('Story text here.', locks);
      expect(locks).toContain(focus);
    });

    test('should extract a valid 3-word phrase from previous story if locks are empty', () => {
      const story = 'The ship drifted in the dark cold void.';
      const focus = extractFocusPhrase(story, []);
      expect(focus.length).toBeGreaterThan(3);
      // It should be 3 words long
      expect(focus.split(' ')).toHaveLength(3);
    });
  });
});
