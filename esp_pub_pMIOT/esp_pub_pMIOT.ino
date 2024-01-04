#include "DHTesp.h"
#include <PubSubClient.h>
#include <WiFi.h>
const int DHT_PIN = 27;
static char strTemperature[10] = {0}; //==>stocker la valeur du temperature
static char strHumidity[10] = {0}; //==> stocker la valeur de humiditée 

DHTesp dhtSensor; //==>instance de dhtsensor
char clientId[50];//==> pour stocker le MQTT client id

//1-declarer le topic
#define TOPIC_PUBLISH_TEMPERATURE "dhtservo"
#define TOPIC_PUBLISH_HUMIDITY "dhtservo2"


//2-configuration du point d accés WIFI
const char* ssid = "laptopwiss";
const char* password = "wissemA1";

//3-configuration du broker EMQX PORT 1883
const char* mqttServer = "broker.emqx.io";
int port = 1883;

//4-configuration d un clien mqtt (publisher)
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long publishUpdate;
#define PUBLISH_DELAY 2000  //envoi chaque 2s

void setup() {
  Serial.begin(115200);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT11); //=>setup de DHTsensor
  initWiFi();// ==> 5-initialisation du wifi
  initMQTT();// ==> 6-initialisation du broker mqtt
}

void initWiFi(void)
{
  delay(10);
  Serial.println("------cnx WI-FI------");
  Serial.print("Cnx ready: ");
  Serial.println(ssid);
  Serial.println("ok");
  reconnectWiFi();// ==> reconnection en cas de perte de connexion
}

void initMQTT(void) // ==> configurer le port et le serveur pour le client 
{
  client.setServer(mqttServer, port); 
}

//en cas de probleme de connexion  
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    long r = random(1000);
    sprintf(clientId, "clientId-%ld", r);
    if (client.connect(clientId)) {
      Serial.print(clientId);
      Serial.println(" connected");
      //client.subscribe("topicName/led");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

//en cas de probleme de connection MQTT ou wifi 
void checkWiFIAndMQTT(void)
{
  if (!client.connected())
    reconnectMQTT(); 
    reconnectWiFi(); 
}
//en cas de probléme de connection wifi
void reconnectWiFi(void)
{
  if (WiFi.status() == WL_CONNECTED)
    return;

  WiFi.begin(ssid, password); // Conecta na rede WI-FI

  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Cnx success ");
  Serial.print(ssid);
  Serial.println("IP adresse: ");
  Serial.println(WiFi.localIP());
}


void loop() {
  //lire les valeurs temp et hum
 TempAndHumidity  data = dhtSensor.getTempAndHumidity();
  //si la valeur actuelle "millis" depasse  un delay de 2s"publishUpdate" on fait un update
  if ((millis() - publishUpdate) >= PUBLISH_DELAY) { //millis() fonction tab3th l temp mt3 l'execution de programme ml louwel en milliseconde 
    publishUpdate = millis();// stocker l moment ween e5er donnée a etait publier fwest publishUpdate
    //verifier la connexion avant l envoie
    checkWiFIAndMQTT();

    // convertir la valeur de float en chaine 
    sprintf(strTemperature, "%.2f", data.temperature);// transformer la valeur float en string "%.2f ya3ni 2 chiffre ba3d l virgule"
    Serial.print(strTemperature);// yaffichi l valeur mt3 strTemperature li deja 7awelnaha l string
   sprintf(strHumidity, "%.2f", data.humidity);
      Serial.print(strHumidity);
    // envoie de la valeur vers le topic MQTT
    client.publish(TOPIC_PUBLISH_TEMPERATURE, strTemperature); // ya3th les valeur ll MQTT topic
    client.publish(TOPIC_PUBLISH_HUMIDITY, strHumidity);

   //handle mqtt communication
    client.loop();
  } 
}
