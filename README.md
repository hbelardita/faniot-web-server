# Faniot - Monitor Ambiental ESP32

Sistema de monitoreo ambiental con ESP32 que lee temperatura y humedad (sensor HTU21DF), contador de semillas con botones físicos e interfaz web.

---

## Hardware

- ESP32
- Sensor HTU21DF (temperatura/humedad)
- Pantalla OLED SSD1306 (128x64)
- 4 NeoPixels WS2812B
- Buzzer
- 3 Botones (GPIO0, GPIO15, GPIO13)

---

## Configuración WiFi

Editar `src/main.cpp` y cambiar las credenciales:

```cpp
// Configuración de la red Wi-Fi
const char *ssid = "TU_RED";           // Tu red Wi-Fi
const char *password = "TU_PASSWORD"; // Tu contraseña
```

---

## Compilar y Subir

```bash
# Compilar
pio run

# Subir firmware
pio run --target upload

# Subir y abrir monitor serie
pio run --target upload && pio device monitor
```

---

## Endpoints Web

| Ruta | Descripción |
|------|-------------|
| `/` | Página principal con sensores |
| `/datos` | Datos en tiempo real (estilo terminal) |
| `/api` | API JSON con datos del sistema |
| `/semillas` | Controlador de contador de semillas |
| `/semillas/inc` | Incrementar contador (+1) |
| `/semillas/dec` | Decrementar contador (-1) |
| `/semillas/reset` | Resetear contador a 0 |
| `/semillas/add?c=N` | Agregar N semillas |

---

## Estructura del Proyecto

```
faniot/
├── src/
│   └── main.cpp         # Código principal
├── platformio.ini       # Configuración PlatformIO
├── README.md            # Este archivo
└── .gitignore           # Ignorar carpeta .pio
```

---

## Notas

- Los datos del contador de semillas se guardan en EEPROM (persisten al reiniciar)
- La interfaz web se actualiza automáticamente cada 2 segundos sin recargar la página
- Los NeoPixels indican la temperatura: Azul (frío) → Verde (ideal) → Rojo (caliente)