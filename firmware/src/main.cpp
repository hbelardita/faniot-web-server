#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <EEPROM.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Adafruit_HTU21DF.h"
#include <Adafruit_NeoPixel.h>

#include "config.h"

// === CONFIGURACIÓN SUPABASE ===
const char *supabaseUrl = SUPABASE_URL;
const char *supabaseKey = SUPABASE_KEY; 
// ==============================

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
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASSWORD;

// Crear objetos
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

// Timing para reporte a Supabase
unsigned long ultimoReporteSupabase = 0;
const long intervaloReporte = 30000; 

// Timing para escucha de comandos (Polling)
unsigned long ultimaEscuchaComandos = 0;
const long intervaloEscucha = 5000; // Revisar comandos cada 5 segundos

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

// Prototipos de funciones
void leerSensor();
void actualizarContador(int delta);
void guardarContadorEEPROM();
void cargarContadorEEPROM();
void actualizarOLED();
void sonarBuzzer(int tipo);
void actualizarNeoPixels();
void enviarDatosSupabase();
void recibirComandosSupabase();

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== Faniot: IoT Bidireccional ===");

  if (!htu.begin()) {
    Serial.println("Error: HTU21DF no encontrado!");
    while (1) delay(1000);
  }

  WiFi.begin(ssid, password);
  Serial.print("Conectando a Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n¡Conectado!");

  pinMode(PIN_BOTON_INC, INPUT_PULLUP);
  pinMode(PIN_BOTON_DEC, INPUT_PULLUP);
  pinMode(PIN_BOTON_RESET, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pixels.begin();
  pixels.setBrightness(80);
  pixels.clear();
  pixels.show();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED no encontrado!");
  } else {
    display.display();
    delay(1000);
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
  }

  EEPROM.begin(4);
  cargarContadorEEPROM();

  leerSensor();
  actualizarOLED();
  enviarDatosSupabase();
}

void loop()
{
  // Detectar botones físicos (Lógica Local)
  bool estadoActualInc = digitalRead(PIN_BOTON_INC);
  bool estadoActualDec = digitalRead(PIN_BOTON_DEC);
  bool estadoActualReset = digitalRead(PIN_BOTON_RESET);

  if (estadoAnteriorInc == HIGH && estadoActualInc == LOW) {
    actualizarContador(1);
    sonarBuzzer(1);
    enviarDatosSupabase();
  }
  if (estadoAnteriorDec == HIGH && estadoActualDec == LOW) {
    actualizarContador(-1);
    sonarBuzzer(1);
    enviarDatosSupabase();
  }
  if (estadoAnteriorReset == HIGH && estadoActualReset == LOW) {
    actualizarContador(-contadorSemillas);
    sonarBuzzer(2);
    enviarDatosSupabase();
  }

  estadoAnteriorInc = estadoActualInc;
  estadoAnteriorDec = estadoActualDec;
  estadoAnteriorReset = estadoActualReset;

  unsigned long tiempoActual = millis();

  // Polling de comandos desde la Web
  if (tiempoActual - ultimaEscuchaComandos >= intervaloEscucha) {
    ultimaEscuchaComandos = tiempoActual;
    recibirComandosSupabase();
  }

  // Lectura periódica de sensores
  if (tiempoActual - ultimaLectura >= intervaloLectura) {
    ultimaLectura = tiempoActual;
    leerSensor();
    actualizarOLED();
  }

  // Reporte periódico a la nube
  if (tiempoActual - ultimoReporteSupabase >= intervaloReporte) {
    ultimoReporteSupabase = tiempoActual;
    enviarDatosSupabase();
  }

  // Animación NeoPixels
  if (tiempoActual - ultimaActualizacionLED >= intervaloLED) {
    ultimaActualizacionLED = tiempoActual;
    actualizarNeoPixels();
  }
}

