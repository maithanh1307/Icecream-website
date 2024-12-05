const express = require('express')
var router = express.Router()

const bcrypt = require('bcrypt')
const db = require('../models/index.js')
const passport = require('passport'); 
const googleLogin = require('./googleLogin'); 

// Login  
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        const hashedPassword = rows[0].password;
        const isMatched = await bcrypt.compare(password, hashedPassword);

        if (!isMatched) {
            return res.status(401).send('Invalid credentials');
        }

        if (email === 'admin123@gmail.com') {
            res.redirect('/admin')
        }
        res.redirect(`/user?userId=${rows[0].id}`);
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

router.use('/login', googleLogin);

// Register 
router.post('/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    try {
        // Check email exists
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.status(409).render('login', { error: 'Email is already registered!' });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?, ?)',
            [firstname, lastname, email, hashedPassword]
        );

        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

module.exports = router