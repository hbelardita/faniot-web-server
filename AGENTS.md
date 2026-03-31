# AGENTS.md - Developer Guide for Faniot Project

## Project Overview

This is an ESP32-based embedded project using PlatformIO with Arduino framework. It monitors temperature/humidity (HTU21DF sensor), controls a seed counter with physical buttons and web interface, displays on OLED (SSD1306), and provides audio feedback via buzzer.

---

## Build & Development Commands

### Build
```bash
pio run          # Build entire project
pio run -e esp32dev  # Build specific environment
```

### Upload
```bash
pio run --target upload        # Upload to ESP32
pio run --target upload --upload-port /dev/ttyUSB0  # Specific port
```

### Monitor
```bash
pio device monitor              # Open serial monitor (115200 baud)
```

### Clean
```bash
pio run --target clean          # Clean build artifacts
```

### Full Build + Upload + Monitor
```bash
pio run --target upload && pio device monitor
```

### Single File Compilation Test
```bash
# PlatformIO doesn't support single file compilation directly
# Use: pio run with verbose output to see compilation steps
pio run -v
```

---

## Code Style Guidelines

### File Structure

- **Single main file**: `src/main.cpp` contains all application code
- **Header declarations**: Place function prototypes before `setup()` for clarity
- **Organize by section**: Use comment blocks to separate logical sections:
  ```cpp
  // ========== INCLUDES ==========
  // ========== CONSTANTS & PINS ==========
  // ========== GLOBAL VARIABLES ==========
  // ========== FORWARD DECLARATIONS ==========
  // ========== SETUP ==========
  // ========== LOOP ==========
  // ========== HELPER FUNCTIONS ==========
  ```

### Naming Conventions

- **Constants**: UPPER_SNAKE_CASE with descriptive names
  ```cpp
  const int PIN_BOTON_INC = 0;
  const long INTERVALO_LECTURA = 2000;
  ```

- **Variables**: camelCase with prefixes indicating type
  ```cpp
  float temperatura = 0.0;
  int contadorSemillas = 0;
  unsigned long ultimaLectura = 0;
  ```

- **Functions**: snake_case or camelCase (prefer snake_case for Arduino)
  ```cpp
  void leerSensor();
  void actualizarContador(int delta);
  void generarPaginaHTML();
  ```

- **Pin Constants**: Prefixed with PIN_, OUT_, IN_
  ```cpp
  const int PIN_BUZZER = 12;
  const int PIN_BOTON_INC = 0;
  ```

### Includes & Libraries

- Group includes by category:
  1. Standard C/C++ (none typically needed for Arduino)
  2. Arduino framework headers
  3. External libraries
  4. Local headers

```cpp
// Standard (none for Arduino)
// Arduino
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
// External
#include <EEPROM.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Adafruit_HTU21DF.h"  // Local lib
```

- Always include required libraries in `platformio.ini` under `lib_deps`

### Types

- Use appropriate integer types:
  - `int` for general integers
  - `unsigned long` for millis() and timestamps
  - `float` for sensor readings
  - `bool` for flags and states
  - `String` for HTML/JSON generation (avoid in tight loops)

### Error Handling

- Sensor initialization: Use while(1) loop to halt if critical sensor fails
```cpp
if (!htu.begin())
{
  Serial.println("Error: HTU21DF no encontrado!");
  while (1) { delay(1000); }
}
```

- Web server routes: Check for required arguments before processing
```cpp
if (server.hasArg("c"))
{
  int cantidad = server.arg("c").toInt();
  if (cantidad > 0) { /* valid */ }
}
```

- EEPROM: Initialize before use, handle read errors
```cpp
EEPROM.begin(4);
cargarContadorEEPROM();
if (contadorSemillas < 0) contadorSemillas = 0;
```

### Formatting

- Indentation: 2 spaces (Arduino standard)
- Line length: Keep under 120 characters when practical
- Braces: K&R style (opening brace on same line)
- Spaces around operators: `i = i + 1` not `i=i+1`
- No trailing whitespace

### HTML/JSON Generation

- Build HTML in functions returning `String`
- Use concatenation with `+=` operator
- Group related HTML in logical chunks
- Keep CSS/JS inline for embedded projects (no external files)

### Hardware-Specific Notes

- GPIO0, GPIO15, GPIO13: Used for buttons (pull-up mode)
- GPIO12: Buzzer output (PWM/tone)
- I2C: OLED on default SDA/SCL pins
- WebServer: Runs on port 80
- Sensors: HTU21DF for temp/humidity

### Performance Considerations

- Avoid String concatenation in `loop()` - build once, return
- Use `millis()` for timing instead of `delay()` in main loop
- Limit serial output in production (can slow execution)
- Update OLED only when data changes (every 2s is fine)

---

## Testing

- This project has no automated tests - it runs on hardware
- Manual testing via:
  - Serial monitor output
  - Web interface at ESP32 IP address
  - Physical button interactions
  - OLED display verification

---

## Common Tasks

### Adding a new web route
```cpp
server.on("/ruta", []()
{
  // Handle request
  server.send(200, "text/plain", "response");
});
```

### Adding a new sensor
1. Add library to `platformio.ini` lib_deps
2. Include header at top of main.cpp
3. Create global object
4. Initialize in setup()
5. Read in appropriate function

### Modifying OLED display
Edit `actualizarOLED()` function - display uses 128x64 pixels with textSize 1 (default) and textSize 2.

---

## PlatformIO Tips

- VS Code: Install PlatformIO IDE extension
- List libraries: `pio lib list`
- Search library: `pio lib search "ssd1306"`
- Update platforms: `pio platform update`