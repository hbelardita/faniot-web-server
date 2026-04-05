# Faniot - Monitor Ambiental ESP32 (Cloud Edition) 🚀☁️

Sistema de monitoreo ambiental con ESP32 que reporta temperatura, humedad y contador de semillas a la nube usando **Supabase**.


> **⚙️ Hardware Base:** [Kit Maker 2.0 de Faniot](https://faniot.com.ar/producto-kitmaker2-0).

---

## Arquitectura

- **Hardware:** ESP32 (Firmware en C++ / PlatformIO).
- **Backend:** Supabase (Base de datos PostgreSQL + API Realtime).
- **Frontend:** Next.js (Dashboard público/privado accesible desde cualquier lugar).

---

## Configuración y Seguridad 🔐

Este proyecto utiliza un archivo `include/config.h` para las credenciales de la nube, el cual está ignorado por Git para seguridad.

### Pasos para configurar:

1.  Copia el archivo de ejemplo:
    ```bash
    cp firmware/include/config.h.example firmware/include/config.h
    ```
2.  Edita `firmware/include/config.h` con tus credenciales de Supabase:
    - **Supabase:** Tu `URL` y `Service Role Key` (sacada de Settings -> API).

### Configuración WiFi (Dinámica) 🌐

Ya **no es necesario** escribir tu SSID y Password en el código. El firmware utiliza **WiFiManager**:

1.  Al encender la placa por primera vez (o si no encuentra red), el ESP32 creará un punto de acceso llamado `FANIOT-SETUP`.
2.  Conéctate a esa red desde tu celular o PC.
3.  Se abrirá automáticamente un portal de configuración (si no, ve a `192.168.4.1`).
4.  Selecciona tu red WiFi local, ingresa la contraseña y guarda.
5.  La placa se reiniciará y quedará conectada permanentemente.

---

## Hardware y Periféricos

- **Sensores:** HTU21DF (Temperatura y Humedad).
- **Actuadores locales:**
  - Pantalla OLED SSD1306 (Estado del sistema).
  - 4 NeoPixels (Indicador visual de ambiente).
  - Buzzer (Feedback sonoro).
- **Botones físicos:** GPIO0, GPIO15 y GPIO13 (Control del contador).

---

## Desarrollo (Firmware)

### Compilar y Subir

```bash
# Instalar dependencias y compilar
pio run

# Subir firmware al ESP32
pio run --target upload

# Monitorear salida serial
pio device monitor
```

---

## Estructura del Proyecto

```
faniot/
├── firmware/
│   ├── include/
│   │   ├── config.h.example  # Plantilla para Supabase (USAR ESTA)
│   │   └── config.h          # Tu configuración real (IGNORADO POR GIT)
│   ├── src/
│   │   └── main.cpp          # Lógica principal del firmware (WiFiManager + Supabase)
│   └── platformio.ini        # Configuración de PlatformIO y librerías
├── web/
│   ├── src/                  # Código Next.js (Dashboard y Control)
│   └── package.json          # Dependencias del frontend
└── README.md                 # Este archivo
```

---

## Notas de Implementación

- **Reporte:** El ESP32 envía datos cada 30 segundos de forma periódica y al instante cuando se detecta una pulsación de botón.
- **Seguridad:** Los datos se envían vía HTTPS a la API REST de Supabase.
- **Feedback Visual:** Los NeoPixels animan su brillo según la humedad y su color según la temperatura: Azul (Frío) → Verde (Ideal) → Rojo (Caliente).
