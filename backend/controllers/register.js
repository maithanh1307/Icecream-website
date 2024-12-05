const express = require('express');
const db = require('../models/index.js'); 
const bcrypt = require('bcrypt')
var router = express.Router();

router.get('/', (req, res) => {
    res.render('register'); 
});

// Register 
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check email exists
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.status(409).render('login', { error: 'Email is already registered!' });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        console.log('User successfully registered:', { username, email, hashedPassword });

        res.redirect('/login');
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

module.exports = router