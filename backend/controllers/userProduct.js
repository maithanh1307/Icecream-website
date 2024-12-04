const express = require('express');
const db = require('../models/index.js'); 
const uploadController = require('./upload.js')

var router = express.Router();

router.get('/', async (req, res) => {
    const limit = 6; 
    const page = parseInt(req.query.page) || 1; 
    const offset = (page - 1) * limit; 
    const countQuery = `SELECT COUNT(*) as total FROM products`;
    const pagination = `SELECT * FROM products LIMIT ? OFFSET ?`;

    try {
        const [countResult] = await db.promise().query(countQuery);
        const totalProducts = countResult[0].total;

        const [userproducts] = await db.promise().query(pagination, [limit, offset]);

        const totalPages = Math.ceil(totalProducts / limit);

        userproducts.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('product', {
            userproducts,
            currentPage: page,
            totalPages,
        });
    } 
    catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        res.status(500).send('Error fetching products');
    }
});


router.get('/searchProduct', async (req, res) => {
    const searchQuery = req.query.search || '';  // lay keyword
    // page
    const limit = 6; 
    const page = parseInt(req.query.page) || 1;  
    const offset = (page - 1) * limit;  

    // search
    const countQuery = 'SELECT COUNT(*) as total FROM products WHERE name LIKE ?';
    const searchQuerySQL = 'SELECT * FROM products WHERE name LIKE ? LIMIT ? OFFSET ?';

    try {
        // tong so sp tim dc
        const [countResult] = await db.promise().query(countQuery, [`%${searchQuery}%`]);
        const totalProducts = countResult[0].total;

        const [products] = await db.promise().query(searchQuerySQL, [`%${searchQuery}%`, limit, offset]);

        const totalPages = Math.ceil(totalProducts / limit);

        products.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('product', {
            productSearch: products, 
            currentPage: page,  
            totalPages,  
            searchQuery, 
        });
    } 
    catch (err) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', err);
        res.status(500).send('Error searching products');
    }
});



module.exports = router;