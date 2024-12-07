const express = require('express');
const db = require('../models/index.js'); 
const bcrypt = require('bcrypt')
var router = express.Router();

// Login  
router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        const user = rows[0];

        if (user.status === 'banned') {
            return res.render('login', { error: 'Your account has been banned.' });
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Set session
        req.session.user = user;
        res.cookie('user', JSON.stringify(user), { 
            httpOnly: true, 
            maxAge: 1000 * 60 * 60 * 24 // Cookie hết hạn sau 1 ngày
          });
      
        console.log('Session after login:', req.session);// Log session data here

        if (user.role === 'admin') {
            return res.redirect('/admin');
        }

        return res.redirect('/'); 
    } catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});



module.exports = router