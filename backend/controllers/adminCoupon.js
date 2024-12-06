const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', async (req, res) => {  
    try {
        const [coupon] = await db.promise().query(
            `SELECT 
            coupon_id, 
            code, 
            discount_value, 
            discount_type, 
            DATE(created_at) AS create_at, 
            DATE(expiration_date) AS expiration_date
            FROM coupons ORDER BY coupon_id DESC;`
        );
        res.render('AdminCoupon', {coupon})
    } 
    catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching coupons.',
        });
    }
})

router.post('/addCoupon', async (req, res) => {
    const { code, discount_value, discount_type, expiration_date } = req.body;
    try {
        const [result] = await db.promise().query(
            `INSERT INTO coupons (code, discount_value, discount_type, expiration_date) 
            VALUES (?, ?, ?, ?)`,
            [code, discount_value, discount_type, expiration_date]
        );

        // Định dạng lại giá trị discount_value để hiển thị
        let formattedDiscountValue;
        if (discount_type === 'percentage') {
            formattedDiscountValue = `${discount_value}%`; // Dạng phần trăm
        } 
        else if (discount_type === 'fixed') {
            formattedDiscountValue = `${Number(discount_value).toLocaleString()}đ`; // Dạng cố định
        }

        console.log("Coupon created: ", result);
        res.redirect('/admin/manageCoupon');
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).send({
            status: 'error',
            message: 'Error creating coupon.',
        });
    }
});


module.exports = router;