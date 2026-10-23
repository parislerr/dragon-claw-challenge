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

## XLOT-Hermes wearable integration (local testing)

The `feature/xlot-wearable` branch adds Wi-Fi haptic feedback to the weather challenge. The game still runs in the browser; a small local Python server forwards commands to the XLOT-Hermes (ESP32-S2). **You do not need a Raspberry Pi for MacBook testing.**

### Requirements

- XLOT-Hermes with the project's `xlot_vibration.ino` firmware already uploaded (HTTP routes: `/command`, `/status`, `/heartbeat`).
- XLOT vibration motor connected and powered safely via USB or its supported LiPo power module.
- MacBook and XLOT connected to the **same Wi-Fi network/hotspot**, with device-to-device communication allowed.
- Python 3 and Chrome/Edge. No additional Python packages are required for the bridge.

### Start the wearable-enabled game

1. On the XLOT Arduino Serial Monitor (115200 baud), confirm `Wi-Fi connected!` and note the current `XLOT IP`. Its Wi-Fi SSID/password are configured in the Arduino firmware, so update and re-upload that firmware if you switch hotspots.
2. On your MacBook, verify the device is reachable (replace the IP below with the current one):

   ```sh
   curl --noproxy '*' http://172.20.10.14/status
   ```

   Expected response is a JSON object such as `{"mode":"STOP","vibrating":false}`.

3. Check out the integration branch and start the local server **from the repository root**:

   ```sh
   git switch feature/xlot-wearable
   python3 wearable_server.py --xlot 172.20.10.14
   ```

   Replace `172.20.10.14` with the XLOT's **current** IP. You can try `--xlot xlot-hermes.local` if mDNS works on your network.

4. Keep the terminal running and open **http://localhost:8765** in Chrome/Edge. Click **Check connection**, then try the **Wind**, **Rain**, **Thunder**, and **Stop** test buttons.
5. Enable the camera and play the weather challenge. The page sends weather commands when each challenge starts progressing, and stops haptics when leaving/completing the challenge.

**Important:** When using the wearable, start the game with `wearable_server.py`, **not** `python3 -m http.server`. The latter only serves static files and does not provide the wearable API.

### Commands and integration

| Game / action | XLOT HTTP endpoint | Effect |
| --- | --- | --- |
| Gather Clouds | `GET /command?mode=W` | Wind vibration |
| Make It Rain | `GET /command?mode=R` | Rain vibration |
| Rumble the Sky | `GET /command?mode=T` | Thunder vibration |
| Stop / exit | `GET /command?mode=S` | Stop motor |
| Check connection | `GET /status` | JSON status |
| Keepalive | `GET /heartbeat` | Keep active mode alive |

`dist/game-ui.mjs` emits weather events, `dist/wearable-ui.mjs` sends requests to `/api/wearable/...`, and `wearable_server.py` forwards them to the XLOT and sends heartbeats while active. The XLOT firmware stops an active mode after approximately 10 seconds without a heartbeat. The bridge also stops after 120 seconds without a new weather command.

### Troubleshooting

- **Connection failed:** Check that XLOT is powered, both devices are on the same hotspot, and the XLOT IP has not changed. Test `/status` with `curl` before testing the webpage.
- **404 for `/api/wearable/...`:** You are probably using the static-only server or the Vercel site. Start `wearable_server.py` and open its local URL.
- **Camera unavailable:** Allow camera permission in Chrome/Edge and load the game from `localhost`.
- **Vibration stops unexpectedly:** Check Wi-Fi stability and heartbeat; the XLOT firmware includes a safety timeout.
- **Raspberry Pi deployment:** Run the same local server on Pi and open its localhost page in Chromium. Pi Camera compatibility, HDMI fullscreen output, and local network connectivity still require on-device testing.

This integration is designed for **local museum deployment**. The Vercel-hosted game is for online preview and does not directly expose the local wearable bridge. Do not commit hotspot passwords or other credentials to GitHub.

## Sharing and artwork

This repository shares the class prototype and its supplied/generated artwork for teammate review and collaboration. No open-source license is granted by this repository. Third-party libraries retain their respective licenses.
