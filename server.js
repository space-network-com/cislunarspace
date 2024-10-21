const express = require('express');


const fs = require('fs');
const path = require('path');

//const fetch = require('node-fetch');
const app = express();
const PORT = 3000;



// Serve static HTML files
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get orbit data from the JSON file
app.get('/orbits', (req, res) => {
    fs.readFile('orbitData.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading data file');
        } else {
            res.json(JSON.parse(data));
        }
    });
});


function getOrbitData(orbitID) {
    // Dummy data for example, replace with actual logic to fetch orbit data
    // Simulate an orbit as a simple 3D sine wave
    const orbitData = [];
    for (let i = 0; i < 1000; i++) {
        const t = i * 0.01;
        orbitData.push([
            Math.sin(t),  // x-coordinate
            Math.cos(t),  // y-coordinate
            0.1 * Math.sin(t)  // z-coordinate
        ]);
    }
    return orbitData;
}

const fsp = require('fs').promises;


function getJSONFileFromOrbitID(orbitID) {
            if (orbitID.startsWith("H2S")) {
                return "Halo_L2_Southern.json";
            } else if (orbitID.startsWith("H2N")) {
                return "Halo_L2_Northern.json";
            } else if (orbitID.startsWith("H1S")) {
                return "Halo_L1_Southern.json";
            } else if (orbitID.startsWith("H1N")) {
                return "Halo_L1_Northern.json";
            } else if (orbitID.startsWith("L1")) {
                return "Lyapunov_L1.json";
            } else if (orbitID.startsWith("L2")) {
                return "Lyapunov_L2.json";
            } else {
                alert("Invalid Orbit ID prefix");
                return null;
            }
        }

// Read orbitData.json using the file system
async function getOrbitInitialConditions(orbitID) {
    try {
        
	
        const fileName = getJSONFileFromOrbitID(orbitID);

	const data = await fsp.readFile(fileName, 'utf8');
        const orbits = JSON.parse(data);

        // Find the orbit that matches the provided OrbitID
        const selectedOrbit = orbits.find(orbit => orbit['Orbit ID'] === orbitID);
        
        // Return the selected orbit's initial conditions
        return {
            x0: parseFloat(selectedOrbit['x0 [LU]']),
            y0: parseFloat(selectedOrbit['y0 [LU]']),
            z0: parseFloat(selectedOrbit['z0 [LU]']),
            xdot0: parseFloat(selectedOrbit['xdot0 [LU/TU]']),
            ydot0: parseFloat(selectedOrbit['ydot0 [LU/TU]']),
            zdot0: parseFloat(selectedOrbit['zdot0 [LU/TU]']),
            Tp: parseFloat(selectedOrbit['Tp [TU]'])
        };
    } catch (error) {
        console.error('Error reading the file:', error);
    }
}




// Define the differential equations for the orbital dynamics (translated from C++)
function harmonicOscillator(state, mu) {
    const [x, y, z, xdot, ydot, zdot] = state;
    const dxdt = [];

    dxdt[0] = xdot;
    dxdt[1] = ydot;
    dxdt[2] = zdot;

    const P1 = Math.sqrt((x + mu) ** 2 + y ** 2 + z ** 2);
    const P2 = Math.sqrt((x - 1 + mu) ** 2 + y ** 2 + z ** 2);

    const Ux = x - ((1 - mu) * (x + mu)) / P1 ** 3 - (mu * (x - 1 + mu)) / P2 ** 3;
    const Uy = y - ((1 - mu) * y) / P1 ** 3 - (mu * y) / P2 ** 3;
    const Uz =  - ((1 - mu) * z) / P1 ** 3 - (mu * z) / P2 ** 3;

    dxdt[3] = 2 * ydot + Ux;
    dxdt[4] = -2 * xdot + Uy;
    dxdt[5] = Uz;

    return dxdt;
}

// Implement the RK4 method for numerical integration
function rungeKutta4(initialState, t0, tEnd, dt, mu) {
    const result = [];
    let state = initialState;
    let t = t0;

    while (t <= tEnd) {
        const k1 = harmonicOscillator(state, mu).map(d => d * dt);
        const k2 = harmonicOscillator(state.map((x, i) => x + k1[i] / 2), mu).map(d => d * dt);
        const k3 = harmonicOscillator(state.map((x, i) => x + k2[i] / 2), mu).map(d => d * dt);
        const k4 = harmonicOscillator(state.map((x, i) => x + k3[i]), mu).map(d => d * dt);

        state = state.map((x, i) => x + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
        result.push([...state]);
        t += dt;
    }

    return result;
}


// Plot the orbit using Plotly
function plotOrbit(orbitPoints) {
    const x = orbitPoints.map(point => point[0]);
    const y = orbitPoints.map(point => point[1]);
    const z = orbitPoints.map(point => point[2]);

    const trace = {
        x: x,
        y: y,
        z: z,
        mode: 'lines',
        type: 'scatter3d',
        line: { color: 'blue', width: 2 }
    };

    const layout = {
        title: 'Orbit Visualization',
        scene: {
            xaxis: { title: 'X [LU]' },
            yaxis: { title: 'Y [LU]' },
            zaxis: { title: 'Z [LU]' }
        }
    };

    Plotly.newPlot('orbitPlot', [trace], layout);
}

// Main function to get initial conditions, calculate the orbit, and plot
async function getOrbitPoints(orbitID) {
    const mu = 0.01215058560962404; // Moon-Earth system mass ratio
    const dt = 0.001;

    // Get initial conditions from the JSON file
    const initialConditions = await getOrbitInitialConditions(orbitID);

	console.log('Initial Conditions for Orbit ID:', orbitID);
        console.log('x0:', initialConditions.x0);
        console.log('y0:', initialConditions.y0);
        console.log('z0:', initialConditions.z0);
        console.log('xdot0:', initialConditions.xdot0);
        console.log('ydot0:', initialConditions.ydot0);
        console.log('zdot0:', initialConditions.zdot0);
        console.log('Tp:', initialConditions.Tp);	

    // Set the initial state [x, y, z, xdot, ydot, zdot]
    const initialState = [
        initialConditions.x0,
        initialConditions.y0,
        initialConditions.z0,
        initialConditions.xdot0,
        initialConditions.ydot0,
        initialConditions.zdot0
    ];
    
    // Use the RK4 method to calculate orbit points
    const orbitPoints = rungeKutta4(initialState, 0, initialConditions.Tp, dt, mu);
    
    //console.log('data points',orbitPoints);

    return orbitPoints;	
    // Plot the orbit
   // plotOrbit(orbitPoints);
}

// Call the main function for a specific Orbit ID
//main('H2S0001');
app.get('/orbit-data', async (req, res) => {
    const orbitID = req.query.orbitID;
    try{
    // Retrieve the orbit data for the selected orbitID (from JSON file or database)
    const orbitPoints = await getOrbitPoints(orbitID);
    //console.log('Data points', orbitData)
    res.json(orbitPoints); // Send the data to the client 
    }
   catch (error) {
        console.error('Error fetching orbit points:', error);
        res.status(500).send('Error fetching orbit points');
    }
});


app.get('/show/:id', (req, res) => {
    const orbitId = req.params.id;
    // For now, just render an empty page
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Orbit Detail - ${orbitId}</title>
        </head>
        <body>
            <h1>Details for Orbit ${orbitId}</h1>
            <p>This page is still under construction. Orbit ID: ${orbitId}</p>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

