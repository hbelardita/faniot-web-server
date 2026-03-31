#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <EEPROM.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Adafruit_HTU21DF.h"
#include <Adafruit_NeoPixel.h>

// Configuración OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Configuración del buzzer
const int PIN_BUZZER = 12;

// Configuración NeoPixels
const int PIN_NEOPIXEL = 27;
const int NUM_NEOPIXELS = 4;
Adafruit_NeoPixel pixels(NUM_NEOPIXELS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);

// Configuración de la red Wi-Fi
const char *ssid = "hdb";             // Cambia por tu red Wi-Fi
const char *password = "paraguay900"; // Cambia por tu contraseña

// Crear objetos
WebServer server(80); // Servidor web en puerto 80
Adafruit_HTU21DF htu = Adafruit_HTU21DF();

// Configuración de pines para botones
const int PIN_BOTON_INC = 0;    // GPIO0 - Incrementar
const int PIN_BOTON_DEC = 15;   // GPIO15 - Decrementar
const int PIN_BOTON_RESET = 13; // GPIO13 - Reset

// Variables globales para los sensores
float temperatura = 0.0;
float humedad = 0.0;
unsigned long ultimaLectura = 0;
const long intervaloLectura = 2000;

// Timing para animación NeoPixel
unsigned long ultimaActualizacionLED = 0;
const long intervaloLED = 50;

// Contador de semillas
int contadorSemillas = 0;
const int DIR_EEPROM = 0;

// Estado anterior de botones para detectar flancos
bool estadoAnteriorInc = HIGH;
bool estadoAnteriorDec = HIGH;
bool estadoAnteriorReset = HIGH;

void leerSensor();
void manejarPaginaPrincipal();
void manejarDatos();
void manejarAPI();
void manejarNoEncontrado();
String generarPaginaHTML();
String generarPaginaDatos();
void manejarSemillas();
void actualizarContador(int delta);
void guardarContadorEEPROM();
void cargarContadorEEPROM();
void actualizarOLED();
void sonarBuzzer(int tipo);
void actualizarNeoPixels();

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== Servidor Web ESP32 + HTU21DF ===");

  // Inicializar el sensor HTU21DF
  if (!htu.begin())
  {
    Serial.println("Error: HTU21DF no encontrado!");
    while (1)
    {
      delay(1000);
    }
  }
  Serial.println("Sensor HTU21DF inicializado correctamente");

  // Conectar a Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a Wi-Fi");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("¡Conectado a Wi-Fi!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());

  // Inicializar botones como entrada con pull-up
  pinMode(PIN_BOTON_INC, INPUT_PULLUP);
  pinMode(PIN_BOTON_DEC, INPUT_PULLUP);
  pinMode(PIN_BOTON_RESET, INPUT_PULLUP);

  // Inicializar buzzer
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Inicializar NeoPixels
  pixels.begin();
  pixels.setBrightness(80);
  pixels.clear();
  pixels.show();
  Serial.println("NeoPixels inicializados (4 LEDs en GPIO27)");

  // Inicializar OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
  {
    Serial.println("OLED no encontrado!");
  }
  else
  {
    display.display();
    delay(1000);
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    Serial.println("OLED inicializado correctamente");
  }

  // Inicializar EEPROM y cargar contador
  EEPROM.begin(4);
  cargarContadorEEPROM();
  Serial.println("Contador de semillas: " + String(contadorSemillas));

  // Configurar rutas del servidor web
  server.on("/", manejarPaginaPrincipal);
  server.on("/datos", manejarDatos);
  server.on("/api", manejarAPI);
  server.on("/semillas", manejarSemillas);
  server.on("/semillas/inc", []()
            {
    actualizarContador(1);
    server.send(200, "text/plain", "OK"); });
  server.on("/semillas/dec", []()
            {
    actualizarContador(-1);
    server.send(200, "text/plain", "OK"); });
  server.on("/semillas/reset", []()
            {
    actualizarContador(-contadorSemillas);
    server.send(200, "text/plain", "OK"); });
  server.on("/semillas/add", []()
            {
    if (server.hasArg("c"))
    {
      int cantidad = server.arg("c").toInt();
      if (cantidad > 0)
      {
        actualizarContador(cantidad);
        sonarBuzzer(1);
      }
    }
    server.send(200, "text/plain", "OK"); });
  server.onNotFound(manejarNoEncontrado);

  // Iniciar servidor
  server.begin();
  Serial.println("Servidor web iniciado");
  Serial.println("Abre tu navegador y ve a: http://" + WiFi.localIP().toString());

  // Primera lectura del sensor
  leerSensor();
}

