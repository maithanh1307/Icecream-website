const express = require('express');
const db = require('../models/index.js'); 
const uploadController = require('./upload.js')

var router = express.Router();

router.get('/', async (req,res) => {
    try {
        const bestSellerQuery = `
            SELECT p.*, p.image_url
            FROM products p
            JOIN product_tag_map ptm ON p.product_id = ptm.product_id
            JOIN product_tags pt ON ptm.tag_id = pt.tag_id
            WHERE pt.name = 'Best Seller'
            LIMIT 3;
        `;

        const newArrivalQuery = `
            SELECT p.*, p.image_url
            FROM products p
            JOIN product_tag_map ptm ON p.product_id = ptm.product_id
            JOIN product_tags pt ON ptm.tag_id = pt.tag_id
            WHERE pt.name = 'New Arrival'
            LIMIT 3;
        `;

        const normalQuery = `
            SELECT p.*, p.image_url
            FROM products p
            JOIN product_tag_map ptm ON p.product_id = ptm.product_id
            JOIN product_tags pt ON ptm.tag_id = pt.tag_id
            WHERE pt.name = 'Normal'
            LIMIT 3;
        `;



        const [bestSeller] = await db.promise().query(bestSellerQuery);
        const [newArrival] = await db.promise().query(newArrivalQuery);
        const [mostView] = await db.promise().query(normalQuery);

        bestSeller.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });
        newArrival.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });
        mostView.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('home', {
            bestSeller,
            newArrival,
            mostView
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        res.status(500).send('Error fetching products');
    }
})

module.exports = router;