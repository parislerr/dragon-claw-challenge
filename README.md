# Dragon Claw Challenge

**CDE5312 — Beyond the Surface: Exploring Interactive Wearables | Team 3**

Dragon Claw Challenge is a gesture-based, multisensory museum experience developed for ArCH Square. Visitors explore dragon claw symbolism through finger-count gestures and trigger wind, rain and thunder effects through hand movements. The final experience combines visual storytelling, cultural narration and audio, with optional four-motor wearable haptic feedback when operated locally.

## Choose how to run

| Version | What it supports | Access |
| --- | --- | --- |
| **Online demo (Vercel)** | Final interactive game, camera gestures, animation, narration and audio. **No physical wearable connection.** | https://dragon-claw-challenge.vercel.app/ |
| **Local wearable-enabled version** | Final interactive game **plus** XLOT-Hermes four-motor vibration control. | Download this integration branch and run the Python bridge at `http://localhost:8765`. |

The Vercel demo is a browser-only experience; it cannot directly communicate with the wearable. For real haptic feedback, run the game locally with `wearable_server.py` and a correctly configured XLOT-Hermes device.

## Run the online / browser-only experience locally

1. Download the source ZIP for this branch: https://github.com/parislerr/dragon-claw-challenge/archive/refs/heads/handover/final-integration.zip and extract it.
2. Install Python 3 if needed. Open a terminal in the extracted project folder.
3. Run `python3 -m http.server 8765 --directory dist` (Windows: `py -m http.server 8765 --directory dist`).
4. Open http://localhost:8765 in Chrome or Edge. Enable camera access to use hand gestures.

**This static-server method does not connect to the wearable.** Internet access is required to load MediaPipe hand tracking and its model; camera processing occurs in the browser. Do not open `dist/index.html` directly from the filesystem.

## Run with the physical wearable

**Hardware:** XLOT-Hermes (ESP32-S2), PCA9685, four vibration motors, power supply, and a computer or Raspberry Pi on the same hotspot.

1. The provided V4.0 firmware is `wearable/wearable_multi/wearable_multi.ino`. Its `WIFI_SSID` and `WIFI_PASS` are intentionally set to `"xxx"` **placeholders**. The XLOT board handed over was previously flashed for a teammate's hotspot; the GitHub placeholders do not change its existing configuration.
2. **When changing hotspots:** open the sketch in Arduino IDE, replace both placeholders locally with the new SSID and password, compile, and **re-upload** the firmware to the XLOT-Hermes. Do not publish actual Wi-Fi credentials.
3. Open Arduino Serial Monitor at **115200 baud**, confirm the Wi-Fi connection and note the XLOT's current IP address. The IP may change when reconnecting.
4. Connect the computer and XLOT to the same hotspot. Check `http://<XLOT_IP>/status`, then open `http://<XLOT_IP>/` to test the four motors individually.
5. From the downloaded repository root, run:

   ```sh
   python3 wearable_server.py --xlot <XLOT_IP>
   ```

   Replace `<XLOT_IP>` with the actual device address, without angle brackets.
6. Open **http://localhost:8765** in Chrome or Edge. Click **Check connection**, then test **Wind**, **Rain**, **Thunder**, and **Stop**. Enable the camera to test gesture-driven vibration.

**Important:** Use `wearable_server.py` rather than `python3 -m http.server` when connecting to the wearable. The Python bridge forwards HTTP commands to the XLOT and sends heartbeats. The XLOT firmware stops active vibration after approximately six seconds without a heartbeat. This local setup has not yet been verified end-to-end on the handed-over hardware.

For device-specific instructions and troubleshooting, see [Hardware Handover](docs/HARDWARE_HANDOVER.md).

## How to play

- Swipe left to move through the opening story scenes.
- Scenes 02–07 include optional spoken narration. The Next scene button and right arrow key can also advance the story.
- Show **3, 4, or 5 fingers** when prompted to explore dragon claw configurations.
- **Wind:** close your hand into a fist and hold.
- **Rain:** move an open hand left and right.
- **Thunder:** point your index finger upward and hold.
- Lower your hand briefly between challenges.
- Each weather challenge takes eight seconds of valid gestures and awards 1,000 points, for 3,000 points total.
- The ending returns to the beginning after 15 seconds.

## Project files

| Path | Purpose |
| --- | --- |
| `dist/` | Final browser game, artwork, narration, animation and interaction code |
| `dist/app.mjs`, `dist/game-ui.mjs`, `dist/game.mjs` | Camera/scene controls, game interface and weather logic |
| `dist/wearable-ui.mjs` | Local wearable connection checks, commands and test buttons |
| `wearable_server.py` | Local Python HTTP bridge between the game and XLOT-Hermes |
| `wearable/wearable_multi/wearable_multi.ino` | Four-motor XLOT-Hermes Arduino V4.0 firmware |
| `docs/HARDWARE_HANDOVER.md` | Hotspot, firmware and hardware handover instructions |
| `test.mjs`, `narration.test.mjs` | Browser-game and narration tests |

The firmware's programmed patterns are: Wind 300 ms pulses at 200 ms steps (35% PWM); Rain 180 ms pulses alternating motor pairs every 300 ms (45% PWM); Thunder simultaneous 180 ms and 280 ms bursts (50% PWM). PWM settings are duty cycles, not measured vibration amplitude.

## Raspberry Pi handover

The Raspberry Pi's existing software environment is stored on the SD card supplied with the assembled physical prototype. The SD card is the handover copy of that deployment. The exact Pi startup command/service and its compatibility with the latest integrated branch have **not yet been independently verified**. Do not overwrite or reimage the card without backing it up.

## Optional software checks

With Node.js installed, run `node test.mjs` and `node narration.test.mjs` from the repository root. These checks do not replace testing the physical wearable.

Changes made through the browser's scene editor are stored on that browser/device and do not automatically update the repository or Vercel deployment.