void loop()
{
  // Manejar peticiones del servidor web
  server.handleClient();

  // Detectar botones con debounce
  bool estadoActualInc = digitalRead(PIN_BOTON_INC);
  bool estadoActualDec = digitalRead(PIN_BOTON_DEC);
  bool estadoActualReset = digitalRead(PIN_BOTON_RESET);

  // Detectar flanco de HIGH a LOW (botón presionado)
  if (estadoAnteriorInc == HIGH && estadoActualInc == LOW)
  {
    actualizarContador(1);
    sonarBuzzer(1);
    Serial.println("Botón + presionado. Semillas: " + String(contadorSemillas));
  }
  if (estadoAnteriorDec == HIGH && estadoActualDec == LOW)
  {
    actualizarContador(-1);
    sonarBuzzer(1);
    Serial.println("Botón - presionado. Semillas: " + String(contadorSemillas));
  }
  if (estadoAnteriorReset == HIGH && estadoActualReset == LOW)
  {
    actualizarContador(-contadorSemillas);
    sonarBuzzer(2);
    Serial.println("Botón RESET presionado. Contador reseteado");
  }

  // Actualizar estados anteriores
  estadoAnteriorInc = estadoActualInc;
  estadoAnteriorDec = estadoActualDec;
  estadoAnteriorReset = estadoActualReset;

  // Leer sensor periódicamente
  unsigned long tiempoActual = millis();
  if (tiempoActual - ultimaLectura >= intervaloLectura)
  {
    ultimaLectura = tiempoActual;
    leerSensor();
    actualizarOLED();
  }

  // Actualizar NeoPixels (frecuente para animación suave)
  if (tiempoActual - ultimaActualizacionLED >= intervaloLED)
  {
    ultimaActualizacionLED = tiempoActual;
    actualizarNeoPixels();
  }
}

// Funciones para el contador de semillas
void actualizarContador(int delta)
{
  contadorSemillas += delta;
  if (contadorSemillas < 0)
    contadorSemillas = 0;
  guardarContadorEEPROM();
}

void guardarContadorEEPROM()
{
  EEPROM.put(DIR_EEPROM, contadorSemillas);
  EEPROM.commit();
}

void cargarContadorEEPROM()
{
  EEPROM.get(DIR_EEPROM, contadorSemillas);
  if (contadorSemillas < 0)
    contadorSemillas = 0;
}

// Página de semillas
void manejarSemillas()
{
  String html = "<!DOCTYPE html>";
  html += "<html lang='es'>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Contador de Semillas</title>";
  html += "<style>";
  html += "body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #f5f5dc, #e8e8d0); }";
  html += ".container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; }";
  html += ".header { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; padding: 25px; text-align: center; }";
  html += ".header h1 { margin: 0; font-size: 2em; }";
  html += ".content { padding: 40px; text-align: center; }";
  html += ".counter { font-size: 5em; font-weight: bold; color: #5D4037; margin: 20px 0; }";
  html += ".btn { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; border: none; padding: 15px 30px; margin: 10px; border-radius: 25px; cursor: pointer; font-size: 18px; }";
  html += ".btn:hover { transform: translateY(-2px); }";
  html += ".btn-reset { background: linear-gradient(135deg, #d32f2f, #b71c1c); }";
  html += ".input-group { margin: 20px 0; }";
  html += ".input-group input { padding: 12px; font-size: 16px; border: 2px solid #8B4513; border-radius: 10px; width: 100px; text-align: center; }";
  html += ".input-group label { font-size: 16px; color: #5D4037; margin-right: 10px; }";
  html += ".back-link { display: block; margin-top: 20px; color: #8B4513; text-decoration: none; }";
  html += "</style>";
  html += "</head>";
  html += "<body>";
  html += "<div class='container'>";
  html += "<div class='header'><h1>Almacén de Semillas</h1></div>";
  html += "<div class='content'>";
  html += "<h2>Contador de Semillas</h2>";
  html += "<div class='counter'>" + String(contadorSemillas) + "</div>";
  html += "<button class='btn' onclick='fetch(\"/semillas/inc\").then(()=>location.reload())'>+1 Semilla</button>";
  html += "<button class='btn' onclick='fetch(\"/semillas/dec\").then(()=>location.reload())'>-1 Semilla</button>";
  html += "<div class='input-group'>";
  html += "<label>Cantidad:</label>";
  html += "<input type='number' id='cantidad' value='10' min='1'> ";
  html += "<button class='btn' onclick='cant=document.getElementById(\"cantidad\").value; fetch(\"/semillas/add?c=\"+cant).then(()=>location.reload())'>Agregar</button>";
  html += "</div>";
  html += "<button class='btn btn-reset' onclick='fetch(\"/semillas/reset\").then(()=>location.reload())'>Resetear</button>";
  html += "<a href='/' class='back-link'>← Volver al inicio</a>";
  html += "</div></div>";
  html += "</body>";
  html += "</html>";
  server.send(200, "text/html", html);
}

