const express = require('express');
const router = express.Router();

// Define a route for "/users"
router.get('/about', (req, res) => {
  res.send('This is the About page');
});

router.get('/products', (req, res) => {
  res.send('This is the Products page');
});

router.get('/demo', (req, res) => {
  res.send('This is the demo page');
});

router.get('/contact', (req, res) => {
  res.send('This is the Contact page');
});





module.exports = router;
