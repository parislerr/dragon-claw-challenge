
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <XLOT_PWMServoDriver.h>

// ============================================
// Dragon Claw Wearable
// XLOT-Hermes + PCA9685 + 4 Motors
// Version 4.0
// ============================================

// ===== Wi-Fi =====
// Replace with your current hotspot credentials.
const char* WIFI_SSID = "xxx";
const char* WIFI_PASS = "xxx";

// ===== PCA9685 =====
#define I2C_SDA 17
#define I2C_SCL 18

#define PCA_ADDR 0x40
#define OSC_FREQ 27000000UL
#define PWM_FREQ 1000

#define MOTOR_COUNT 4

// Motors connected to CH0, CH1, CH2, CH3
const uint8_t MOTOR_CHANNELS[MOTOR_COUNT] = {
  6, 7, 8, 9
};

WebServer server(80);
XLOT_PWMServoDriver pwm(PCA_ADDR);

// ============================================
// Modes and state
// ============================================

enum Mode {
  MODE_STOP,
  MODE_TEST,
  MODE_WIND,
  MODE_RAIN,
  MODE_THUNDER
};

Mode currentMode = MODE_STOP;

bool pcaReady = false;

uint8_t motorPower[MOTOR_COUNT] = {
  0, 0, 0, 0
};

uint32_t modeStart = 0;
uint32_t lastHeartbeat = 0;
uint32_t lastWifiRetry = 0;

const uint32_t TEST_DURATION = 1000;
const uint32_t HEARTBEAT_TIMEOUT = 6000;

// PWM duty cycles
const uint8_t TEST_POWER = 30;
const uint8_t WIND_POWER = 35;
const uint8_t RAIN_POWER = 45;
const uint8_t THUNDER_POWER = 50;

int testChannel = -1;

// ============================================
// Motor control
// ============================================

void writeMotor(uint8_t index, uint8_t power) {
  if (!pcaReady || index >= MOTOR_COUNT) {
    return;
  }

  power = constrain(power, 0, 100);

  if (motorPower[index] == power) {
    return;
  }

  uint8_t channel = MOTOR_CHANNELS[index];

  uint16_t duty =
    ((uint32_t)power * 4095UL) / 100UL;

  // Vendor-compatible PWM convention:
  // 0% = 0 duty, 100% = 4095 duty.
  pwm.setPWM(channel, 0, duty);

  motorPower[index] = power;
}

void allMotorsOff() {
  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    writeMotor(i, 0);
  }
}

void setAllMotors(uint8_t power) {
  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    writeMotor(i, power);
  }
}

void stopMotors() {
  allMotorsOff();
  currentMode = MODE_STOP;
  testChannel = -1;

  Serial.println("Mode -> STOP");
}

void startMode(Mode mode) {
  if (!pcaReady) {
    Serial.println("Cannot start: PCA9685 offline");
    return;
  }

  stopMotors();

  currentMode = mode;
  modeStart = millis();
  lastHeartbeat = millis();
}

void startTest(int index) {
  if (!pcaReady || index < 0 ||
      index >= MOTOR_COUNT) {
    return;
  }

  startMode(MODE_TEST);

  testChannel = index;
  writeMotor(index, TEST_POWER);

  Serial.print("Testing Motor ");
  Serial.println(index + 1);
}

// ============================================
// Weather patterns
// ============================================


void updateWind() {
  const uint32_t STEP_MS = 200;
  const uint32_t PULSE_MS = 300;
  const uint32_t CYCLE_MS = STEP_MS * MOTOR_COUNT;

  uint32_t phase = (millis() - modeStart) % CYCLE_MS;

  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    uint32_t start = i * STEP_MS;
    uint32_t age = (phase + CYCLE_MS - start) % CYCLE_MS;

    bool active = age < PULSE_MS;

    writeMotor(i, active ? WIND_POWER : 0);
  }
}



void updateRain() {
  uint32_t elapsed = millis() - modeStart;

  uint32_t cycle = elapsed / 300;
  uint32_t phase = elapsed % 300;

  bool pulseOn = phase < 180;
  bool firstPair = (cycle % 2 == 0);

  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    bool selected = firstPair
      ? (i == 0 || i == 2)
      : (i == 1 || i == 3);

    writeMotor(
      i,
      pulseOn && selected ? RAIN_POWER : 0
    );
  }
}


