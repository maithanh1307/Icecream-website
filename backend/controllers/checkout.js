const express = require('express');
const db = require('../models/index.js'); 
const cookieParser = require('cookie-parser');
var router = express.Router();
router.use(cookieParser());
// router.get('/', (req, res) => {
//     console.log("Cookies received in checkout:", req.cookies); // Kiểm tra cookie nhận được

//     const total = req.cookies.total ? `${req.cookies.total}đ` : '0đ';
//     const subtotal = req.cookies.subtotal ? `${req.cookies.subtotal}đ` : '0đ';
//     const tax = req.cookies.tax ? `${req.cookies.tax}đ` : '0đ';
//     const discount = req.cookies.discount ? `${req.cookies.discount}đ` : '0đ';

//     res.render('checkout', { total, subtotal, tax, discount });
// })



router.get('/', async (req, res) => {
    // Lấy cookie 'cart' và 'total' từ request
    const cartCookie = req.cookies.cart;
    const total = req.cookies.total || 0; // Lấy tổng tiền từ cookie (nếu có)

    let cart = [];

    // Nếu có cookie 'cart', giải mã và tính tổng tiền
    if (cartCookie) {
        try {
            // Giải mã dữ liệu cart từ JSON string thành object
            cart = JSON.parse(cartCookie);
        } catch (error) {
            console.error('Error parsing cart cookie:', error);
        }
    }

    // Đảm bảo rằng 'total' và 'cart' sẽ được truyền vào template
    res.render('checkout', { total, cart });
});








module.exports = router;
