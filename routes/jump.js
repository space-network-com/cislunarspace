const express = require('express');
const path = require('path');
const router = express.Router();

// Define a route for "/users"
router.get('/about', (req, res) => {
 res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/products', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/products.html'));
});

router.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/demo.html'));
});

router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});





module.exports = router;
