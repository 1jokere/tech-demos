// Formes de tube approximatives pour cinq voyelles, inspirées des fonctions
// d'aire classiques (Fant 1960 / Story), réduites à 8 sections.
// Index 0 = glotte, index 7 = lèvres. Aires en cm².

import type { TubeParams } from "./tube";

export interface VowelPreset extends TubeParams {
  id: string;
  /** Symbole API affiché, p. ex. « /a/ ». */
  label: string;
  /** Exemple français. */
  hint: string;
}

export const PRESETS: VowelPreset[] = [
  {
    id: "a",
    label: "/a/",
    hint: "comme « patte »",
    areas: [1.2, 0.5, 0.4, 0.6, 1.8, 4.0, 7.5, 7.0],
    lengthCm: 16.5,
  },
  {
    id: "e",
    label: "/e/",
    hint: "comme « été »",
    areas: [2.5, 4.0, 4.5, 3.0, 1.5, 0.9, 1.5, 2.5],
    lengthCm: 16.5,
  },
  {
    id: "i",
    label: "/i/",
    hint: "comme « si »",
    areas: [3.0, 5.5, 7.0, 5.0, 1.2, 0.4, 0.5, 1.8],
    lengthCm: 16.5,
  },
  {
    id: "o",
    label: "/o/",
    hint: "comme « eau »",
    areas: [1.8, 3.0, 4.5, 1.4, 1.3, 4.5, 4.0, 0.7],
    lengthCm: 17.5,
  },
  {
    id: "u",
    label: "/u/",
    hint: "comme « où »",
    areas: [2.5, 4.5, 7.0, 2.5, 0.6, 3.0, 4.0, 0.3],
    lengthCm: 18.0,
  },
];

export const DEFAULT_PRESET = PRESETS[0];
