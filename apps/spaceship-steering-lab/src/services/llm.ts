import { type Knobs } from '../state/steeringMachine';

export interface LLMConfig {
  provider: 'demo' | 'openai' | 'groq' | 'cerebras' | 'gemini';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Canned story databases for Demo Mode
const NARRATIVE_STAGES_EN = [
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

const GENERIC_TEMPLATES_EN = {
  dark_intense_close: "My monitors flickered as another system failed, and I knew time was running out in this cursed patch of space.",
  dark_intense_far: "The stellar storm intensified, sending arcs of chaotic, dark energy across the ship's exposed shielding.",
  dark_calm_close: "I stared into the endless dark, wondering if any ship had ever made it back from this deep of an exploration.",
  dark_calm_far: "The silence of the deep void deepened, swallowing the ship's faint engine signature like a drop in the ocean.",
  light_intense_close: "The controls flashed with gold, and I grinned as the primary thrust came back online with double its normal speed.",
  light_intense_far: "Energy ribbons wrapped around the ship's hull, protecting it and pushing it toward safety with incredible speed.",
  light_calm_close: "I sat back and enjoyed the warm hum of the console, feeling completely safe in the peaceful embrace of the nebula.",
  light_calm_far: "The stars shimmered with absolute clarity, casting a peaceful, iridescent light across the deep field of space.",
};

const NARRATIVE_STAGES_FR = [
  // Stage 0: Sensor reading / Discovery
  {
    dark_intense_close: "J'ai ressenti un frisson alors que les voyants d'alarme clignotaient en rouge, signalant un pic de radiation mortelle de la porte en ruine.",
    dark_intense_far: "Au cœur du cercle silencieux de la porte morte, les capteurs ont soudainement enregistré un pic de rayons gamma de haute fréquence.",
    dark_calm_close: "J'ai observé les écrans du terminal se mettre à jour lentement, traçant un signal froid et fantomatique émanant du cœur de la porte noire.",
    dark_calm_far: "La porte morte est restée silencieuse, à l'exception d'une impulsion radio lente et rythmée ressemblant à un battement de cœur mécanique.",
    light_intense_close: "Mon cockpit s'est illuminé d'un vrombissement bleu vif tandis que le cœur de la porte morte commençait à tourner avec une énergie dorée.",
    light_intense_far: "Un incroyable sursaut de lumière solaire a jailli de la porte, baignant la nébuleuse environnante de chaudes teintes de saphir.",
    light_calm_close: "Je me suis penché pour voir l'écran scintiller d'un motif d'étoiles douces, promettant un chemin de retour à travers l'ancienne structure.",
    light_calm_far: "Des réseaux symétriques de poussière d'étoiles dorées ont commencé à illuminer les conduits longtemps endormis de la gigantesque structure circulaire.",
  },
  // Stage 1: Movement / Approach
  {
    dark_intense_close: "J'ai forcé les propulseurs d'urgence, mais le vaisseau a grondé, pris dans un puissant courant gravitationnel vers le cœur sombre.",
    dark_intense_far: "L'ombre gravitationnelle massive de la porte a commencé à attirer le minuscule vaisseau, sa coque hurlant sous la pression.",
    dark_calm_close: "J'ai activé les propulseurs de manœuvre à faible puissance, dérivant lentement vers l'anneau noir de la station morte.",
    dark_calm_far: "Le vaisseau a glissé à l'intérieur de l'anneau, son ombre se confondant avec le métal colossal de la structure de la porte.",
    light_intense_close: "Une magnifique impulsion gravitationnelle nous a propulsés en avant, les moteurs émettant une note cristalline de vitesse pure.",
    light_intense_far: "Le vaisseau a balayé l'espace sur une onde fluide de résonance quantique, glissant sans effort vers le centre scintillant.",
    light_calm_close: "J'ai laissé la dérive automatique nous guider, observant la lumière des étoiles peindre de superbes reflets sur la verrière.",
    light_calm_far: "Avec une douce poussée de ses moteurs secondaires, le vaisseau s'est stabilisé sur une orbite sereine au cœur de la porte brillante.",
  },
  // Stage 2: Scan / Contact
  {
    dark_intense_close: "Un grésillement strident a jailli du récepteur radio, résonnant dans mon crâne comme un cri mécanique désespéré.",
    dark_intense_far: "La radio sub-spatiale du vaisseau a crépité violemment, diffusant en boucle les journaux déformés d'un équipage perdu.",
    dark_calm_close: "J'ai décrypté un signal audio ténu, n'entendant rien d'autre que le son lent d'une respiration lourde.",
    dark_calm_far: "Le transpondeur antique de la porte a émis une nouvelle impulsion, transmettant une longue séquence de codes d'alerte cryptés.",
    light_intense_close: "Soudain, un carillon clair et magnifique a résonné dans le cockpit, suivi d'un salut automatisé dans un dialecte ancien mais lisible.",
    light_intense_far: "Les émetteurs principaux de la porte se sont activés, diffusant un signal harmonique chaleureux qui a recalibré les ordinateurs du vaisseau.",
    light_calm_close: "J'ai écouté un doux murmure mélodique sur les haut-parleurs, ressentant un profond soulagement alors que la température se stabilisait.",
    light_calm_far: "La balise centrale s'est illuminée, transmettant une carte de navigation complète du réseau inconnu qui s'ouvrait au-delà.",
  },
  // Stage 3: Event / Resolution
  {
    dark_intense_close: "Je me suis dépêché de sceller ma combinaison alors que le cœur du réacteur se fissurait, libérant un panache de gaz froid dans la cabine.",
    dark_intense_far: "La singularité interne de la porte a brillé violemment, consumant plusieurs astéroïdes morts dans de silencieux éclats de lumière noire.",
    dark_calm_close: "J'ai éteint le réacteur, acceptant le froid glacial pour échapper à l'œil attentif et scanner de la porte antique.",
    dark_calm_far: "La porte s'est éteinte lentement, repliant ses arches métalliques géantes dans le sommeil sombre et éternel du vide.",
    light_intense_close: "Une cascade de poussière d'étoiles a enveloppé mon siège, et j'ai compris que la porte n'était pas un piège, mais une invitation.",
    light_intense_far: "Un trou de ver stable s'est épanoui au centre de la porte, révélant un aperçu brillant d'une galaxie d'origine radieuse.",
    light_calm_close: "J'ai soupiré de soulagement alors que la porte s'harmonisait, révélant un couloir paisible et lumineux à travers les étoiles.",
    light_calm_far: "Son système étant entièrement restauré, la porte antique a fredonné paisiblement, attendant que le vaisseau franchisse sa lumière.",
  }
];

const GENERIC_TEMPLATES_FR = {
  dark_intense_close: "Mes moniteurs ont vacillé alors qu'un autre système tombait en panne, et je savais que le temps pressait dans ce secteur maudit.",
  dark_intense_far: "La tempête stellaire s'est intensifiée, envoyant des arcs d'énergie chaotique et sombre à travers les boucliers du vaisseau.",
  dark_calm_close: "J'ai plongé mon regard dans le noir infini, me demandant si un équipage était déjà revenu d'une exploration aussi lointaine.",
  dark_calm_far: "Le silence du vide s'est approfondi, engloutissant la faible signature du moteur du vaisseau comme une goutte d'eau dans l'océan.",
  light_intense_close: "Les commandes ont clignoté en doré, et j'ai souri en voyant la poussée principale revenir en ligne à double puissance.",
  light_intense_far: "Des rubans d'énergie ont enveloppé la coque du vaisseau, le protégeant et le propulsant vers la sécurité à une vitesse incroyable.",
  light_calm_close: "Je me suis adossé à mon siège, profitant du doux bourdonnement de la console, me sentant en sécurité dans les bras de la nébuleuse.",
  light_calm_far: "Les étoiles brillaient avec une clarté absolue, projetant une lumière iridescente et apaisante sur le champ infini de l'espace.",
};

/**
 * Sanitizes the generated text to clean thoughts, strip any leaked formatting wrappers or labels,
 * and double-check near-duplicate content similarity.
 */
export function sanitizeSentence(
  text: string,
  previousSentenceText?: string
): { cleanText: string; isDuplicate: boolean } {
  // 1. Clean thought and reasoning blocks
  let cleanText = text
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .replace(/<thought>[\s\S]*$/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/<reasoning>[\s\S]*$/gi, '')
    .replace(/<\/thought>/gi, '')
    .replace(/<\/reasoning>/gi, '')
    .trim();

  // 2. Strip leaked Focus and Sentence labels cleanly (and optional quotes)
  const focusSentenceRegex = /^focus:\s*["']?[\s\S]*?["']?\s*sentence:\s*/i;
  if (focusSentenceRegex.test(cleanText)) {
    cleanText = cleanText.replace(focusSentenceRegex, '');
  }

  // Strip standard "Focus:" or "Focus :" prefixes
  const leadingFocusRegex = /^focus\s*:\s*/i;
  if (leadingFocusRegex.test(cleanText)) {
    cleanText = cleanText.replace(leadingFocusRegex, '');
  }

  // Strip standard "Sentence:" prefixes
  const leadingSentenceRegex = /^sentence\s*:\s*/i;
  if (leadingSentenceRegex.test(cleanText)) {
    cleanText = cleanText.replace(leadingSentenceRegex, '');
  }

  // Trim enclosing quotes
  cleanText = cleanText.replace(/^["']|["']$/g, '').trim();

  // 3. Near-duplicate check with the previous sentence
  let isDuplicate = false;
  if (previousSentenceText) {
    const normalize = (t: string) => {
      return t
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // strip punctuation
        .replace(/\s+/g, "") // strip whitespace
        .trim();
    };

    const normClean = normalize(cleanText);
    const normPrev = normalize(previousSentenceText);

    // If exact match after normalization, or if one completely contains the other
    if (normClean === normPrev || normClean.includes(normPrev) || normPrev.includes(normClean)) {
      isDuplicate = true;
    } else {
      // Word overlap comparison to detect slightly tweaked copies
      const wordsClean = cleanText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);
      const wordsPrev = previousSentenceText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);
      
      if (wordsClean.length > 0 && wordsPrev.length > 0) {
        const setClean = new Set(wordsClean);
        const overlap = wordsPrev.filter(w => setClean.has(w)).length;
        const ratio = overlap / Math.max(wordsClean.length, wordsPrev.length);
        
        // If overlap ratio > 0.65 (65% identical words), flag as duplicate
        if (ratio > 0.65) {
          isDuplicate = true;
        }
      }
    }
  }

  return { cleanText, isDuplicate };
}

/**
 * Extracts a focus phrase from the previous story text or attention locks safely client-side.
 */
export function extractFocusPhrase(
  storyText: string,
  locks: string[],
  language: 'fr' | 'en' = 'fr'
): string {
  if (locks.length > 0) {
    return locks[Math.floor(Math.random() * locks.length)];
  }

  const sentences = storyText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1];
    const words = lastSentence.split(/\s+/).filter(Boolean);
    if (words.length > 4) {
      const startIdx = Math.floor(Math.random() * (words.length - 3));
      return words.slice(startIdx, startIdx + 3).join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    }
    return lastSentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  }

  return language === 'fr' ? "vaisseau dérive" : "lone vessel";
}

export function getCannedSentence(
  stageIndex: number,
  knobs: Knobs,
  locks: string[],
  premise: string,
  existingSentences: string[],
  language: 'fr' | 'en' = 'fr'
): { text: string; focusPhrase: string } {
  const tone = knobs.tone >= 0.5 ? 'light' : 'dark';
  const tension = knobs.tension >= 0.5 ? 'intense' : 'calm';
  const distance = knobs.distance >= 0.5 ? 'far' : 'close';
  const key = `${tone}_${tension}_${distance}` as keyof typeof NARRATIVE_STAGES_EN[0];

  const stages = language === 'fr' ? NARRATIVE_STAGES_FR : NARRATIVE_STAGES_EN;
  const generics = language === 'fr' ? GENERIC_TEMPLATES_FR : GENERIC_TEMPLATES_EN;

  let rawText = '';
  if (stageIndex < stages.length) {
    rawText = stages[stageIndex][key];
  } else {
    rawText = generics[key];
  }

  let weavedText = rawText;

  if (locks.length > 0) {
    const lock = locks[Math.floor(Math.random() * locks.length)];

    const replacements = language === 'fr' ? [
      { pattern: /la porte en ruine/gi, repl: `la structure de ${lock}` },
      { pattern: /la porte morte/gi, repl: `${lock}` },
      { pattern: /l'ancienne structure/gi, repl: `${lock}` },
      { pattern: /le cœur de la porte/gi, repl: `le cœur de ${lock}` },
      { pattern: /la station morte/gi, repl: `${lock} silencieux` },
      { pattern: /la porte brillante/gi, repl: `${lock} étincelant` },
      { pattern: /la porte/gi, repl: `${lock}` },
      { pattern: /le vide/gi, repl: `l'espace autour de ${lock}` },
      { pattern: /la console/gi, repl: `la console mesurant ${lock}` },
      { pattern: /les étoiles/gi, repl: `la poussière de ${lock}` },
    ] : [
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

    if (!replaced) {
      if (tone === 'light') {
        weavedText += language === 'fr' 
          ? ` Guidé par la résonance de la structure : ${lock}, je me sentais rassuré.`
          : ` Guided by the resonance of the ${lock}, I felt secure.`;
      } else {
        weavedText += language === 'fr'
          ? ` Pendant ce temps, la présence fantomatique de : ${lock} continuait de poser question.`
          : ` Meanwhile, the ghostly presence of the ${lock} continued to loom.`;
      }
    }
  }

  // Focus phrase selection
  let focusPhrase = '';
  if (existingSentences.length > 0) {
    const prevText = existingSentences[existingSentences.length - 1];
    const words = prevText.split(' ');
    if (words.length > 4) {
      const startIdx = Math.floor(Math.random() * (words.length - 3));
      focusPhrase = words.slice(startIdx, startIdx + 3).join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    } else {
      focusPhrase = words.join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    }
  } else {
    const words = premise.split(' ');
    if (words.length > 4) {
      const startIdx = Math.floor(Math.random() * (words.length - 3));
      focusPhrase = words.slice(startIdx, startIdx + 3).join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    } else {
      focusPhrase = language === 'fr' ? "ombre silencieuse" : "silent shadow";
    }
  }

  return { text: weavedText, focusPhrase };
}

export async function streamLLMGeneration(
  config: LLMConfig,
  storyText: string,
  knobs: Knobs,
  locks: string[],
  onChunk: (text: string, focusPhrase?: string) => void,
  signal: AbortSignal,
  language: 'fr' | 'en' = 'fr'
): Promise<{ text: string; focusPhrase?: string }> {
  // Pre-calculate focus phrase client-side to prevent any leaked labels from LLM formatting
  const focusPhrase = extractFocusPhrase(storyText, locks, language);
  
  // Extract last sentence text for duplicate checks
  const storySentences = storyText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const lastSentenceText = storySentences[storySentences.length - 1] || '';

  if (config.provider === 'demo') {
    const sentencesCount = Math.max(0, storySentences.length - 1);
    const premise = storySentences[0] || (language === 'fr' ? "Un vaisseau dérive." : "A lone vessel drifts.");
    const existing = storySentences.slice(1);

    const canned = getCannedSentence(sentencesCount, knobs, locks, premise, existing, language);
    
    // Check duplicates even on demo mode just in case
    const cannedSanitized = sanitizeSentence(canned.text, lastSentenceText);
    if (cannedSanitized.isDuplicate) {
      throw new Error(
        language === 'fr'
          ? "La phrase générée est trop similaire à la précédente (détection de doublon)."
          : "The generated sentence is a duplicate or too similar to the previous one."
      );
    }

    const words = canned.text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      currentText += (i === 0 ? '' : ' ') + words[i];
      onChunk(currentText, focusPhrase);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 50 + Math.random() * 30);
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
  let model = config.model || '';

  if (config.provider === 'openai') {
    baseUrl = baseUrl || 'https://api.openai.com/v1';
    model = model || 'gpt-4o-mini';
  } else if (config.provider === 'groq') {
    baseUrl = baseUrl || 'https://api.groq.com/openai/v1';
    model = model || 'openai/gpt-oss-20b';
  } else if (config.provider === 'cerebras') {
    baseUrl = baseUrl || 'https://api.cerebras.ai/v1';
    model = model || 'llama3.1-8b';
  } else if (config.provider === 'gemini') {
    baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai';
    model = model || 'gemini-1.5-flash';
  }

  if (!apiKey) {
    throw new Error(
      language === 'fr'
        ? "La clé d'API est requise pour le streaming LLM."
        : "API key is required for real LLM streaming"
    );
  }

  const toneText = knobs.tone < 0.35 
    ? (language === 'fr' ? "sombre, menaçant, mystérieux, froid" : "ominous, dark, mysterious, cold") 
    : knobs.tone > 0.65 
      ? (language === 'fr' ? "merveilleux, plein d'espoir, magnifique, inspirant l'émerveillement" : "hopeful, beautiful, warm, awe-inspiring") 
      : (language === 'fr' ? "équilibré, neutre" : "balanced, neutral");

  const tensionText = knobs.tension < 0.35 
    ? (language === 'fr' ? "calme, détendu, rythme lent, tranquille" : "calm, relaxed, slow-paced, tranquil") 
    : knobs.tension > 0.65 
      ? (language === 'fr' ? "à suspense, enjeux élevés, urgent, dangereux" : "suspenseful, high-stakes, urgent, dangerous") 
      : (language === 'fr' ? "stable, délibéré" : "steady, deliberate");

  const distanceText = knobs.distance < 0.35 
    ? (language === 'fr' ? "très proche, intime, pensées à la première personne et détails émotionnels/sensoriels profonds (utiliser 'je' ou un style hautement intime)" : "very close, intimate, first-person thoughts and deep emotional/sensory details (use 'I' or highly intimate language)") 
    : knobs.distance > 0.65 
      ? (language === 'fr' ? "distant, cinématographique, objectif à la troisième personne, décrivant de grands événements de loin" : "distant, cinematic, third-person objective, describing grand events from afar") 
      : (language === 'fr' ? "narrateur à mi-distance" : "middle-distance narrating");

  const attentionLockPrompt = locks.length > 0
    ? (language === 'fr' 
        ? `CONTRAINTES IMPORTANTES : Vous devez intégrer ou vous appuyer directement sur ces expressions exactes : ${locks.map(l => `"${l}"`).join(', ')}. Gardez-les centrales dans la phrase.`
        : `IMPORTANT CONSTRAINTS: You must weave in or build directly upon these exact phrase(s): ${locks.map(l => `"${l}"`).join(', ')}. Keep them central to the sentence.`)
    : '';

  // Focus phrase format instruction completely removed here so the model NEVER echoes "Focus:" prefixes!
  const systemPrompt = language === 'fr'
    ? `Vous êtes un générateur de récits de science-fiction rapide et collaboratif en temps réel.
Votre tâche consiste à générer exactement UNE seule phrase de continuation percutante pour l'histoire fournie par l'utilisateur.
Vous devez absolument écrire la phrase en français. Toute la prose doit être magnifiquement rédigée en français.
Vous devez orienter le style, le ton et le rythme de cette phrase en fonction de ces valeurs de cadrans :
- Tonalité (Sombre à Merveilleux) : ${knobs.tone.toFixed(2)} (Style à utiliser : ${toneText})
- Tension (Calme à Intense) : ${knobs.tension.toFixed(2)} (Style à utiliser : ${tensionText})
- Distance Narrative (Intime à Cinématographique) : ${knobs.distance.toFixed(2)} (Style à utiliser : ${distanceText})

${attentionLockPrompt}

Écrivez UNIQUEMENT la phrase suivante de l'histoire. Ne commencez pas par des labels comme "Focus:" ou "Sentence:". Ne mettez pas de mise en forme markdown. Soyez extrêmement créatif et correspondez précisément aux valeurs de style demandées.`
    : `You are a fast, collaborative real-time sci-fi story generator.
Your job is to generate exactly ONE single, punchy continuation sentence for the story provided by the user.
You must generate the sentence in English. All prose must be beautifully written in English.
You MUST steer the style, tone, and pacing of this sentence based on these round knob steering values:
- Tone (Dark to Light): ${knobs.tone.toFixed(2)} (Use style: ${toneText})
- Tension (Calm to Intense): ${knobs.tension.toFixed(2)} (Use style: ${tensionText})
- Narrative Distance (Close to Far): ${knobs.distance.toFixed(2)} (Use style: ${distanceText})

${attentionLockPrompt}

Write ONLY the next continuation sentence of the story. Do not prefix your output with labels like "Focus:" or "Sentence:". Do not include markdown formatting. Be extremely creative and match the requested style values precisely.`;

  const userPrompt = language === 'fr'
    ? `Voici l'histoire jusqu'à présent :\n${storyText}\n\nÉcrivez la phrase suivante en suivant les consignes des cadrans.`
    : `Here is the story so far:\n${storyText}\n\nWrite the next sentence following the steer values.`;

  const requestBody: Record<string, any> = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    stream: true,
    temperature: 0.85,
    max_tokens: 400,
    max_completion_tokens: 400
  };

  if (config.provider === 'groq' && model.includes('gpt-oss')) {
    requestBody.reasoning_effort = 'low';
    requestBody.include_reasoning = false;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = '';
    try {
      const parsedJson = JSON.parse(errorText);
      parsedMessage = parsedJson.error?.message || parsedJson.message || '';
    } catch (_) {}

    const detailText = parsedMessage || errorText;
    
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after');
      let delaySeconds = 3; // default
      
      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader);
        if (!isNaN(parsed)) delaySeconds = parsed;
      } else {
        const secondsMatch = detailText.match(/try again in\s+([\d.]+)\s*s/i) || 
                             detailText.match(/in\s+([\d.]+)\s*seconds/i) ||
                             detailText.match(/after\s+([\d.]+)\s*s/i);
        if (secondsMatch) {
          const parsed = parseFloat(secondsMatch[1]);
          if (!isNaN(parsed)) delaySeconds = Math.ceil(parsed);
        }
      }

      const err = new Error(`RateLimitError:${delaySeconds}`);
      err.name = 'RateLimitError';
      throw err;
    }

