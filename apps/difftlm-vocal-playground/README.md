# Tube vocal — terrain de jeu

Terrain de jeu en une page : on façonne un tube acoustique (aires des sections, longueur, hauteur de la source), on entend la voyelle, et on lit les formants.

Recréation pédagogique de l'idée de tube derrière diffTLM (Chen, Lee & Sitzmann, NeurIPS 2026). Ce n'est pas le simulateur des auteurs.

- Démo officielle : https://echen01.github.io/vocal-tract/
- Annonce : https://x.com/vincesitzmann/status/2118057889432514691

```bash
bun install
bun run dev
```

`bun run check` affiche F1–F3 des cinq voyelles de départ.
