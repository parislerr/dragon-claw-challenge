# Dragon Claw Challenge

A blue-and-white porcelain-inspired hand-gesture game for the CDE 5312 project.

**Play online:** https://dragon-claw-challenge.vercel.app/

## Download and play

1. Download the [latest source ZIP](https://github.com/parislerr/dragon-claw-challenge/archive/refs/heads/main.zip) and unzip the folder. It includes the complete source, artwork and narration recordings.
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
- Slides 02–07 play narration. Their gesture icons appear and forward navigation unlocks only after the recording finishes. Use the narration control to pause, resume or retry playback.
- Follow the displayed finger-count instructions in the claw scenes: hold 3, 4 or 5 fingers as prompted. The existing gestures are preserved.
- Gather clouds: close your hand into a fist and hold it.
- Make rain: move an open hand left and right.
- Rumble the sky: point your index finger upward and hold it. Both painted lightning banks flash and rumble as progress builds.
- Lower your hand briefly between challenges.
- Each weather challenge takes eight seconds of valid gestures and awards 1,000 points, for 3,000 points total. Progress pauses when the gesture stops.
- The ending returns to scene 01 after 15 seconds.

## Contents

- `dist/`: complete playable website, including all artwork and animation layers.
- `dist/audio.mjs`: original synthesized plucked-string/flute music and weather effects.
- `dist/app.mjs`: scene controls and camera integration.
- `dist/game.mjs`: weather-game logic.
- `dist/narration.mjs` and `dist/narration-scenes.mjs`: playback and gesture-cue timing for slides 02–07.
- `dist/assets/audio/`: the supplied slide narration recordings.
- `test.mjs`: checks for gestures, scoring, scenes and artwork.
- `narration.test.mjs`: checks for narration completion, playback controls and cue timing.

No build step or package installation is needed. To run the checks with Node.js installed:

```sh
node test.mjs
node narration.test.mjs
```

Custom scene changes and uploaded transitions are saved only in that browser; they do not automatically update this repository or the live website.

## Sharing and artwork

This repository shares the class prototype and its supplied/generated artwork for teammate review and collaboration. No open-source license is granted by this repository. Third-party libraries retain their respective licenses.
