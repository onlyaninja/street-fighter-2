# Street Fighter II: Tournament Edition 🥋

An authentic, responsive 2D arcade fighting game clone inspired by **Street Fighter II**, engineered from the ground up for **two players to battle side-by-side on a single full-size keyboard**.

Built with modern HTML5 Canvas, 60 FPS fixed-step physics, and the Web Audio API with **zero external dependencies**.

---

## 🎮 Play Online Directly

👉 **[Play Street Fighter II Online](https://onlyaninja.github.io/street-fighter-2/)** 👈

*No downloads, no installations, no third-party assets—runs directly in any modern desktop web browser!*

---

## 🚀 Quick Start

Run either of the following commands from the project directory:

```bash
# Option 1: Python HTTP server
python3 -m http.server 3000

# Option 2: npm start
npm start
```

Then visit **[http://localhost:3000](http://localhost:3000)**.

*(You can also double-click `index.html` to play directly as a local file in any modern browser!)*

---

## ⌨️ Single Full-Size Keyboard Layout

The controls are separated across the keyboard to prevent key jamming / ghosting and give both players comfortable ergonomics.

| Action | **Player 1 (Left Side)** | **Player 2 (Right Side / Numpad)** | **Player 2 (No Numpad / Laptop)** |
| :--- | :--- | :--- | :--- |
| **Jump** | <kbd>W</kbd> | <kbd>↑</kbd> | <kbd>↑</kbd> |
| **Crouch / Low Guard** | <kbd>S</kbd> | <kbd>↓</kbd> | <kbd>↓</kbd> |
| **Walk Left / Guard** | <kbd>A</kbd> | <kbd>←</kbd> | <kbd>←</kbd> |
| **Walk Right / Forward** | <kbd>D</kbd> | <kbd>→</kbd> | <kbd>→</kbd> |
| **Light Punch (LP)** | <kbd>F</kbd> | <kbd>Numpad 4</kbd> | <kbd>I</kbd> |
| **Heavy Punch (HP)** | <kbd>G</kbd> | <kbd>Numpad 5</kbd> | <kbd>O</kbd> |
| **Light Kick (LK)** | <kbd>V</kbd> | <kbd>Numpad 1</kbd> | <kbd>K</kbd> |
| **Heavy Kick (HK)** | <kbd>B</kbd> | <kbd>Numpad 2</kbd> | <kbd>L</kbd> |
| **Special 1 (Shortcut)**| <kbd>T</kbd> | <kbd>Numpad 6</kbd> | <kbd>P</kbd> |
| **Special 2 (Shortcut)**| <kbd>Y</kbd> | <kbd>Numpad 3</kbd> | <kbd>[</kbd> |
| **Special 3 (Shortcut)**| <kbd>U</kbd> | <kbd>Num 0</kbd> | <kbd>]</kbd> |

> **Note:** Both Player 2 layouts (Numpad and Arrow+Letter keys) are active simultaneously.

---

## ⚙️ Special Move Mode Toggles (Easy vs Classic Arcade)

Both Player 1 and Player 2 have **independent toggles**:

- **🟢 EASY MODE**: Single-key shortcuts (<kbd>T/Y/U</kbd> or <kbd>Num 6/3/0</kbd>) fire specials immediately. Motion inputs also work.
- **🟡 CLASSIC ARCADE MODE**: Single-key shortcuts are disabled. Special moves strictly require authentic directional motions with timing requirements.

**How to Toggle:**
- Click the **[P1: 🟢 EASY]** or **[P2: 🟢 EASY]** buttons on the marquee header.
- Or use hotkeys: <kbd>F1</kbd> to toggle P1 mode, <kbd>F2</kbd> to toggle P2 mode!

---

## 🥋 Playable Characters & Movesets (Complete 9-Fighter Roster)

All 8 iconic World Warriors plus boss M. Bison are playable! In Classic Mode, each player uses their own physical keyboard keys:

### 1. RYU & KEN (Shotokan Masters)
- **Hadouken (Fireball):** P1: <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Shoryuken (Dragon Punch):** P1: <kbd>D</kbd>, <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: <kbd>←</kbd>, <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>
- **Tatsumaki (Hurricane Kick):** P1: <kbd>S</kbd>, <kbd>A</kbd> + <kbd>V</kbd> | P2: <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 1</kbd> | *Shortcut:* <kbd>H</kbd> / <kbd>Num 0</kbd>

### 2. E. HONDA (Sumo Powerhouse of Japan)
- **Hundred Hand Slap:** P1: Tap <kbd>F</kbd> rapidly | P2: Tap <kbd>Num 4</kbd> rapidly | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Super Sumo Headbutt:** P1: Hold <kbd>A</kbd> (0.5s) → <kbd>D</kbd> + <kbd>F</kbd> | P2: Hold <kbd>→</kbd> (0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>

### 3. BLANKA (Wild Beast of Brazil)
- **Electric Thunder:** P1: Tap <kbd>F</kbd> rapidly | P2: Tap <kbd>Num 4</kbd> rapidly | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Rolling Attack (Beast Cannonball):** P1: Hold <kbd>A</kbd> (0.5s) → <kbd>D</kbd> + <kbd>F</kbd> | P2: Hold <kbd>→</kbd> (0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>

### 4. GUILE (Military Zoning Master)
- **Sonic Boom:** P1: Hold <kbd>A</kbd> (0.5s) → <kbd>D</kbd> + <kbd>F</kbd> | P2: Hold <kbd>→</kbd> (0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Flash Kick (Somersault):** P1: Hold <kbd>S</kbd> (0.5s) → <kbd>W</kbd> + <kbd>V</kbd> | P2: Hold <kbd>↓</kbd> (0.5s) → <kbd>↑</kbd> + <kbd>Num 1</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>

### 5. CHUN-LI (First Lady of Fighting)
- **Hyakuretsu Kyaku (Lightning Legs):** P1: Tap <kbd>V</kbd> rapidly | P2: Tap <kbd>Num 1</kbd> rapidly | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Kikoken (Chi Palm Blast):** P1: <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>
- **Spinning Bird Kick:** P1: <kbd>S</kbd>, <kbd>A</kbd> + <kbd>V</kbd> | P2: <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 1</kbd> | *Shortcut:* <kbd>H</kbd> / <kbd>Num 0</kbd>

### 6. ZANGIEF (The Red Cyclone of Russia)
- **Double Lariat:** P1: <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Spinning Piledriver (SPD):** P1: Close + <kbd>D</kbd>, <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: Close + <kbd>←</kbd>, <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>

### 7. DHALSIM (Mystical Yogi of India)
- **Yoga Fire:** P1: <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> | P2: <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Yoga Flame:** P1: <kbd>S</kbd>, <kbd>A</kbd> + <kbd>F</kbd> | P2: <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>
- **Stretchy Limbs:** Normal punches & kicks reach 3x across the arena!

### 8. M. BISON (Dictator & Final Boss)
- **Psycho Crusher (Torpedo):** P1: Hold <kbd>A</kbd> (0.5s) → <kbd>D</kbd> + <kbd>F</kbd> | P2: Hold <kbd>→</kbd> (0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> | *Shortcut:* <kbd>T</kbd> / <kbd>Num 6</kbd>
- **Double Knee Press (Scissor Kick):** P1: Hold <kbd>A</kbd> (0.5s) → <kbd>D</kbd> + <kbd>V</kbd> | P2: Hold <kbd>→</kbd> (0.5s) → <kbd>←</kbd> + <kbd>Num 1</kbd> | *Shortcut:* <kbd>Y</kbd> / <kbd>Num 3</kbd>

---

## ⚔️ Mechanics & Special Features

- **🎬 Slow-Motion K.O. Finish:** When the winning strike lands, the game enters 1/3 speed slow motion. The winning fighter finishes their attack and lands on the mat before transitioning into their victory pose!
- **🧹 Clean Bout Resets:** All inputs, pending attacks, and velocities are completely wiped at the start of each round, ensuring no moves carry over into the next bout.
- **🛡️ Screen Boundary Clamping:** Fighters are strictly locked within the visible camera viewport; neither fighter can ever walk or be thrown off-screen.
- **✈️ Flight Mechanic:** Holding <kbd>Up</kbd> and pressing Light Punch or Light Kick during jumps provides mid-air upward thrust!
- **🏆 8-Stage Arcade Tournament Mode:** Choose any character and fight through 8 escalating AI stages (`E. Honda` $\rightarrow$ `Blanka` $\rightarrow$ `Guile` $\rightarrow$ `Chun-Li` $\rightarrow$ `Zangief` $\rightarrow$ `Dhalsim` $\rightarrow$ `Ken` $\rightarrow$ `M. Bison`) to become the Tournament Champion!
- **📺 Retro CRT Filter:** Scanline shader and vintage phosphor curvature overlay.
- **🎵 Web Audio Synthesis:** 100% procedural sound effects (hits, blocks, electric shocks, fire breath, slap flurries, lariats, piledrivers, announcer) and classic CPS-1 chiptune BGM.
