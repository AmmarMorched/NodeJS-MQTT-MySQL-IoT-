const express = require('express'); // framework web pour NodeJS
const mqtt = require('mqtt');// ib mqtt pour nodeJS
const app = express();// instance d'Express app
const axios = require('axios');// bib pour l'affectation des requette HTTP
const port = 8090;
// definition des valeur de tem et humiditée 
let temperatureValue = '';
let humidityValue = '';
// MQTT broker connection options
const controlTopic = 'control'; // definition de topic
const mqttOptions = { // config du MQTT
    host: 'broker.emqx.io',
    port: 1883,
    clientId: 'clientId-952',
};
const mqttClient = mqtt.connect(mqttOptions); // conx au broker

// Define a route to control the LED state
app.get('/control/:state', (req, res) => {
    const ledState = req.params.state === '1' ? '1' : '0';
    mqttClient.publish(controlTopic, ledState, { qos: 1, retain: true });
    console.log(`Published LED state to ${controlTopic}: ${ledState}`);
    res.send(`LED state set to ${ledState}`);
});



// Handle MQTT connection and subscribe to dhtservo and dhtservo2
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('dhtservo');
    mqttClient.subscribe('dhtservo2');
});


// Handle MQTT message reception
//ken weslou message mn les topic les valeur ya3mllhm mise a jour w yaffichihm 
mqttClient.on('message', (topic, message) => {
    if (topic === 'dhtservo') {
        temperatureValue = message.toString();
        console.log('Received Temperature Value:', temperatureValue);
    } else if (topic === 'dhtservo2') {
        humidityValue = message.toString();
        console.log('Received Humidity Value:', humidityValue);
    }
});

// Define a route to display the received temperature and humidity values
app.get('/', (req, res) => {
    //res.send(`Temperature Value: ${temperatureValue}, Humidity Value: ${humidityValue}`);
    res.send(`${temperatureValue},${humidityValue}`);
});

/* app.get('/getValue2', (req, res) => {
    axios.get(interfaceMiot)
                .then(response => {
                    // Log the received value to the console
                    const receivedValues = response.data;
                    console.log(receivedValues);
                })
    });
 */
// demarrer le serveurcsur port 8090
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

