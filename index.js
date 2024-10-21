const express = require('express');


const fs = require('fs');
const path = require('path');

//const fetch = require('node-fetch');
const app = express();
const port = 3000;


app.use(express.static(path.join(__dirname, 'public')));


const mainRouter = require('./routes/jump');


app.use('/', mainRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



