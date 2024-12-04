const express = require('express')
var router = express.Router()

const bcrypt = require('bcrypt')
const db = require('../models/index.js')


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
            res.redirect('/admin')
        }
        res.redirect(`/user?userId=${rows[0].id}`);
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

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
            'INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)',
            [firstname, lastname, email, hashedPassword]
        );

        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred. Please try again!' });
    }
});

// SHOW HIDE PASSWORD LOGIN  
const passwordAccess = (loginPass, loginEye) => {
    const input = document.getElementById(loginPass),
        iconEye = document.getElementById(loginEye)

    iconEye.addEventListener('click', () => {
        // Change password to text
        input.type === 'password' ? input.type = 'text'
            : input.type = 'password'

        // Icon change
        iconEye.classList.toggle('ri-eye-fill')
        iconEye.classList.toggle('ri-eye-off-fill')
    })
}
passwordAccess('password', 'loginPassword')

// SHOW HIDE PASSWORD CREATE ACCOUNT
const passwordRegister = (loginPass, loginEye) => {
    const input = document.getElementById(loginPass),
        iconEye = document.getElementById(loginEye)

    iconEye.addEventListener('click', () => {
        // change password to text
        input.type === 'password' ? input.type = 'text'
            : input.type = 'password'

        // change icon
        iconEye.classList.toggle('ri-eye-fill')
        iconEye.classList.toggle('ri-eye-off-fill')
    })
}
passwordRegister('crePassword', 'loginPasswordCre')

// SHOW HIDE LOGIN & CREATE ACCOUNT
const loginAcessRegister = document.getElementById('loginAccess'),
    buttonRegister = document.getElementById('loginBtnRegister'),
    buttonAccess = document.getElementById('loginBtnAccess')

buttonRegister.addEventListener('click', () => {
    loginAcessRegister.classList.add('active')
})

buttonAccess.addEventListener('click', () => {
    loginAcessRegister.classList.remove('active')
})


module.exports = router