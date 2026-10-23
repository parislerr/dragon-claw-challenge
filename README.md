# Dragon Claw Challenge

A blue-and-white porcelain-inspired hand-gesture game for the CDE 5312 project.

**Play online:** https://dragon-claw-challenge.vercel.app/

## Download and play

1. Download **dragon-claw-challenge.zip** from the [latest release](https://github.com/parislerr/dragon-claw-challenge/releases/latest) and unzip the folder. The release includes the complete source and artwork.
2. Install Python 3 if it is not already available.
3. Open a terminal in the downloaded folder and run:

```sh
python3 -m http.server 8765 --directory dist
```

On Windows, use `py -m http.server 8765 --directory dist` instead.

4. Open http://localhost:8765 in Chrome or Edge.
5. Click **Enable camera** and allow access for gesture control, or use the on-screen buttons.
6. Click **Sound off** to enable music and weather sounds.

Use a local web server rather than double-clicking index.html: the game uses JavaScript modules and loads artwork data. Internet access is needed to load the hand-tracking library and model. Camera images are processed in the browser.

## How to play

- Swipe left to move through the opening story scenes.
- Follow the displayed finger-count instructions in the claw scenes.
- Gather clouds: close your hand into a fist and hold it briefly.
- Make rain: move an open hand left and right.
- Rumble the sky: move a closed fist left and right.
- Lower your hand briefly between challenges.
- Reach 1,000 points. The ending returns to scene 01 after 15 seconds.

## Contents

- `dist/`: complete playable website, including all artwork and animation layers.
- `dist/audio.mjs`: original synthesized plucked-string/flute music and weather effects.
- `dist/app.mjs`: scene controls and camera integration.
- `dist/game.mjs`: weather-game logic.
- `test.mjs`: checks for gestures, scoring, scenes and artwork.

No build step or package installation is needed. To run the checks with Node.js installed:

```sh
node test.mjs
```

Custom scene changes and uploaded transitions are saved only in that browser; they do not automatically update this repository or the live website.

## Sharing and artwork

This repository shares the class prototype and its supplied/generated artwork for teammate review and collaboration. No open-source license is granted by this repository. Third-party libraries retain their respective licenses.
