# LUMINA // THE PLASMA BRIDGE
### PREMIUM OPTICAL PUZZLE EXPERIENCE

[![License: MIT](https://img.shields.io/badge/License-MIT-00f2ff.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live_Deployment-Access_Interface-00f2ff.svg)](https://mbleftley.github.io/LuminaMirrors/)
[![Game Status](https://img.shields.io/badge/Game_Status-Operational-00f2ff.svg)](#)

**LUMINA** is a high-fidelity, tactical optics simulator that challenges your spatial reasoning as you guide a high-energy plasma bridge through a network of volatile mirrors.

---

## 🕹️ GAME MODES

### [ 🏹 ] NEURAL DECODE
The primary tactical loop. Guide the plasma flow from the source to the Core to initiate a data sync.
*   **Mechanics:** Rotate and drag mirrors to bend the light path. Avoid the volatile **BOMBS** and **VOIDS** that disrupt the signal integrity.
*   **Goal:** Maintain a stable connection until the **SYNC QUALITY** reaches 100%.

### [ 📊 ] EFFICIENCY MODE (MULTIPLIER)
A high-stakes scoring system that rewards complex network architecture.
*   **Mechanics:** Every mirror successfully integrated into the bridge adds to your **Mirror Multiplier**. 
*   **Reward Logic:** Scoring is calculated by `(Base + Time) * (Mirrors_Used)`. The more complex your bridge, the higher your Total Sync score.
*   **Objective:** Find the most intricate path possible while the **Signal Decay** timer counts down.

---

## 🖥️ ENGINE & FEATURES

*   **Plasma Bridge Physics:** A custom vector-based raycasting engine that calculates light reflections in real-time at 60fps.
*   **Sync Stability System:** A non-binary progress mechanic that tracks the reliability of your light bridge. The connection must be held steady to successfully "Decode" the level.
*   **Procedural Audio Resonance:** A multi-voice **Tone.js PolySynth** soundscape that triggers micro-pings and harmonic sweeps as you interact with the optical network.
*   **Liquid Core Saturation:** Dynamic visual feedback at the destination Core that "fills" with energy as your sync progress increases.

---

## 🛠️ TECHNICAL SPECIFICATIONS

| Component | Specification |
| :--- | :--- |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Graphics** | HTML5 Canvas API |
| **Animation** | Anime.js (UI & Resonance) |
| **Audio** | Tone.js (PolySynth & FM Synthesis) |
| **Styling** | Modern CSS (Glassmorphism & Neon) |
| **Scoring** | LocalStorage Persistence |

---

## 🚀 GETTING STARTED

LUMINA is a pure web experience and requires no build steps. Clone and launch directly in your browser.

```bash
# Clone the repository
git clone https://github.com/mbleftley/LuminaMirrors.git

# Enter the directory
cd LuminaMirrors

# Play the game
open index.html

---

## 🎖️ MISSION CREDITS
**SYSTEM ARCHITECT:** [MBLXPERIMENT](https://x.com/MBLExperiment)  
**TACTICAL ASSISTANT:** Developed with the support of [Google Anti-Gravity](https://antigravity.google/).