void updateThunder() {
  uint32_t elapsed =
    (millis() - modeStart) % 2400;

  if (elapsed < 180) {
    setAllMotors(THUNDER_POWER);
  }
  else if (elapsed < 420) {
    allMotorsOff();
  }
  else if (elapsed < 700) {
    setAllMotors(THUNDER_POWER);
  }
  else {
    allMotorsOff();
  }
}

void updateTest() {
  if (millis() - modeStart >= TEST_DURATION) {
    stopMotors();
  }
}

// ============================================
// PCA9685 initialization
// ============================================

void initializePCA() {
  Serial.println();
  Serial.println("Initializing I2C...");

  bool wireOK = Wire.begin(I2C_SDA, I2C_SCL);

  Wire.setClock(100000);
  Wire.setTimeOut(100);

  Serial.print("Wire.begin(): ");
  Serial.println(wireOK ? "OK" : "FAILED");

  if (!wireOK) {
    pcaReady = false;
    return;
  }

  Wire.beginTransmission(PCA_ADDR);
  uint8_t result = Wire.endTransmission();

  Serial.print("PCA9685 probe result: ");
  Serial.println(result);

  if (result != 0) {
    pcaReady = false;

    Serial.println(
      "ERROR: PCA9685 not detected!"
    );

    return;
  }

  Serial.println("PCA9685 detected!");

  pwm.begin();
  pwm.setOscillatorFrequency(OSC_FREQ);
  pwm.setPWMFreq(PWM_FREQ);

  pcaReady = true;

  // Explicitly initialize all 16 outputs OFF.
  for (uint8_t ch = 0; ch < 16; ch++) {
    pwm.setPWM(ch, 0, 0);
  }

  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    motorPower[i] = 0;
  }

  Serial.println("PCA9685 initialized!");
}

// ============================================
// Web page
// ============================================