    if (response.status === 400 && (
      detailText.toLowerCase().includes('model_decommissioned') || 
      detailText.toLowerCase().includes('not found') || 
      detailText.toLowerCase().includes('unknown model') || 
      detailText.toLowerCase().includes('deprecated') || 
      detailText.toLowerCase().includes('decommissioned') ||
      detailText.toLowerCase().includes('model_not_found')
    )) {
      throw new Error(
        language === 'fr'
          ? `Erreur de Modèle (400) : Le modèle "${model}" est désactivé, obsolète ou non supporté par ${config.provider.toUpperCase()}. Veuillez en changer dans les paramètres (ex. utilisez "openai/gpt-oss-20b" pour Groq). Détails : ${detailText}`
          : `Model Error (400): The model "${model}" is decommissioned, deprecated, or not supported by ${config.provider.toUpperCase()}. Please check or change the model name in Settings (e.g. use "openai/gpt-oss-20b" for Groq). Details: ${detailText}`
      );
    }
    
    if (response.status === 401) {
      throw new Error(
        language === 'fr'
          ? `Erreur d'Authentification (401) : La clé d'API fournie est invalide pour ${config.provider.toUpperCase()}. Veuillez la corriger.`
          : `Authentication Error (401): The API Key provided is invalid or has expired for ${config.provider.toUpperCase()}. Please check your key in the settings panel.`
      );
    }