// Función para leer el sensor HTU21DF
void leerSensor()
{
  temperatura = htu.readTemperature();
  humedad = htu.readHumidity();

  // Mostrar en Serial Monitor
  Serial.println("--- Lectura del Sensor ---");
  Serial.print("Temperatura: ");
  Serial.print(temperatura, 1);
  Serial.println(" °C");
  Serial.print("Humedad: ");
  Serial.print(humedad, 1);
  Serial.println(" %");
  Serial.println();
}

// Página principal del servidor web
void manejarPaginaPrincipal()
{
  String html = generarPaginaHTML();
  server.send(200, "text/html", html);
}

// Página de datos en tiempo real
void manejarDatos()
{
  String html = generarPaginaDatos();
  server.send(200, "text/html", html);
}

// API para obtener datos en formato JSON
void manejarAPI()
{
  String json = "{";
  json += "\"temperatura\":" + String(temperatura, 1) + ",";
  json += "\"humedad\":" + String(humedad, 1) + ",";
  json += "\"semillas\":" + String(contadorSemillas) + ",";
  json += "\"timestamp\":" + String(millis()) + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
  json += "}";

  server.send(200, "application/json", json);
}

// Manejar páginas no encontradas
void manejarNoEncontrado()
{
  String mensaje = "Página no encontrada\n\n";
  mensaje += "Rutas disponibles:\n";
  mensaje += "/ - Página principal\n";
  mensaje += "/datos - Datos en tiempo real\n";
  mensaje += "/api - API JSON\n";

  server.send(404, "text/plain", mensaje);
}

