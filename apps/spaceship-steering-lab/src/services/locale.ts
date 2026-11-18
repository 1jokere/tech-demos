export type Language = 'fr' | 'en';

export interface LocaleStrings {
  kicker: string;
  title: string;
  subtitle: string;
  storyEditor: string;
  storyEditorSub: string;
  steeringPanel: string;
  steeringPanelSub: string;
  timelinePanel: string;
  timelinePanelSub: string;
  timelineEmpty: string;
  activeTimeline: string;
  resetPremise: string;
  ticksPremise: string;
  parallelFutures: string;
  parallelFuturesEmpty: string;
  attentionLocks: string;
  attentionLocksEmpty: string;
  lockAttentionBtn: string;
  engineStatus: string;
  engineIdle: string;
  engineGenerating: string;
  enginePaused: string;
  engageBtn: string;
  pauseBtn: string;
  apiSettings: string;
  apiSettingsSub: string;
  provider: string;
  apiKey: string;
  localStorageOnly: string;
  model: string;
  customBaseUrl: string;
  demoActive: string;
  thinking: string;
  jumpBtn: string;
  knobTone: string;
  knobToneMin: string;
  knobToneMax: string;
  knobTension: string;
  knobTensionMin: string;
  knobTensionMax: string;
  knobDistance: string;
  knobDistanceMin: string;
  knobDistanceMax: string;
  premiseDefault: string;
  creditOriginal: string;
  
  // New keys for editor
  initialPremise: string;
  steeredWith: string;
  steeringFuture: string;
  regenerateButton: string;
}

