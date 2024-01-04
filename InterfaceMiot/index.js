const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 8091;

// Replace the following MySQL connection details with your actual values
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'serveurmiot',
});

const mysqlConnection2 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seuilmiot',
});

// Connect to MySQL 
mysqlConnection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
    } else {
        console.log('Connected to MySQL');
    }
});


// Declare dataFromDb variable
let dataFromDb;

// Define the URL of the web server on your PC
const pcServerURL = 'http://192.168.137.247:8090'; // Replace with the actual URL and port

// Serve the static files directly from node_modules
//app.use('/chartjs', express.static(path.join(__dirname, 'node_modules/chart.js/dist')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));// chemin statique
// Endpoint to get the value from the server
// Endpoint to get the value from the server
app.get('/getValue', (req, res) => {
    // Fetch the last 20 values from the database
    const query = 'SELECT * FROM tablemiot ORDER BY id DESC LIMIT 20';
    mysqlConnection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying last 20 values:', err.message);
            return res.status(500).send(`Error: ${err.message}`);
        }

        // Reverse the order to send the latest values first
        const last20Values = results.reverse();

        // Fetch the latest value from the web server on your PC
        axios.get(pcServerURL)
            .then(response => {
                // Log the received value to the console
                const receivedValues = response.data.split(',');

                // Check if the values have changed since the last insertion
                const lastInsertedValuesQuery = 'SELECT * FROM tablemiot ORDER BY id DESC LIMIT 1';
                mysqlConnection.query(lastInsertedValuesQuery, (err, lastValuesResults) => {
                    if (err) {
                        console.error('Error querying last inserted values:', err.message);
                        return res.status(500).send(`Error: ${err.message}`);
                    }

                    // Compare with the last values
                    const lastValues = lastValuesResults[0];

                    if (!lastValues || receivedValues[0] !== lastValues.temperature || receivedValues[1] !== lastValues.humidity) {
                        // Values have changed, insert into the database
                        const insertQuery = 'INSERT INTO tablemiot (temperature, humidity) VALUES (?, ?)';
                        mysqlConnection.query(insertQuery, receivedValues, (err, result) => {
                            if (err) {
                                console.error('Error inserting into MySQL:', err.message);
                                return res.status(500).send(`Error: ${err.message}`);
                            }

                            // Display the received values and last 20 values in the browser
                            res.json({ latestValue: receivedValues, last20Values });
                        });
                    } else {
                        // Values have not changed, still send the received values and last 20 values
                        res.json({ latestValue: receivedValues, last20Values });
                    }
                });
            })
            .catch(error => {
                // Display the error message if there's an issue
                console.error('Error fetching from web server:', error.message);
                res.status(500).send(`Error: ${error.message}`);
            });
    });
});

app.post("/", (req, res) => {
    const searchTerm = req.body.seuil
    if (!searchTerm) {
        res.status(400).send('seuil required');
    }
    else {
        // Fetch data from the database
        //  
        res.send(`${searchTerm}`)
        /*  fetchData(() => {
             // Render the HTML page with the fetched data
             res.sendFile(path.join(__dirname, 'index.html'));
         }); */
    };
});
/* app.get('/', (req, res) => {

    const markup = `
    <!DOCTYPE html>
    <html>
    <body>
        
<form action="/" method="post">
<label for="seuil">Seuil</label>
<input id="seuil" name="seuil" type="text" value="" placeholder="enter seuil" required />
<input type="submit" value="submit" />
</form>
    
    </body>

    </html>
    
    `
    res.send(markup)
}); */
/* app.get('/', (req, res) => {
    res.send(`${searchTerm}`)
}); */

/* app.get('/valSeuil', (req, res) => {

    const insertQuery = 'INSERT INTO tablemiot val_seuil VALUES ? ';
    mysqlConnection.query(insertQuery, searchTerm, (err, result) => {
        if (err) {
            console.error('Error inserting into MySQL:', err.message);
            return res.status(500).send(`Error: ${err.message}`);
        }

        // Display the received values and last 20 values in the browser
        res.json({ searchTerm });
    });
});
 */



function fetchData(callback) {
    const query = 'SELECT * FROM tablemiot ORDER BY id DESC LIMIT 20'; // Fetch the last 20 rows

    mysqlConnection.query(query, (err, results) => {
        if (err) throw err;
        //console.log('Data fetched:', results);
        dataFromDb = results.reverse(); // Reverse the order to display the latest values first
        if (callback) {
            callback();
        }
    });
}
app.use(express.urlencoded({ extended: true }));

/* app.get('/', (req, res) => {

    const markup = `
    <!DOCTYPE html>
    <html>
    <body>
        
       <form action="/" method="post">
       <label for="seuil">Seuil</label>
       <input id="seuil" name="seuil" type="text" value="" placeholder="enter seuil" required/>
       <input type="submit" value="submit"/>
   </form>
    </body>
    </html>

    `
    res.send(markup)

})
 */




// Serve the HTML page
app.get('/', (req, res) => {
    // Fetch data from the database
    fetchData(() => {
        // Render the HTML page with the fetched data
        res.sendFile(path.join(__dirname, 'index.html'));
    });
});

app.post('/valSeuilTemp', (req, res) => {
    const seuil = req.body.seuil;

    console.log('Received Body:', req.body);
    console.log('Received Seuil:', seuil);

    if (!seuil || isNaN(parseFloat(seuil))) {
        return res.status(400).json({ error: 'Invalid or missing Seuil value' });
    }

    // Fetch temperatures below the specified seuil
    const query = 'SELECT * FROM tablemiot WHERE CAST(temperature AS DECIMAL) < ? ORDER BY id DESC LIMIT 20';
    mysqlConnection.query(query, [parseFloat(seuil)], (err, results) => {
        if (err) {
            console.error('Error querying temperatures:', err.message);
            return res.status(500).json({ error: `Error: ${err.message}` });
        }

        // Reverse the order to send the latest values first
        const temperaturesBelowSeuil = results.reverse();

        // Send the fetched temperatures as a JSON response
        res.json({ temperaturesBelowSeuil });
    });
});



// Update the filterTemperature route



// Listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