// Generar HTML de la página principal (estilo AirLive SmartCube)
String generarPaginaHTML()
{
  String html = "<!DOCTYPE html>";
  html += "<html lang='es'>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>ESP32 Environmental Monitor</title>";
  html += "<style>";
  html += "body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #f0f8f0, #e8f5e8); }";
  html += ".main-container { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; }";
  html += ".header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 25px; text-align: center; }";
  html += ".header h1 { margin: 0; font-size: 2.2em; font-weight: 300; }";
  html += ".header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }";
  html += ".content { padding: 40px; }";
  html += ".display-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 30px; }";
  html += ".sensor-display { background: linear-gradient(135deg, #c8e6c9, #a5d6a7); border: 3px solid #4CAF50; border-radius: 20px; padding: 30px; text-align: center; position: relative; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }";
  html += ".sensor-display.semillas { background: linear-gradient(135deg, #ffe0b2, #ffcc80); border: 3px solid #ff9800; }";
  html += ".sensor-display.semillas .sensor-icon { background: #fff3e0; }";
  html += ".sensor-display.semillas .sensor-label { color: #e65100; }";
  html += ".sensor-display.semillas .sensor-value { color: #bf360c; }";
  html += ".sensor-display.semillas .sensor-unit { color: #f57c00; }";
  html += ".sensor-icon { width: 60px; height: 60px; margin: 0 auto 15px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }";
  html += ".sensor-label { font-size: 1.3em; color: #2e7d32; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }";
  html += ".sensor-value { font-size: 3.5em; font-weight: bold; color: #1b5e20; margin: 15px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }";
  html += ".sensor-unit { font-size: 0.7em; color: #388e3c; vertical-align: top; margin-left: 5px; }";
  html += ".status-indicator { position: absolute; top: 15px; right: 15px; width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; animation: pulse 2s infinite; }";
  html += "@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }";
  html += ".controls { text-align: center; margin: 30px 0; }";
  html += ".btn { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; padding: 15px 25px; margin: 0 10px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.3s; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }";
  html += ".btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4); }";
  html += ".system-info { background: linear-gradient(135deg, #f1f8e9, #e8f5e8); border: 2px solid #c8e6c9; border-radius: 15px; padding: 25px; margin-top: 30px; }";
  html += ".system-info h3 { color: #2e7d32; margin-top: 0; font-size: 1.4em; }";
  html += ".info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }";
  html += ".info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c8e6c9; }";
  html += ".info-label { color: #388e3c; font-weight: 500; }";
  html += ".info-value { color: #1b5e20; font-weight: bold; }";
  html += "@media (max-width: 768px) { .display-grid, .info-grid { grid-template-columns: 1fr; } .sensor-display { padding: 20px; } .sensor-value { font-size: 2.8em; } }";
  html += "</style>";
  html += "<script>";
  html += "setInterval(function(){ location.reload(); }, 30000);"; // Auto-refresh cada 30 segundos
  html += "</script>";
  html += "</head>";
  html += "<body>";

  html += "<div class='main-container'>";
  html += "<div class='header'>";
  html += "<h1>Environmental Monitor</h1>";
  html += "<p>ESP32 + HTU21DF Sensor Station</p>";
  html += "</div>";

  html += "<div class='content'>";
  html += "<div class='display-grid'>";

  // Display de Temperatura (estilo AirLive)
  html += "<div class='sensor-display'>";
  html += "<div class='status-indicator'></div>";
  html += "<div class='sensor-icon'>🌡️</div>";
  html += "<div class='sensor-label'>Temperatura</div>";
  html += "<div class='sensor-value'>" + String(temperatura, 1) + "<span class='sensor-unit'>°C</span></div>";
  html += "</div>";

  // Display de Humedad (estilo AirLive)
  html += "<div class='sensor-display'>";
  html += "<div class='status-indicator'></div>";
  html += "<div class='sensor-icon'>💧</div>";
  html += "<div class='sensor-label'>Humedad</div>";
  html += "<div class='sensor-value'>" + String(humedad, 1) + "<span class='sensor-unit'>%</span></div>";
  html += "</div>";

  // Display de Semillas
  html += "<div class='sensor-display semillas'>";
  html += "<div class='status-indicator'></div>";
  html += "<div class='sensor-icon'>🌱</div>";
  html += "<div class='sensor-label'>Semillas</div>";
  html += "<div class='sensor-value'>" + String(contadorSemillas) + "<span class='sensor-unit'>ud</span></div>";
  html += "</div>";

  html += "</div>";

  // Controles
  html += "<div class='controls'>";
  html += "<button class='btn' onclick='location.reload()'>🔄 Actualizar</button>";
  html += "<button class='btn' onclick='window.open(\"/semillas\", \"_blank\")'>🌱 Semillas</button>";
  html += "<button class='btn' onclick='window.open(\"/datos\", \"_blank\")'>📊 Tiempo Real</button>";
  html += "<button class='btn' onclick='window.open(\"/api\", \"_blank\")'>📡 API</button>";
  html += "</div>";

  // Información del sistema
  html += "<div class='system-info'>";
  html += "<h3>📋 Información del Sistema</h3>";
  html += "<div class='info-grid'>";
  html += "<div class='info-item'><span class='info-label'>Dirección IP:</span><span class='info-value'>" + WiFi.localIP().toString() + "</span></div>";
  html += "<div class='info-item'><span class='info-label'>Red Wi-Fi:</span><span class='info-value'>" + String(ssid) + "</span></div>";
  html += "<div class='info-item'><span class='info-label'>Tiempo Activo:</span><span class='info-value'>" + String(millis() / 1000) + " seg</span></div>";
  html += "<div class='info-item'><span class='info-label'>Última Lectura:</span><span class='info-value'>" + String(ultimaLectura / 1000) + " seg</span></div>";
  html += "</div>";
  html += "</div>";

  html += "</div>";
  html += "</div>";
  html += "</body>";
  html += "</html>";

  return html;
}

// Generar página de datos en tiempo real
String generarPaginaDatos()
{
  String html = "<!DOCTYPE html>";
  html += "<html lang='es'>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Datos en Tiempo Real - HTU21DF</title>";
  html += "<meta http-equiv='refresh' content='3'>";
  html += "<style>";
  html += "body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #1a1a1a; color: #00ff00; }";
  html += ".terminal { background: #000; padding: 20px; border-radius: 5px; border: 2px solid #00ff00; }";
  html += ".data-line { margin: 10px 0; font-size: 18px; }";
  html += ".timestamp { color: #ffff00; }";
  html += ".value { color: #00ffff; font-weight: bold; }";
  html += "</style>";
  html += "</head>";
  html += "<body>";

  html += "<div class='terminal'>";
  html += "<h2>═══ MONITOR HTU21DF - TIEMPO REAL ═══</h2>";
  html += "<div class='data-line'>Actualización automática cada 3 segundos...</div>";
  html += "<div class='data-line'>═══════════════════════════════════════</div>";
  html += "<div class='data-line'>Timestamp: <span class='timestamp'>" + String(millis() / 1000) + " seg</span></div>";
  html += "<div class='data-line'>Temperatura: <span class='value'>" + String(temperatura, 2) + " °C</span></div>";
  html += "<div class='data-line'>Humedad: <span class='value'>" + String(humedad, 2) + " %</span></div>";
  html += "<div class='data-line'>IP ESP32: <span class='value'>" + WiFi.localIP().toString() + "</span></div>";
  html += "<div class='data-line'>Red Wi-Fi: <span class='value'>" + String(ssid) + "</span></div>";
  html += "<div class='data-line'>═══════════════════════════════════════</div>";
  html += "<div class='data-line'><a href='/' style='color: #00ff00;'>← Volver al inicio</a></div>";
  html += "</div>";

  html += "</body>";
  html += "</html>";

  return html;
}