const char PAGE[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>XLOT 4-Motor Controller</title>

<style>
body {
  font-family: Arial, sans-serif;
  background: #101827;
  color: #ffffff;
  max-width: 640px;
  margin: auto;
  padding: 24px;
}

h1 {
  color: #dceaff;
}

h3 {
  margin-top: 30px;
}

button {
  border: 0;
  border-radius: 9px;
  padding: 14px 18px;
  margin: 5px;
  background: #3478d4;
  color: white;
  font-size: 15px;
  cursor: pointer;
}

.stop {
  background: #c9424b;
}

#status {
  background: #202d43;
  padding: 16px;
  border-radius: 9px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
</head>

<body>

<h1>XLOT 4-Motor Controller</h1>

<h3>Individual Motor Test</h3>

<button onclick="testMotor(0)">M1</button>
<button onclick="testMotor(1)">M2</button>
<button onclick="testMotor(2)">M3</button>
<button onclick="testMotor(3)">M4</button>

<h3>Weather Patterns</h3>

<button onclick="sendMode('W')">Wind</button>
<button onclick="sendMode('R')">Rain</button>
<button onclick="sendMode('T')">Thunder</button>
<button class="stop"
onclick="sendMode('S')">STOP</button>

<h3>Device Status</h3>

<button onclick="checkStatus()">
Check Status
</button>

<pre id="status">Connecting...</pre>

<script>
let heartbeatTimer = null;

function clearHeartbeat() {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

async function request(path) {
  const response = await fetch(path);
  const text = await response.text();

  document.getElementById("status").textContent =
    text;

  if (!response.ok) {
    throw new Error(text);
  }

  return text;
}

async function testMotor(index) {
  clearHeartbeat();

  try {
    await request("/test?ch=" + index);
  } catch (error) {
    console.error(error);
  }
}

async function sendMode(mode) {
  clearHeartbeat();

  try {
    await request("/command?mode=" + mode);

    if (mode !== "S") {
      heartbeatTimer = setInterval(() => {
        fetch("/heartbeat").catch(console.error);
      }, 2000);
    }
  } catch (error) {
    console.error(error);
  }
}

async function checkStatus() {
  try {
    await request("/status");
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("pagehide", () => {
  clearHeartbeat();
  navigator.sendBeacon("/stop");
});

checkStatus();
</script>

</body>
</html>
)HTML";

// ============================================
// HTTP handlers
// ============================================

void handleRoot() {
  server.send_P(
    200,
    "text/html; charset=utf-8",
    PAGE
  );
}

void handleTest() {
  if (!pcaReady) {
    server.send(
      503,
      "text/plain",
      "PCA9685 not detected"
    );
    return;
  }

  if (!server.hasArg("ch")) {
    server.send(
      400,
      "text/plain",
      "Missing channel"
    );
    return;
  }

  String arg = server.arg("ch");

  if (arg.length() != 1 ||
      arg[0] < '0' || arg[0] > '3') {
    server.send(
      400,
      "text/plain",
      "Invalid channel"
    );
    return;
  }

  startTest(arg.toInt());

  server.send(
    200,
    "text/plain",
    "Motor test started"
  );
}

void handleCommand() {
  String mode = server.arg("mode");
  mode.toUpperCase();

  if (mode == "S") {
    stopMotors();
    server.send(200, "text/plain", "STOP");
    return;
  }

  if (!pcaReady) {
    server.send(
      503,
      "text/plain",
      "PCA9685 not detected"
    );
    return;
  }

  if (mode == "W") {
    startMode(MODE_WIND);
  }
  else if (mode == "R") {
    startMode(MODE_RAIN);
  }
  else if (mode == "T") {
    startMode(MODE_THUNDER);
  }
  else {
    server.send(
      400,
      "text/plain",
      "Invalid mode"
    );
    return;
  }

  server.send(
    200,
    "text/plain",
    "OK: " + mode
  );
}

void handleHeartbeat() {
  if (pcaReady &&
      currentMode != MODE_STOP &&
      currentMode != MODE_TEST) {
    lastHeartbeat = millis();
  }

  server.send(
    200,
    "text/plain",
    "ALIVE"
  );
}

void handleStatus() {
  String modeName = "STOP";

  switch (currentMode) {
    case MODE_TEST:
      modeName = "TEST";
      break;
    case MODE_WIND:
      modeName = "WIND";
      break;
    case MODE_RAIN:
      modeName = "RAIN";
      break;
    case MODE_THUNDER:
      modeName = "THUNDER";
      break;
    default:
      modeName = "STOP";
  }

  String json = "{";

  json += "\"ready\":";
  json += pcaReady ? "true" : "false";

  json += ",\"mode\":\"";
  json += modeName;
  json += "\"";

  json += ",\"vibrating\":";
  json += currentMode != MODE_STOP
    ? "true" : "false";

  json += ",\"motors\":[";

  for (uint8_t i = 0; i < MOTOR_COUNT; i++) {
    if (i > 0) json += ",";
    json += String(motorPower[i]);
  }

  json += "]}";

  server.send(
    200,
    "application/json",
    json
  );
}

void handleStop() {
  stopMotors();
  server.send(
    200,
    "text/plain",
    "STOP"
  );
}

// ============================================
// Wi-Fi
// ============================================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  uint32_t started = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - started < 15000
  ) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi connection pending.");
  }
}

// ============================================
// Setup
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1200);

  Serial.println();
  Serial.println("==========================");
  Serial.println("Dragon Claw 4-Motor V4");
  Serial.println("==========================");

  initializePCA();

  connectWiFi();

  server.on("/", handleRoot);
  server.on("/test", handleTest);
  server.on("/command", handleCommand);
  server.on("/heartbeat", handleHeartbeat);
  server.on("/status", handleStatus);
  server.on("/stop", handleStop);

  server.begin();

  Serial.println("HTTP Server Started");
}

// ============================================
// Main loop
// ============================================

void loop() {
  server.handleClient();

  // Wi-Fi reconnect
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMode != MODE_STOP) {
      stopMotors();
    }

    if (millis() - lastWifiRetry > 15000) {
      lastWifiRetry = millis();

      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);

      Serial.println("Wi-Fi reconnecting...");
    }
  }

  // Heartbeat safety timeout
  if (
    currentMode == MODE_WIND ||
    currentMode == MODE_RAIN ||
    currentMode == MODE_THUNDER
  ) {
    if (
      millis() - lastHeartbeat >
      HEARTBEAT_TIMEOUT
    ) {
      Serial.println("Heartbeat timeout");
      stopMotors();
    }
  }

  if (pcaReady) {
    switch (currentMode) {
      case MODE_TEST:
        updateTest();
        break;

      case MODE_WIND:
        updateWind();
        break;

      case MODE_RAIN:
        updateRain();
        break;

      case MODE_THUNDER:
        updateThunder();
        break;

      case MODE_STOP:
        break;
    }
  }

  delay(5);
}