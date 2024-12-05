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
            return res.status(401).send('Invalid credentials');
        }

        const hashedPassword = rows[0].password;
        const isMatched = await bcrypt.compare(password, hashedPassword);

        if (!isMatched) {
            return res.status(401).send('Invalid credentials');
        }

        if (email === 'admin123@gmail.com') {
            res.redirect('/admin/manageProduct') //de tam
        }
        res.redirect(`/`);
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

// router.use('/login', googleLogin);


module.exports = router