// Actualizar pantalla OLED
void actualizarOLED()
{
  display.clearDisplay();
  display.setCursor(0, 0);

  display.setTextSize(1);
  display.println("ALMACEN SEMILLAS");

  display.setTextSize(2);
  display.print("T:");
  display.print(temperatura, 1);
  display.println("C");

  display.print("H:");
  display.print(humedad, 1);
  display.println("%");

  display.setTextSize(1);
  display.print("Sem:");
  display.print(contadorSemillas);

  display.setCursor(0, 56);
  display.print("IP:");
  display.print(WiFi.localIP().toString());

  display.display();
}

// Función para sonar el buzzer
void sonarBuzzer(int tipo)
{
  if (tipo == 1)
  {
    tone(PIN_BUZZER, 1000, 100);
  }
  else if (tipo == 2)
  {
    for (int i = 0; i < 3; i++)
    {
      tone(PIN_BUZZER, 1500, 100);
      delay(150);
    }
  }
  else if (tipo == 3)
  {
    tone(PIN_BUZZER, 1000, 500);
  }
}

// Indicador ambiental con NeoPixels
// ┌─────────────────┬────────────────────────┬───────────────┐
// │  Rango Temp     │  Color                 │  RGB          │
// ├─────────────────┼────────────────────────┼───────────────┤
// │  < 15°C         │  🔵 Azul puro          │  (0, 0, 255)  │
// │  15°C - 20°C    │  🔵→🟢 Azul a Verde    │  transición   │
// │  20°C - 25°C    │  🟢 Verde puro (ideal) │  (0, 255, 0)  │
// │  25°C - 30°C    │  🟢→🔴 Verde a Rojo    │  transición   │
// │  > 30°C         │  🔴 Rojo puro          │  (255, 0, 0)  │
// └─────────────────┴────────────────────────┴───────────────┘
// Brillo: proporcional a la humedad (30%-100%)
// Animación: efecto respiración sinusoidal ~3s por ciclo
void actualizarNeoPixels()
{
  uint8_t r = 0, g = 0, b = 0;

  // Mapear temperatura a color con transiciones suaves
  if (temperatura < 15.0)
  {
    // Frío: azul puro
    r = 0; g = 0; b = 255;
  }
  else if (temperatura < 20.0)
  {
    // Azul → Verde (transición)
    float t = (temperatura - 15.0) / 5.0;
    r = 0;
    g = (uint8_t)(255 * t);
    b = (uint8_t)(255 * (1.0 - t));
  }
  else if (temperatura < 25.0)
  {
    // Ideal: verde puro
    r = 0; g = 255; b = 0;
  }
  else if (temperatura < 30.0)
  {
    // Verde → Rojo (pasando por amarillo)
    float t = (temperatura - 25.0) / 5.0;
    r = (uint8_t)(255 * t);
    g = (uint8_t)(255 * (1.0 - t));
    b = 0;
  }
  else
  {
    // Caliente: rojo puro
    r = 255; g = 0; b = 0;
  }

  // Efecto respiración: onda sinusoidal (~3 segundos por ciclo)
  float breathPhase = (sin(millis() / 1500.0 * PI) + 1.0) / 2.0;

  // Brillo base según humedad (30% en seco, 100% en húmedo)
  float humClamped = constrain(humedad, 0.0f, 100.0f);
  float humBrightness = 0.3 + 0.7 * (humClamped / 100.0);

  // Combinar: respiración modula entre 60% y 100% del brillo por humedad
  float finalBrightness = humBrightness * (0.6 + 0.4 * breathPhase);

  // Aplicar brillo final a cada componente
  uint8_t finalR = (uint8_t)(r * finalBrightness);
  uint8_t finalG = (uint8_t)(g * finalBrightness);
  uint8_t finalB = (uint8_t)(b * finalBrightness);

  for (int i = 0; i < NUM_NEOPIXELS; i++)
  {
    pixels.setPixelColor(i, pixels.Color(finalR, finalG, finalB));
  }
  pixels.show();
}
