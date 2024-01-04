// chartScript.js
document.addEventListener("DOMContentLoaded", function () {
    // Render the chart
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line', // Change chart type to 'line'
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature',
                    data: [],
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Humidity',
                    data: [],
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100 // Set maximum value for humidity
                },
                x: {
                    min: -40, // Set minimum value for temperature
                    max: 80, // Set maximum value for temperature
                    beginAtZero: true
                }
            }
        }
    });

    // Function to fetch and update the value from the server
    function fetchAndUpdateValue() {
        fetch('/getValue')
            .then(response => response.json()) // Parse the response as JSON
            .then(data => {
                // Log the received data to the console
                console.log('Received Data:', data);

                // Update the latest value on the page
                document.getElementById('value').innerText = 'Received Value: ' + data.latestValue;

                // Update the chart data
                updateChartData(data.last20Values);
            })
            .catch(error => {
                console.error('Error fetching data:', error.message);
            });
    }

    // Initial fetch and update
    fetchAndUpdateValue();

    // Schedule periodic fetch and update
    setInterval(fetchAndUpdateValue, 5000); // Fetch every 5 seconds

    // Function to update the chart data
    function updateChartData(values) {
        // Log the values to check if it's reaching this point
        console.log('Updating chart data with:', values);

        // Clear existing data
        myChart.data.labels = [];
        myChart.data.datasets[0].data = [];
        myChart.data.datasets[1].data = [];

        // Loop through fetched data and add to the chart
        for (const entry of values) {
            const numericHumidity = parseFloat(entry.humidity);
            const numericTemperature = parseFloat(entry.temperature);

            // Add separate data points for humidity and temperature with different colors
            myChart.data.labels.push(`Data Point - Temperature: ${numericTemperature}`);
            myChart.data.datasets[0].data.push(numericTemperature); // Add temperature data

            myChart.data.labels.push(`Data Point - Humidity: ${numericHumidity}`);
            myChart.data.datasets[1].data.push(numericHumidity); // Add humidity data
        }

        // Log the updated chart data
        console.log('Updated Chart Data:', myChart.data);

        // Update the chart
        myChart.update();
    }


function updateChartWithSeuil(seuil) {
    console.log('Updating chart with Seuil:', seuil);

    fetch('/valSeuilTemp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Update content type
        },
        body: `seuil=${encodeURIComponent(seuil)}`, // Pass the value directly
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Log the received data to the console
            console.log('Received Data for Seuil:', data);

            // Update the chart data
            updateChartData(data.temperaturesBelowSeuil);
        })
        .catch(error => {
            console.error('Error fetching data for Seuil:', error);
        });
}




    // Add an event listener to the form for button click
    // Add an event listener to the form for button click
    document.querySelector('form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the form from submitting

        // Get the value from the input field
        const seuil = document.getElementById('seuil').value;

        console.log('Clicked Submit Button. Seuil Value:', seuil);

        // Call the function to update the chart with the specified seuil
        updateChartWithSeuil(seuil);
    });

});