void recibirComandosSupabase()
{
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // Pedir el comando más viejo no ejecutado
    String apiPath = String(supabaseUrl) + "/rest/v1/comandos?ejecutado=eq.false&order=created_at.asc&limit=1";
    
    http.begin(apiPath);
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));

    int httpResponseCode = http.GET();

    if (httpResponseCode == 200) {
      String response = http.getString();
      JsonDocument doc;
      deserializeJson(doc, response);

      if (doc.size() > 0) {
        int id = doc[0]["id"];
        const char* accion = doc[0]["accion"];
        int valor = doc[0]["valor"];

        Serial.print("Comando recibido: "); Serial.println(accion);

        // EJECUTAR ACCIÓN FÍSICA
        if (strcmp(accion, "sumar") == 0) {
          actualizarContador(valor);
          sonarBuzzer(1);
        } else if (strcmp(accion, "restar") == 0) {
          actualizarContador(-valor);
          sonarBuzzer(1);
        } else if (strcmp(accion, "resetear") == 0) {
          actualizarContador(-contadorSemillas);
          sonarBuzzer(2);
        }

        // MARCAR COMO EJECUTADO (PATCH)
        String patchPath = String(supabaseUrl) + "/rest/v1/comandos?id=eq." + String(id);
        http.begin(patchPath);
        http.addHeader("apikey", supabaseKey);
        http.addHeader("Authorization", "Bearer " + String(supabaseKey));
        http.addHeader("Content-Type", "application/json");
        
        String patchBody = "{\"ejecutado\": true}";
        int patchResponseCode = http.PATCH(patchBody);
        
        Serial.print("Comando marcado como ejecutado. Status: "); Serial.println(patchResponseCode);
        
        // Reportar el nuevo estado de semillas inmediatamente
        enviarDatosSupabase();
        actualizarOLED();
      }
    }
    http.end();
  }
}

void enviarDatosSupabase()
{
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String apiPath = String(supabaseUrl) + "/rest/v1/lecturas";
    http.begin(apiPath);
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal");

    JsonDocument doc;
    doc["temperatura"] = (int)(temperatura * 10) / 10.0;
    doc["humedad"] = (int)(humedad * 10) / 10.0;
    doc["semillas"] = contadorSemillas;

    String requestBody;
    serializeJson(doc, requestBody);
    int httpResponseCode = http.POST(requestBody);
    http.end();
  }
}

void actualizarContador(int delta) {
  contadorSemillas += delta;
  if (contadorSemillas < 0) contadorSemillas = 0;
  guardarContadorEEPROM();
}

void guardarContadorEEPROM() {
  EEPROM.put(DIR_EEPROM, contadorSemillas);
  EEPROM.commit();
}

void cargarContadorEEPROM() {
  EEPROM.get(DIR_EEPROM, contadorSemillas);
  if (contadorSemillas < 0) contadorSemillas = 0;
}

void leerSensor() {
  temperatura = htu.readTemperature();
  humedad = htu.readHumidity();
}

void actualizarOLED() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.println("FANIOT CLOUD CONTROL");
  display.setTextSize(2);
  display.print("T:"); display.print(temperatura, 1); display.println("C");
  display.print("H:"); display.print(humedad, 1); display.println("%");
  display.setTextSize(1);
  display.print("Semillas: "); display.print(contadorSemillas);
  display.setCursor(0, 56);
  display.print("Status: Bidirectional");
  display.display();
}

void sonarBuzzer(int tipo) {
  if (tipo == 1) tone(PIN_BUZZER, 1000, 100);
  else if (tipo == 2) {
    for (int i = 0; i < 3; i++) {
      tone(PIN_BUZZER, 1500, 100);
      delay(150);
    }
  }
}

void actualizarNeoPixels() {
  uint8_t r = 0, g = 0, b = 0;
  if (temperatura < 15.0) { r = 0; g = 0; b = 255; }
  else if (temperatura < 20.0) { float t = (temperatura - 15.0) / 5.0; r = 0; g = (uint8_t)(255 * t); b = (uint8_t)(255 * (1.0 - t)); }
  else if (temperatura < 25.0) { r = 0; g = 255; b = 0; }
  else if (temperatura < 30.0) { float t = (temperatura - 25.0) / 5.0; r = (uint8_t)(255 * t); g = (uint8_t)(255 * (1.0 - t)); b = 0; }
  else { r = 255; g = 0; b = 0; }
  float breathPhase = (sin(millis() / 1500.0 * PI) + 1.0) / 2.0;
  float humBrightness = 0.3 + 0.7 * (constrain(humedad, 0.0f, 100.0f) / 100.0);
  float finalBrightness = humBrightness * (0.6 + 0.4 * breathPhase);
  for (int i = 0; i < NUM_NEOPIXELS; i++) { pixels.setPixelColor(i, pixels.Color((uint8_t)(r * finalBrightness), (uint8_t)(g * finalBrightness), (uint8_t)(b * finalBrightness))); }
  pixels.show();
}
