# XLOT-Hermes four-motor firmware

This is the **four-motor** version of the wearable firmware. It is added alongside the existing single-motor bridge; do not overwrite the single-motor firmware.

## Hardware
- XLOT-Hermes (ESP32-S2), PCA9685, four compatible haptic driver modules.
- I2C: SDA GPIO17, SCL GPIO18; PCA9685 address `0x40`.
- Motor channels: CH0, CH1, CH14, CH15.
- Arduino library: vendor-supplied `XLOT_PWMServoDriver`.
- Confirm motor power voltage, polarity, shared ground and the vendor-specific power routing before applying power.

## Flash and test
1. Open `wearable_multi/wearable_multi.ino` in Arduino IDE.
2. Replace the Wi-Fi placeholders **locally only**. Never commit credentials.
3. Select the XLOT-Hermes board and USB serial port; upload.
4. Open Serial Monitor at 115200 baud. Verify `PCA9685 detected and initialized!` and note the IP address.
5. With computer and XLOT on the same Wi-Fi, open `http://<XLOT_IP>/`.
6. Test M1 to M4 separately (1 second each) before Wind, Rain and Thunder.

## HTTP API
- `GET /status` returns `ready`, `mode`, `vibrating`, `motors`.
- `GET /test?ch=0..3` tests one motor.
- `GET /command?mode=W|R|T|S` selects Wind, Rain, Thunder, Stop.
- `GET /heartbeat` keeps active weather modes running (send about every 2 seconds).
- `GET /stop` stops motors.
- Active weather modes stop after 6 seconds without a heartbeat.

## Raspberry Pi integration
Run the existing local Python bridge with the XLOT's current IP on the **same network**. The XLOT IP can change when moving to a teammate's hotspot. Test the bridge against this firmware before merging to main.

## Safety
Do not power motors from GPIO pins. Protect the LiPo battery against shorts, crushing and bending; keep electrical contacts insulated. PWM percentages are duty cycles, not calibrated vibration intensities.
