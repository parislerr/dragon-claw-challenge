# Dragon Claw Challenge — Hardware Handover

This repository's `main` branch contains the final browser experience. The wearable integration is being prepared separately; do not assume this handover branch is a verified integrated build until hardware testing is completed.

## XLOT-Hermes Wi-Fi configuration

The provided Arduino firmware uses placeholder values:

```cpp
const char* WIFI_SSID = "xxx";
const char* WIFI_PASS = "xxx";
```

**These are placeholders, not working credentials.** The currently flashed XLOT-Hermes board is configured for a teammate's hotspot. To use a different hotspot:

1. Open the latest `wearable_multi.ino` in Arduino IDE.
2. Replace both `xxx` values **locally** with the new hotspot SSID and password.
3. Compile and re-upload the sketch to the XLOT-Hermes board.
4. Open Serial Monitor at 115200 baud; verify Wi-Fi connection and record the current device IP.
5. Connect the controlling computer or Raspberry Pi to the same network, then check `http://<XLOT_IP>/status`.
6. Update the local wearable bridge's XLOT IP configuration and test M1–M4, Wind, Rain, Thunder and Stop.

Never commit real hotspot passwords to GitHub. Changing hotspot credentials in GitHub alone does not reconfigure a board that has already been flashed. IP addresses may change after reconnection.

## Raspberry Pi

The working Raspberry Pi environment is on the SD card handed over with the physical prototype. Keep the SD card with the unit and do not reimage it. The repository should eventually include startup instructions and the exact service/script entry point used on that card.

## Integration checks before merging into main

- Preserve the final `main` website, including narration and index-finger Thunder gesture.
- Add and test the local HTTP wearable bridge and four-motor Arduino firmware.
- Confirm the uploaded V4 firmware is the intended handover version; its Wind pattern overlaps, Rain switches pairs every 300 ms, and Thunder PWM is 50%.
- Verify timing documentation and report figures against the actual flashed firmware.
- Test browser-only experience and the integrated physical system separately.
- Only then merge the verified integration branch into `main`.