export const LOCALES: Record<Language, LocaleStrings> = {
  fr: {
    kicker: "Laboratoire d'Écriture Collaborative en Temps Réel",
    title: "Vaisseau de Guidage",
    subtitle: "Un éditeur de récit interactif en temps réel. Ajustez les molettes analogiques pour guider le style, le rythme et la distance narrative à la volée, ou surbrillez des phrases pour fixer l'attention du modèle.",
    storyEditor: "Éditeur d'Histoire",
    storyEditorSub: "Le modèle écrit en continu. Sélectionnez du texte pour verrouiller l'attention, ou survolez les phrases générées pour tracer sa focalisation.",
    steeringPanel: "Tableau de Bord du Vaisseau",
    steeringPanelSub: "Tournez les cadrans analogiques pour guider le récit. Les modifications annulent et régénèrent les phrases futures spéculatives.",
    timelinePanel: "Chronologie & Ramifications",
    timelinePanelSub: "Revenez en arrière pour élaguer l'histoire et forger un futur alternatif, ou basculez d'une ligne temporelle à l'autre.",
    timelineEmpty: "Commencez à générer l'histoire pour remplir la chronologie.",
    activeTimeline: "Chronologie Active",
    resetPremise: "Réinitialiser au Prémisse",
    ticksPremise: "Départ",
    parallelFutures: "Futurs Parallèles",
    parallelFuturesEmpty: "Aucun futur alternatif pour l'instant. Reculez dans le temps et régénérez pour créer des options.",
    attentionLocks: "Attention Verrouillée",
    attentionLocksEmpty: "Surlignez du texte ci-dessus pour verrouiller l'attention du modèle sur une expression.",
    lockAttentionBtn: "Verrouiller l'Attention sur",
    engineStatus: "Statut du Moteur",
    engineIdle: "inactif",
    engineGenerating: "génération en cours",
    enginePaused: "en pause",
    engageBtn: "Activer le Générateur",
    pauseBtn: "Mettre en Pause",
    apiSettings: "Paramètres de l'API",
    apiSettingsSub: "Choisissez le mode démo local (sans clé) ou connectez vos clés d'API directement.",
    provider: "Fournisseur",
    apiKey: "Clé d'API",
    localStorageOnly: "sauvegardée en local uniquement",
    model: "Modèle",
    customBaseUrl: "URL de Base Personnalisée (Optionnel)",
    demoActive: "Mode démo actif : Exécution locale avec des journaux de bord procéduraux en français. Tournez les cadrans pour voir l'histoire s'adapter !",
    thinking: "Réflexion",
    jumpBtn: "Sauter",
    knobTone: "Tonalité",
    knobToneMin: "Sombre",
    knobToneMax: "Merveilleux",
    knobTension: "Tension",
    knobTensionMin: "Calme",
    knobTensionMax: "Intense",
    knobDistance: "Distance",
    knobDistanceMin: "Intime",
    knobDistanceMax: "Cinéma",
    premiseDefault: "Un vaisseau d'exploration solitaire dérive dans l'ombre silencieuse d'une gigantesque porte stellaire éteinte.",
    creditOriginal: "Réimplémenté sous licence MIT, inspiré par le magnifique projet original Spaceship IDE développé par Chuanqi Sun au MIT Media Lab.",
    
    initialPremise: "Prémisse Initial",
    steeredWith: "Guidé avec",
    steeringFuture: "Guidage du futur",
    regenerateButton: "Régénérer la phrase active"
  },
  en: {
    kicker: "Creative Co-Writing Laboratory",
    title: "Spaceship Steering Lab",
    subtitle: "An interactive, real-time story steering editor. Adjust the analog dials to change tone, tension, and scale on the fly, or highlight phrases to lock model attention.",
    storyEditor: "Story Editor",
    storyEditorSub: "The LLM writes continuously. Select any text to lock attention on a phrase, or hover over generated sentences to trace focus.",
    steeringPanel: "Steering Control Deck",
    steeringPanelSub: "Turn the analog dials to steer the narrative direction. Real-time updates cancel and regenerate speculative future sentences.",
    timelinePanel: "Timeline & Branching",
    timelinePanelSub: "Scrub back to prune the timeline and forge an alternative future, or switch branches.",
    timelineEmpty: "Start generating the story to populate the timeline.",
    activeTimeline: "Active Timeline",
    resetPremise: "Reset to Premise",
    ticksPremise: "Premise",
    parallelFutures: "Parallel Futures",
    parallelFuturesEmpty: "No alternative branches yet. Scrub back and regenerate to spawn options.",
    attentionLocks: "Attention Locks",
    attentionLocksEmpty: "Highlight any phrase in the text to lock the model's attention.",
    lockAttentionBtn: "Lock Attention on",
    engineStatus: "Engine Status",
    engineIdle: "idle",
    engineGenerating: "generating",
    enginePaused: "paused",
    engageBtn: "Engage Generator",
    pauseBtn: "Pause Engine",
    apiSettings: "API Engine Settings",
    apiSettingsSub: "Choose between local Demo Mode (no key needed) or direct streaming to cloud providers.",
    provider: "Provider",
    apiKey: "API Key",
    localStorageOnly: "localStorage only",
    model: "Model",
    customBaseUrl: "Custom Base URL (Optional)",
    demoActive: "Demo Mode Active: Runs fully in-browser with highly responsive, procedural starlit space logs. Adjust dials to see the story react!",
    thinking: "Thinking",
    jumpBtn: "Jump",
    knobTone: "Tone",
    knobToneMin: "Ominous",
    knobToneMax: "Wondrous",
    knobTension: "Tension",
    knobTensionMin: "Calme",
    knobTensionMax: "Intense",
    knobDistance: "Distance",
    knobDistanceMin: "Intimate",
    knobDistanceMax: "Cinematic",
    premiseDefault: "A lone exploration vessel drifts in the silent shadow of a massive, dead stellar gate.",
    creditOriginal: "Re-implemented under MIT, inspired by the gorgeous Spaceship IDE project developed by Chuanqi Sun at the MIT Media Lab.",
    
    initialPremise: "Initial Premise",
    steeredWith: "Steered with",
    steeringFuture: "Steering future",
    regenerateButton: "Regenerate active sentence"
  }
};
