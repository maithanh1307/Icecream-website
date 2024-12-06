const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', (req, res) => {
    res.render('AdminUser')
})

module.exports = router;