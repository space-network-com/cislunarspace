const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');




//const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const mainRouter = require('./routes/jump');


app.use('/', mainRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/send-email', (req, res) => {
  const { name, email, company, message } = req.body;

  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services too
    auth: {
      user: 'spacenetworkcom@gmail.com',
      pass: 'Zahid_1982' // Consider using an environment variable for security
    }
  });

  // Set up email data
  const mailOptions = {
    from: email,
    to: 'spacenetworkcom@gmail.com',
    subject: `Contact Request from ${name}`,
    text: `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nMessage: ${message}`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('An error occurred. Please try again later.');
    } else {
      console.log('Email sent:', info.response);
      res.send('Thank you for contacting us! We will get back to you soon.');
    }
  });
});


const fsp = require('fs').promises;


async function getOrbitInitialConditions(orbitID) {
    const files = ['Halo_L1_Southern.json', 'Halo_L1_Northern.json', 'Halo_L2_Southern.json', 'Halo_L2_Northern.json', 'Lyapunov_L1.json', 'Lyapunov_L2.json'];
    
    for (let file of files) {
        const data = JSON.parse(await fsp.readFile(`./data/${file}`, 'utf8'));
        const orbit = data.find(item => item["Orbit ID"] === orbitID);
        if (orbit) return orbit;
    }

    throw new Error(`Orbit with ID ${orbitID} not found`);
}

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
    const Uz = -((1 - mu) * z) / P1 ** 3 - (mu * z) / P2 ** 3;

    dxdt[3] = 2 * ydot + Ux;
    dxdt[4] = -2 * xdot + Uy;
    dxdt[5] = Uz;

    return dxdt;
}

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
        result.push([state[0], state[1], state[2]]);
        t += dt;
    }

    return result;
}

// Endpoint to get orbit data
app.get('/orbit-data', async (req, res) => {
    try {
        const orbitID = req.query.orbitID;
        const initialConditions = await getOrbitInitialConditions(orbitID);
        const mu = 0.01215058560962404; // Earth-Moon system mass ratio
        const dt = 0.001;

        // Set the initial state [x, y, z, xdot, ydot, zdot]
        const initialState = [
            parseFloat(initialConditions["x0 [LU]"]),
            parseFloat(initialConditions["y0 [LU]"]),
            parseFloat(initialConditions["z0 [LU]"]),
            parseFloat(initialConditions["xdot0 [LU/TU]"]),
            parseFloat(initialConditions["ydot0 [LU/TU]"]),
            parseFloat(initialConditions["zdot0 [LU/TU]"])
        ];

        const orbitPoints = rungeKutta4(initialState, 0, parseFloat(initialConditions["Tp [TU]"]), dt, mu);
        res.json(orbitPoints);
    } catch (error) {
        console.error('Error fetching orbit data:', error);
        res.status(500).send('Error fetching orbit data');
    }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



