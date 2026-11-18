import { type Knobs } from '../state/steeringMachine';

export interface LLMConfig {
  provider: 'demo' | 'openai' | 'groq' | 'cerebras' | 'gemini';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Canned story database for Demo Mode
// Progression stages representing different parts of the story
const NARRATIVE_STAGES = [
  // Stage 0: Sensor reading / Discovery
  {
    dark_intense_close: "I felt a chill as the warning lights flared red, signaling a spike of lethal radiation from the decaying gateway.",
    dark_intense_far: "Deep within the silent ring of the dead gateway, sensors suddenly registered a massive spike of high-frequency gamma radiation.",
    dark_calm_close: "I watched the terminal screens slowly update, tracing a cold, ghostly signal that emanated from the dark gateway's core.",
    dark_calm_far: "The dead gateway remained silent, save for a slow, rhythmic radio pulse that resembled a mechanical heartbeat.",
    light_intense_close: "My console lit up with a brilliant blue hum as the dead gateway's core began to spin with clean, golden energy.",
    light_intense_far: "An incredible surge of solar-frequency light burst from the gate, bathing the surrounding nebula in warm sapphire hues.",
    light_calm_close: "I leaned in to see the display humming with a gentle, glowing star pattern, promising a path home through the ancient structure.",
    light_calm_far: "Symmetric arrays of golden starlight began to illuminate the long-dormant conduits of the giant space ring.",
  },
  // Stage 1: Movement / Approach
  {
    dark_intense_close: "I slammed my hand on the thruster override, but the ship groaned, caught in a powerful gravitational undertow towards the dark core.",
    dark_intense_far: "The massive gravitational shadow of the gate began pulling the tiny ship closer, its hull plating screaming under the pressure.",
    dark_calm_close: "I fired the low-output maneuver thrusters, slowly drifting closer to the pitch-black ring of the dead station.",
    dark_calm_far: "The ship drifted into the inner ring, its shadow blending into the colossal black metal of the gate's ribcage.",
    light_intense_close: "A beautiful gravitational swell propelled us forward, the engines singing a high-pitched note of pure speed.",
    light_intense_far: "The ship swept forward on a smooth wave of quantum resonance, gliding effortlessly toward the shimmering center.",
    light_calm_close: "I let the automated drift guide us, watching the starlight paint long, elegant reflections across the cockpit glass.",
    light_calm_far: "With a silent burn of its secondary engines, the exploration vessel settled into a stable orbit inside the shining gateway.",
  },
  // Stage 2: Scan / Contact
  {
    dark_intense_close: "A harsh screeching burst from the radio receiver, drilling directly into my skull like a desperate, mechanical scream.",
    dark_intense_far: "The ship's sub-space radio crackled violently, broadcasting a distorted loop of historical logs from a lost colony crew.",
    dark_calm_close: "I decrypted a faint audio signal, hearing nothing but the rhythmic, agonizingly slow sound of heavy breathing.",
    dark_calm_far: "The gateway's ancient transponder pulsed once more, transmitting a long sequence of encrypted warning codes.",
    light_intense_close: "Suddenly, a clear, beautiful chime echoed through the cockpit, followed by an automated greeting in an ancient but readable dialect.",
    light_intense_far: "The gate's main transmitters activated, broadcasting a warm, harmonic signal that reset and calibrated the vessel's glitching computers.",
    light_calm_close: "I listened to a soft, melodic hum on the speakers, feeling a wave of deep relief as the ship's internal temperature stabilized.",
    light_calm_far: "The central beacon illuminated, transmitting a complete navigational map of the unknown network beyond.",
  },
  // Stage 3: Event / Resolution
  {
    dark_intense_close: "I scrambled to seal my suit as the reactor core cracked, venting a plume of cold, shimmering gas into the cabin.",
    dark_intense_far: "The gateway's inner singularity flared violently, consuming several dead asteroids in silent, blinding bursts of black light.",
    dark_calm_close: "I shut down the reactor, accepting the creeping cold as the only way to avoid the gateway's watchful, scanning eye.",
    dark_calm_far: "The ancient gateway began to power down slowly, folding its giant metallic arches back into the dark slumber of the void.",
    light_intense_close: "A cascade of starlight surrounded my seat, and I realized the gate wasn't a trap—it was an invitation.",
    light_intense_far: "A stable wormhole blossomed at the gate's center, revealing a brilliant glimpse of a vibrant, starlit home galaxy.",
    light_calm_close: "I sighed with relief as the humming gate stabilized, presenting a quiet, glowing corridor through the stars.",
    light_calm_far: "With its system fully restored, the ancient gateway hummed peacefully, waiting for the ship to pass into the glowing light.",
  }
];

// Fallback stages for very long stories
const GENERIC_TEMPLATES = {
  dark_intense_close: "My monitors flickered as another system failed, and I knew time was running out in this cursed patch of space.",
  dark_intense_far: "The stellar storm intensified, sending arcs of chaotic, dark energy across the ship's exposed shielding.",
  dark_calm_close: "I stared into the endless dark, wondering if any ship had ever made it back from this deep of an exploration.",
  dark_calm_far: "The silence of the deep void deepened, swallowing the ship's faint engine signature like a drop in the ocean.",
  light_intense_close: "The controls flashed with gold, and I grinned as the primary thrust came back online with double its normal speed.",
  light_intense_far: "Energy ribbons wrapped around the ship's hull, protecting it and pushing it toward safety with incredible speed.",
  light_calm_close: "I sat back and enjoyed the warm hum of the console, feeling completely safe in the peaceful embrace of the nebula.",
  light_calm_far: "The stars shimmered with absolute clarity, casting a peaceful, iridescent light across the deep field of space.",
};

export function getCannedSentence(
  stageIndex: number,
  knobs: Knobs,
  locks: string[],
  premise: string,
  existingSentences: string[]
): { text: string; focusPhrase: string } {
  // Determine template key based on knobs
  const tone = knobs.tone >= 0.5 ? 'light' : 'dark';
  const tension = knobs.tension >= 0.5 ? 'intense' : 'calm';
  const distance = knobs.distance >= 0.5 ? 'far' : 'close';
  const key = `${tone}_${tension}_${distance}` as keyof typeof NARRATIVE_STAGES[0];

  let rawText = '';
  if (stageIndex < NARRATIVE_STAGES.length) {
    rawText = NARRATIVE_STAGES[stageIndex][key];
  } else {
    rawText = GENERIC_TEMPLATES[key];
  }

  // Weave attention lock if there are any active locks
  let weavedText = rawText;

  if (locks.length > 0) {
    // Pick the first lock or a random lock
    const lock = locks[Math.floor(Math.random() * locks.length)];

    // Find some nouns/phrases in the templates to replace, or insert gracefully
    const replacements = [
      { pattern: /the decaying gateway/gi, repl: `the ${lock}` },
      { pattern: /dead gateway/gi, repl: `${lock}` },
      { pattern: /ancient structure/gi, repl: `${lock}` },
      { pattern: /the gate's core/gi, repl: `the core of ${lock}` },
      { pattern: /dead station/gi, repl: `the silent ${lock}` },
      { pattern: /the shining gateway/gi, repl: `the glowing ${lock}` },
      { pattern: /the speakers/gi, repl: `the speaker systems transmitting from ${lock}` },
      { pattern: /the gateway/gi, repl: `${lock}` },
      { pattern: /the void/gi, repl: `the space surrounding ${lock}` },
      { pattern: /the console/gi, repl: `the console monitoring ${lock}` },
      { pattern: /the stars/gi, repl: `the stardust near ${lock}` },
    ];

    let replaced = false;
    for (const r of replacements) {
      if (r.pattern.test(weavedText)) {
        weavedText = weavedText.replace(r.pattern, r.repl);
        replaced = true;
        break;
      }
    }

    // If no placeholders matched, append the attention lock gracefully
    if (!replaced) {
      if (tone === 'light') {
        weavedText += ` Guided by the resonance of the ${lock}, I felt secure.`;
      } else {
        weavedText += ` Meanwhile, the ghostly presence of the ${lock} continued to loom.`;
      }
    }
  }

  // Focus phrase - let's pick a phrase from the premise or an earlier sentence
  let focusPhrase = '';
  if (existingSentences.length > 0) {
    const prevText = existingSentences[existingSentences.length - 1];
    const words = prevText.split(' ');
    if (words.length > 4) {
      // Pick a random 2-3 word phrase from the previous sentence
      const startIdx = Math.floor(Math.random() * (words.length - 3));
      focusPhrase = words.slice(startIdx, startIdx + 3).join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    } else {
      focusPhrase = words.join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    }
  } else {
    // From premise
    const words = premise.split(' ');
    if (words.length > 4) {
      const startIdx = Math.floor(Math.random() * (words.length - 3));
      focusPhrase = words.slice(startIdx, startIdx + 3).join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    } else {
      focusPhrase = "silent shadow";
    }
  }

  return { text: weavedText, focusPhrase };
}

// Actual API streaming
export async function streamLLMGeneration(
  config: LLMConfig,
  storyText: string,
  knobs: Knobs,
  locks: string[],
  onChunk: (text: string, focusPhrase?: string) => void,
  signal: AbortSignal
): Promise<{ text: string; focusPhrase?: string }> {
  if (config.provider === 'demo') {
    // Simulate streaming for demo mode
    // We already have existing sentences count from splitting storyText
    // Let's count how many sentences there are (excluding premise)
    // Wait, let's just approximate based on length
    const sentencesCount = Math.max(0, storyText.split(/[.!?]+/).filter(x => x.trim().length > 0).length - 1);
    
    // Split the storyText to extract premise and earlier sentences
    const sentences = storyText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const premise = sentences[0] || "A lone vessel drifts.";
    const existing = sentences.slice(1);

    const canned = getCannedSentence(sentencesCount, knobs, locks, premise, existing);
    
    // Stream canned text word-by-word
    const words = canned.text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      currentText += (i === 0 ? '' : ' ') + words[i];
      // Stream focus phrase after a few words
      const focusPhrase = i >= words.length / 2 ? canned.focusPhrase : undefined;
      onChunk(currentText, focusPhrase);
      
      // Delay to simulate typing (approx 50-80ms per word)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 60 + Math.random() * 40);
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }

    return { text: canned.text, focusPhrase: canned.focusPhrase };
  }

  // Real LLM call
  let apiKey = config.apiKey;
  let baseUrl = config.baseUrl;
  let model = config.model;

  if (config.provider === 'openai') {
    baseUrl = baseUrl || 'https://api.openai.com/v1';
    model = model || 'gpt-4o-mini';
  } else if (config.provider === 'groq') {
    baseUrl = baseUrl || 'https://api.groq.com/openai/v1';
    model = model || 'llama-3.3-70b-specdec';
  } else if (config.provider === 'cerebras') {
    baseUrl = baseUrl || 'https://api.cerebras.ai/v1';
    model = model || 'llama3.1-8b';
  } else if (config.provider === 'gemini') {
    baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai';
    model = model || 'gemini-1.5-flash';
  }

  if (!apiKey) {
    throw new Error('API key is required for real LLM streaming');
  }

  const toneText = knobs.tone < 0.35 ? "ominous, dark, mysterious, cold" : knobs.tone > 0.65 ? "hopeful, beautiful, warm, awe-inspiring" : "balanced, neutral";
  const tensionText = knobs.tension < 0.35 ? "calm, relaxed, slow-paced, tranquil" : knobs.tension > 0.65 ? "suspenseful, high-stakes, urgent, dangerous" : "steady, deliberate";
  const distanceText = knobs.distance < 0.35 ? "very close, intimate, first-person thoughts and deep emotional/sensory details (use 'I' or highly intimate language)" : knobs.distance > 0.65 ? "distant, cinematic, third-person objective, describing grand events from afar" : "middle-distance narrating";

  const attentionLockPrompt = locks.length > 0
    ? `IMPORTANT CONSTRAINTS: You must weave in or build directly upon these exact phrase(s): ${locks.map(l => `"${l}"`).join(', ')}. Keep them central to the sentence.`
    : '';

  const systemPrompt = `You are a fast, collaborative real-time sci-fi story generator.
Your job is to generate exactly ONE single, punchy continuation sentence for the story provided by the user.
You MUST steer the style, tone, and pacing of this sentence based on these round knob steering values:
- Tone (Dark to Light): ${knobs.tone.toFixed(2)} (Use style: ${toneText})
- Tension (Calm to Intense): ${knobs.tension.toFixed(2)} (Use style: ${tensionText})
- Narrative Distance (Close to Far): ${knobs.distance.toFixed(2)} (Use style: ${distanceText})

${attentionLockPrompt}

Your response must strictly be formatted as:
Focus: "phrase from earlier story that inspired this sentence"
Sentence: Next single continuation sentence here.

Do not write more than one sentence. Do not include markdown formatting like bolding outside the specified format. Be extremely creative and match the requested style values precisely.`;

  const userPrompt = `Here is the story so far:\n${storyText}\n\nWrite the next sentence following the steer values.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: 0.85
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder('utf-8');
  let fullStreamText = '';
  let sentenceText = '';
  let focusPhrase = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const cleanedLine = line.trim();
        if (!cleanedLine.startsWith('data: ')) continue;
        if (cleanedLine === 'data: [DONE]') continue;

        try {
          const parsed = JSON.parse(cleanedLine.slice(6));
          const deltaContent = parsed.choices?.[0]?.delta?.content || '';
          fullStreamText += deltaContent;

          // Parse fullStreamText to separate Focus: and Sentence:
          // Format: Focus: "..." \n Sentence: ...
          const focusMatch = fullStreamText.match(/Focus:\s*["']?([^"\n'\r]+)["']?/i);
          const sentenceIndex = fullStreamText.toLowerCase().indexOf('sentence:');

          if (focusMatch) {
            focusPhrase = focusMatch[1].trim();
          }

          if (sentenceIndex !== -1) {
            sentenceText = fullStreamText.slice(sentenceIndex + 9).trim();
          } else {
            // If we don't have "Sentence:" yet, but have text, we are still streaming focus or preamble
            sentenceText = '';
          }

          // Trigger chunk callback
          onChunk(sentenceText || fullStreamText, focusPhrase || undefined);
        } catch (e) {
          // Ignore parse errors on partial lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: sentenceText || fullStreamText, focusPhrase: focusPhrase || undefined };
}
