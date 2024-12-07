const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Unable to log out');
        }
        res.clearCookie('connect.sid'); // Xóa cookie session ID
        res.redirect('/login'); // Chuyển hướng về trang đăng nhập
    });
});

module.exports = router;
