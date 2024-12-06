const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', (req, res) => {
    res.render('AdminCoupon')
})

router.post('/addCoupons', async (req, res) => {
    const { code, discount_value, discount_type, min_order_value, expiration_date, usage_limit } = req.body;
    try {
        const [result] = await db.promise().query(
            `INSERT INTO coupons (code, discount_value, discount_type, min_order_value, expiration_date, usage_limit) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [code, discount_value, discount_type, min_order_value, expiration_date, usage_limit]
        );
        res.status(201).json({
            status: 'success',
            message: 'Coupon created successfully!',
        });
    } 
    catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating coupon.',
        });
    }
});

module.exports = router;