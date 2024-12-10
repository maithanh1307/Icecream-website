const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Unable to log out');
        }
        // Xóa cookie session ID
        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,  
            secure: false, 
        });

        res.redirect('/login');
    });
});

module.exports = router;