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
const char *ssid = "";             // Cambia por tu red Wi-Fi
const char *password = ""; // Cambia por tu contraseña

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
void manejarSemillasInc();
void manejarSemillasDec();
void manejarSemillasReset();
void manejarSemillasAdd();
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
  server.on("/semillas/inc", manejarSemillasInc);
  server.on("/semillas/dec", manejarSemillasDec);
  server.on("/semillas/reset", manejarSemillasReset);
  server.on("/semillas/add", manejarSemillasAdd);
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
  html += "<title>Semillas - Faniot</title>";
  html += "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>";
  html += "<style>";
  html += ":root { --primary: #f59e0b; --primary-dark: #d97706; --danger: #ef4444; --danger-dark: #dc2626; --bg: #fefce8; --card: #ffffff; --text: #1e293b; --text-light: #64748b; --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }";
  html += "* { box-sizing: border-box; margin: 0; padding: 0; }";
  html += "body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 20px; }";
  html += ".container { max-width: 600px; margin: 0 auto; }";
  html += ".header { text-align: center; margin-bottom: 40px; }";
  html += ".header h1 { font-size: 2rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px; }";
  html += ".card { background: var(--card); border-radius: 24px; padding: 48px 32px; text-align: center; box-shadow: var(--shadow); }";
  html += ".counter { font-size: 6rem; font-weight: 700; color: var(--primary); line-height: 1; margin: 24px 0; }";
  html += ".label { font-size: 1rem; font-weight: 600; color: var(--text-light); text-transform: uppercase; letter-spacing: 2px; }";
  html += ".actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 32px 0; }";
  html += ".btn { padding: 16px 28px; border: none; border-radius: 14px; font-family: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }";
  html += ".btn-inc { background: var(--primary); color: white; }";
  html += ".btn-inc:hover { background: var(--primary-dark); transform: translateY(-2px); }";
  html += ".btn-dec { background: #fbbf24; color: white; }";
  html += ".btn-dec:hover { background: #f59e0b; transform: translateY(-2px); }";
  html += ".btn-reset { background: var(--danger); color: white; }";
  html += ".btn-reset:hover { background: var(--danger-dark); transform: translateY(-2px); }";
  html += ".input-group { display: flex; gap: 12px; justify-content: center; align-items: center; margin: 24px 0; flex-wrap: wrap; }";
  html += ".input-group input { padding: 14px 18px; font-size: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; width: 120px; text-align: center; font-family: inherit; }";
  html += ".input-group input:focus { outline: none; border-color: var(--primary); }";
  html += ".input-group .btn { padding: 14px 24px; }";
  html += ".back-link { display: block; margin-top: 24px; color: var(--text-light); text-decoration: none; font-weight: 500; }";
  html += ".back-link:hover { color: var(--primary); }";
  html += "@media (max-width: 480px) { .counter { font-size: 4rem; } .btn { padding: 14px 20px; font-size: 0.9rem; } }";
  html += "</style>";
  html += "<script>";
  html += "setInterval(async () => { try { const r = await fetch('/api'); const d = await r.json(); document.getElementById('counter').textContent = d.semillas; } catch(e) {} }, 2000);";
  html += "</script>";
  html += "</head>";
  html += "<body>";
  html += "<div class='container'>";
  html += "<div class='header'><h1>🌱 Almacén de Semillas</h1></div>";
  html += "<div class='card'>";
  html += "<div class='label'>Total de Semillas</div>";
  html += "<div class='counter' id='counter'>" + String(contadorSemillas) + "</div>";
  html += "<div class='actions'>";
  html += "<button class='btn btn-inc' onclick='fetch(\"/semillas/inc\").then(()=>location.reload())'>+1 Semilla</button>";
  html += "<button class='btn btn-dec' onclick='fetch(\"/semillas/dec\").then(()=>location.reload())'>-1 Semilla</button>";
  html += "</div>";
  html += "<div class='input-group'>";
  html += "<input type='number' id='cantidad' value='10' min='1'>";
  html += "<button class='btn btn-inc' onclick='cant=document.getElementById(\"cantidad\").value; fetch(\"/semillas/add?c=\"+cant).then(()=>location.reload())'>Agregar</button>";
  html += "</div>";
  html += "<button class='btn btn-reset' onclick='fetch(\"/semillas/reset\").then(()=>location.reload())'>Resetear Todo</button>";
  html += "<a href='/' class='back-link'>← Volver al inicio</a>";
  html += "</div></div></body></html>";
  server.send(200, "text/html", html);
}

