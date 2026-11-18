# Spaceship Steering Lab 🚀

An interactive, real-time creative story steering laboratory. As the LLM streams a cosmic science-fiction narrative sentence by sentence, you can turn analog cockpit dials to alter the story's tone, tension, and narrative distance on the fly, lock model attention onto highlighted phrases, and scrub back the timeline to fork alternative future branches.

This project is a high-fidelity, standalone React & TypeScript re-implementation of the brilliant concept introduced by **[Spaceship IDE](https://github.com/chuanqisun/spaceship)** (Chuanqi Sun, MIT Media Lab). You can view the original live simulator [here](https://chuanqisun.github.io/spaceship/).

---

## Key Features

1. **Continuous Narrative Streaming:** Engage the writing generator to continuously stream a space exploration narrative. Supports live SSE chunk-by-chunk typing.
2. **Steering Control Deck (Round Dials):** 
   - **Tone (Ominous ↔ Wondrous):** Shifts the story style between dark, threatening, and cold prose versus awe-inspiring, hopeful, and bright prose.
   - **Tension (Calm ↔ Intense):** Steers pacing from serene, slow-paced exploration logs to urgent, frantic, high-stakes danger.
   - **Narrative Distance (Intimate ↔ Cinematic):** Squeezes focus down to intimate first-person sensory thoughts ("I") or pulls back to distant cinematic third-person objective narration.
3. **Attention Locks (Interactive Highlight):** Click and drag over any portion of the premise or story, and click the floating **"Lock Attention"** button to pin that phrase. The generator will prioritize weaving these pinned phrases into its next sentences.
4. **Interactive Timeline Scrubber:** Segmented tracks represent the history of generated sentences. Drag the timeline slider or click any segment to scrub backwards, pruning the path and preparing the engine to forge an alternative future.
5. **Parallel Futures Branching:** When you scrub back and generate a new path, the previous future path is automatically captured as a branch and saved in the history column. Easily jump between parallel futures with a single click.
6. **Self-Reported Focus Traces:** Hover over any sentence to view a floating focus trace showing the exact phrase in the preceding text the model self-reported it relied on most, with matching text glowing softly.
7. **Zero-Key Demo Mode:** Runs fully in the browser with highly responsive, procedural canned starlit logs, enabling instant manual testing and demonstration without any API credential.
8. **Multi-Provider Direct Client Streaming:** Plug in your own API key to stream directly to Cerebras (fastest open-weights), Groq (low-latency), OpenAI, or Gemini.

---

## Technical Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh/) (configured with standard minimum release age caching)
- **Framework:** React 19 + TypeScript 7
- **Bundler:** Vite 8
- **Icons:** Lucide React
- **Styling:** Custom fluid futuristic dark-mode theme stylesheet (`index.css`)
- **Testing:** Built-in Bun Test framework for generation state-machine validation

---

## Getting Started

### Local Development

1. Navigate to this directory:
   ```bash
   cd apps/spaceship-steering-lab
   ```

2. Install the dependencies:
   ```bash
   bun install
   ```

3. Start the dev server:
   ```bash
   bun run dev
   ```

4. Open your browser to the local URL displayed (typically `http://localhost:5173`).

---

## Running Tests

Run the automated suite to verify the core steering state-machine transitions, including branch fusions, attention lock updates, and timeline scrubbing behavior:

```bash
bun test
```

---

## Credits & License

- **Concept & Inspiration:** [Spaceship IDE](https://github.com/chuanqisun/spaceship) developed by **Chuanqi Sun** at the MIT Media Lab.
- **License:** MIT License. Built with ❤️ for the Tech Demos Monorepo.
