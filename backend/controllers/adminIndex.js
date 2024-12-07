const express = require('express');
const db = require('../models/index.js'); 

const router = express.Router();

router.get('/', (req, res) => {
    // Truy vấn đếm số lượng user có vai trò 'customer'
    const query = "SELECT COUNT(*) AS count FROM users WHERE role = 'customer'";

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Truyền số lượng customer vào EJS
        const customerCount = results[0].count;
        res.render('AdminIndex', { customerCount });
    });
});

module.exports = router;