    if (response.status === 404) {
      throw new Error(
        language === 'fr'
          ? `Erreur de Point d'Accès (404) : Le modèle "${model}" ou le point de terminaison est introuvable. Veuillez vérifier vos paramètres.`
          : `Endpoint Error (404): The model "${model}" or endpoint was not found. Please double-check your Custom Base URL and model ID. Details: ${detailText}`
      );
    }

    throw new Error(`API Error (${response.status}): ${detailText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error(language === 'fr' ? "Le flux de réponse est illisible." : 'Response body is not readable');
  }

  const decoder = new TextDecoder('utf-8');
  let fullStreamText = '';

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

          // Dynamically sanitize text in real-time to strip comments, quotes, and labels
          const sanitized = sanitizeSentence(fullStreamText);

          // Client-side sentence boundary check
          if (sanitized.cleanText.length > 5) {
            const boundaryMatch = sanitized.cleanText.match(/([.!?])\s+/);
            if (boundaryMatch && boundaryMatch.index !== undefined) {
              const truncateIndex = boundaryMatch.index + 1;
              const finalSentence = sanitized.cleanText.slice(0, truncateIndex).trim();

              onChunk(finalSentence, focusPhrase);
              await reader.cancel();

              // Run duplicate check on finalized sentence
              const finalSanitized = sanitizeSentence(finalSentence, lastSentenceText);
              if (finalSanitized.isDuplicate) {
                throw new Error(
                  language === 'fr'
                    ? "La phrase générée est trop similaire à la précédente (détection de doublon)."
                    : "The generated sentence is a duplicate or too similar to the previous one."
                );
              }

              return { text: finalSentence, focusPhrase };
            }
          }

          onChunk(sanitized.cleanText, focusPhrase);
        } catch (e: any) {
          if (e.message.includes("doublon") || e.message.includes("duplicate")) {
            throw e;
          }
          // Ignore other partial parsing errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // End of stream cleanup and duplicate verification
  const finalSanitized = sanitizeSentence(fullStreamText, lastSentenceText);
  if (finalSanitized.isDuplicate) {
    throw new Error(
      language === 'fr'
        ? "La phrase générée est trop similaire à la précédente (détection de doublon)."
        : "The generated sentence is a duplicate or too similar to the previous one."
    );
  }

  return { text: finalSanitized.cleanText, focusPhrase };
}