void manejarSemillasInc()
{
  actualizarContador(1);
  server.send(200, "text/plain", "OK");
}

void manejarSemillasDec()
{
  actualizarContador(-1);
  server.send(200, "text/plain", "OK");
}

void manejarSemillasReset()
{
  actualizarContador(-contadorSemillas);
  server.send(200, "text/plain", "OK");
}

void manejarSemillasAdd()
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
  server.send(200, "text/plain", "OK");
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

// Generar HTML de la página principal
String generarPaginaHTML()
{
  String html = "<!DOCTYPE html>";
  html += "<html lang='es'>";
  html += "<head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Faniot - Monitor Ambiental</title>";
  html += "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap' rel='stylesheet'>";
  html += "<style>";
  html += ":root { --primary: #10b981; --primary-dark: #059669; --secondary: #6366f1; --accent: #f59e0b; --danger: #ef4444; --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --text-light: #64748b; --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }";
  html += "* { box-sizing: border-box; margin: 0; padding: 0; }";
  html += "body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 20px; }";
  html += ".container { max-width: 1000px; margin: 0 auto; }";
  html += ".header { text-align: center; margin-bottom: 40px; }";
  html += ".header h1 { font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 8px; letter-spacing: -1px; }";
  html += ".header p { color: var(--text-light); font-size: 1.1rem; }";
  html += ".status-badge { display: inline-flex; align-items: center; gap: 8px; background: #d1fae5; color: var(--primary-dark); padding: 8px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-top: 16px; }";
  html += ".status-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 2s infinite; }";
  html += "@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }";
  html += ".grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }";
  html += ".card { background: var(--card); border-radius: 20px; padding: 32px 24px; text-align: center; position: relative; overflow: hidden; box-shadow: var(--shadow); transition: transform 0.3s ease, box-shadow 0.3s ease; }";
  html += ".card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px -10px rgba(0,0,0,0.15); }";
  html += ".card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }";
  html += ".card.temp::before { background: linear-gradient(90deg, #3b82f6, #06b6d4); }";
  html += ".card.hum::before { background: linear-gradient(90deg, #06b6d4, #10b981); }";
  html += ".card.seed::before { background: linear-gradient(90deg, #f59e0b, #ef4444); }";
  html += ".card-icon { width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; }";
  html += ".card.temp .card-icon { background: linear-gradient(135deg, #dbeafe, #e0f2fe); }";
  html += ".card.hum .card-icon { background: linear-gradient(135deg, #e0f2fe, #d1fae5); }";
  html += ".card.seed .card-icon { background: linear-gradient(135deg, #fef3c7, #fee2e2); }";
  html += ".card-label { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); margin-bottom: 12px; }";
  html += ".card-value { font-size: 3rem; font-weight: 700; line-height: 1; }";
  html += ".card.temp .card-value { color: #0891b2; }";
  html += ".card.hum .card-value { color: var(--primary); }";
  html += ".card.seed .card-value { color: var(--accent); }";
  html += ".card-unit { font-size: 1rem; font-weight: 500; color: var(--text-light); margin-left: 4px; }";
  html += ".card-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 20px; overflow: hidden; }";
  html += ".card-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }";
  html += ".card.temp .card-bar-fill { background: linear-gradient(90deg, #3b82f6, #06b6d4); }";
  html += ".card.hum .card-bar-fill { background: linear-gradient(90deg, #06b6d4, #10b981); }";
  html += ".card.seed .card-bar-fill { background: linear-gradient(90deg, #f59e0b, #ef4444); width: 30%; }";
  html += ".actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }";
  html += ".btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border: none; border-radius: 12px; font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; text-decoration: none; }";
  html += ".btn-primary { background: var(--primary); color: white; }";
  html += ".btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); }";
  html += ".btn-secondary { background: white; color: var(--text); border: 2px solid #e2e8f0; }";
  html += ".btn-secondary:hover { border-color: var(--primary); color: var(--primary); }";
  html += ".info-panel { background: var(--card); border-radius: 20px; padding: 28px; box-shadow: var(--shadow); }";
  html += ".info-panel h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }";
  html += ".info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }";
  html += ".info-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }";
  html += ".info-item:last-child { border-bottom: none; }";
  html += ".info-label { color: var(--text-light); font-size: 0.9rem; }";
  html += ".info-value { font-weight: 600; color: var(--text); }";
  html += "@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .header h1 { font-size: 1.8rem; } .card-value { font-size: 2.5rem; } .info-grid { grid-template-columns: 1fr; } }";
  html += "</style>";
  html += "<script>";
  html += "setInterval(async () => {";
  html += "  try { const r = await fetch('/api'); const d = await r.json();";
  html += "    document.getElementById('temp').textContent = d.temperatura.toFixed(1);";
  html += "    document.getElementById('hum').textContent = d.humedad.toFixed(1);";
  html += "    document.getElementById('seeds').textContent = d.semillas;";
  html += "    document.getElementById('sys-uptime').textContent = Math.floor(d.timestamp/1000) + ' seg';";
  html += "    document.getElementById('sys-last').textContent = Math.floor(d.timestamp/1000) + ' seg';";
  html += "  } catch(e) {} }, 2000);";
  html += "</script>";
  html += "</head>";
  html += "<body>";
  html += "<div class='container'>";
  html += "<div class='header'>";
  html += "<h1>Faniot</h1>";
  html += "<p>Monitor Ambiental ESP32</p>";
  html += "<div class='status-badge'><span class='status-dot'></span> Sistema Activo</div>";
  html += "</div>";
  html += "<div class='grid'>";
  int tempBar = constrain(temperatura * 2.5, 0, 100);
  int humBar = constrain(humedad, 0, 100);
  html += "<div class='card temp'><div class='card-icon'>🌡️</div><div class='card-label'>Temperatura</div><div class='card-value'><span id='temp'>" + String(temperatura, 1) + "</span><span class='card-unit'>°C</span></div><div class='card-bar'><div class='card-bar-fill' style='width:" + String(tempBar) + "%'></div></div></div>";
  html += "<div class='card hum'><div class='card-icon'>💧</div><div class='card-label'>Humedad</div><div class='card-value'><span id='hum'>" + String(humedad, 1) + "</span><span class='card-unit'>%</span></div><div class='card-bar'><div class='card-bar-fill' style='width:" + String(humBar) + "%'></div></div></div>";
  html += "<div class='card seed'><div class='card-icon'>🌱</div><div class='card-label'>Semillas</div><div class='card-value'><span id='seeds'>" + String(contadorSemillas) + "</span><span class='card-unit'>ud</span></div><div class='card-bar'><div class='card-bar-fill'></div></div></div>";
  html += "</div>";
  html += "<div class='actions'>";
  html += "<button class='btn btn-primary' onclick='location.reload()'>🔄 Actualizar</button>";
  html += "<button class='btn btn-secondary' onclick=\"window.open('/semillas','_blank')\">🌱 Semillas</button>";
  html += "<button class='btn btn-secondary' onclick=\"window.open('/datos','_blank')\">📊 Datos</button>";
  html += "<button class='btn btn-secondary' onclick=\"window.open('/api','_blank')\">📡 API</button>";
  html += "</div>";
  html += "<div class='info-panel'>";
  html += "<h3>📋 Información del Sistema</h3>";
  html += "<div class='info-grid'>";
  html += "<div class='info-item'><span class='info-label'>Dirección IP</span><span class='info-value' id='sys-ip'>" + WiFi.localIP().toString() + "</span></div>";
  html += "<div class='info-item'><span class='info-label'>Red Wi-Fi</span><span class='info-value' id='sys-wifi'>" + String(ssid) + "</span></div>";
  html += "<div class='info-item'><span class='info-label'>Tiempo Activo</span><span class='info-value' id='sys-uptime'>" + String(millis() / 1000) + " seg</span></div>";
  html += "<div class='info-item'><span class='info-label'>Última Lectura</span><span class='info-value' id='sys-last'>" + String(ultimaLectura / 1000) + " seg</span></div>";
  html += "</div></div>";
  html += "</div></body></html>";
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
  html += "<title>Datos en Tiempo Real - Faniot</title>";
  html += "<link href='https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap' rel='stylesheet'>";
  html += "<style>";
  html += ":root { --bg: #0f172a; --card: #1e293b; --accent: #22d3ee; --success: #4ade80; --warning: #fbbf24; --text: #e2e8f0; --text-dim: #94a3b8; }";
  html += "* { box-sizing: border-box; margin: 0; padding: 0; }";
  html += "body { font-family: 'JetBrains Mono', monospace; background: var(--bg); color: var(--text); min-height: 100vh; padding: 20px; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += ".header { text-align: center; margin-bottom: 32px; }";
  html += ".header h1 { font-size: 1.8rem; color: var(--accent); margin-bottom: 8px; letter-spacing: 2px; }";
  html += ".header p { color: var(--text-dim); font-size: 0.9rem; }";
  html += ".terminal { background: var(--card); border-radius: 16px; padding: 24px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }";
  html += ".title-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #334155; }";
  html += ".dot { width: 12px; height: 12px; border-radius: 50%; }";
  html += ".dot.red { background: #ef4444; }";
  html += ".dot.yellow { background: #fbbf24; }";
  html += ".dot.green { background: #4ade80; }";
  html += ".data-line { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; font-size: 1rem; }";
  html += ".data-line:last-of-type { border-bottom: none; }";
  html += ".data-label { color: var(--text-dim); }";
  html += ".data-value { color: var(--accent); font-weight: 600; }";
  html += ".data-value.temp { color: #38bdf8; }";
  html += ".data-value.hum { color: var(--success); }";
  html += ".data-value.seed { color: var(--warning); }";
  html += ".divider { height: 1px; background: #334155; margin: 16px 0; }";
  html += ".footer { text-align: center; margin-top: 24px; }";
  html += ".footer a { color: var(--accent); text-decoration: none; font-size: 0.9rem; }";
  html += ".footer a:hover { text-decoration: underline; }";
  html += "@media (max-width: 600px) { .data-line { flex-direction: column; gap: 4px; } }";
  html += "</style>";
  html += "<script>";
  html += "setInterval(async () => {";
  html += "  try { const r = await fetch('/api'); const d = await r.json();";
  html += "    document.getElementById('time').textContent = Math.floor(d.timestamp/1000) + ' seg';";
  html += "    document.getElementById('temp').textContent = d.temperatura.toFixed(2) + ' °C';";
  html += "    document.getElementById('hum').textContent = d.humedad.toFixed(2) + ' %';";
  html += "    document.getElementById('seeds').textContent = d.semillas;";
  html += "  } catch(e) {}";
  html += "}, 3000);";
  html += "</script>";
  html += "</head>";
  html += "<body>";
  html += "<div class='container'>";
  html += "<div class='header'><h1>═══ FANIOT MONITOR ═══</h1><p>Datos en tiempo real • Actualización cada 3s</p></div>";
  html += "<div class='terminal'>";
  html += "<div class='title-bar'><span class='dot red'></span><span class='dot yellow'></span><span class='dot green'></span></div>";
  html += "<div class='data-line'><span class='data-label'>Timestamp:</span><span class='data-value' id='time'>" + String(millis()/1000) + " seg</span></div>";
  html += "<div class='divider'></div>";
  html += "<div class='data-line'><span class='data-label'>Temperatura:</span><span class='data-value temp' id='temp'>" + String(temperatura, 2) + " °C</span></div>";
  html += "<div class='data-line'><span class='data-label'>Humedad:</span><span class='data-value hum' id='hum'>" + String(humedad, 2) + " %</span></div>";
  html += "<div class='data-line'><span class='data-label'>Contador Semillas:</span><span class='data-value seed' id='seeds'>" + String(contadorSemillas) + "</span></div>";
  html += "<div class='divider'></div>";
  html += "<div class='data-line'><span class='data-label'>IP ESP32:</span><span class='data-value'>" + WiFi.localIP().toString() + "</span></div>";
  html += "<div class='data-line'><span class='data-label'>Red Wi-Fi:</span><span class='data-value'>" + String(ssid) + "</span></div>";
  html += "<div class='footer'><a href='/'>← Volver al inicio</a></div>";
  html += "</div></div></body></html>";
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
