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

router.get('/categoryProduct', async (req, res) => {
    const categoryId = req.query.category_id; 
    const page = parseInt(req.query.page) || 1; 
    const limit = 6; 
    const offset = (page - 1) * limit; 

    if (!categoryId) {
        return res.status(400).send('Category ID is required');
    }

    try {
        const [[{ totalProducts }]] = await db.promise().query(
            'SELECT COUNT(*) AS totalProducts FROM products WHERE category_id = ?',
            [categoryId]
        );

        const [categoryProduct] = await db.promise().query(
            'SELECT * FROM products WHERE category_id = ? LIMIT ? OFFSET ?',
            [categoryId, limit, offset]
        );

        const totalPages = Math.ceil(totalProducts / limit);

        categoryProduct.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('product', {
            categoryProduct,
            categoryId,
            currentPage: page,
            totalPages,
        });
    } 
    catch (err) {
        console.error('Lỗi khi lọc sản phẩm theo danh mục:', err);
        res.status(500).send('Error filtering products by category');
    }
})

router.get('/filterProduct', async (req, res) => {
    const categoryId = req.query.category_id || null;
    const flavors = req.query.flavour;  
    const sizes = req.query.size;

    let sql = 'SELECT p.*, pv.* FROM products p JOIN product_variants pv ON p.product_id = pv.product_id';
    let sqlContent = [];

    try {
        // co the thuc hien filter cho sp khi o trong danh muc tuong ung
        if (categoryId) {
            sql += ' WHERE p.category_id = ?';
            sqlContent.push(categoryId);
        }

        if (flavors) {
            const flavorPlaceholders = Array.isArray(flavors)
                ? flavors.map(() => '?').join(',')
                : '?';
            sql += (sqlContent.length ? ' AND' : ' WHERE') + ` pv.color IN (${flavorPlaceholders})`;
            sqlContent.push(...(Array.isArray(flavors) ? flavors : [flavors]));
        }

        if (sizes) {
            const sizePlaceholders = Array.isArray(sizes)
                ? sizes.map(() => '?').join(',')
                : '?';
            sql += (sqlContent.length ? ' AND' : ' WHERE') + ` pv.size IN (${sizePlaceholders})`;
            sqlContent.push(...(Array.isArray(sizes) ? sizes : [sizes]));
        }

        const [productFiler] = await db.promise().query(sql, sqlContent);

        productFiler.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';
        });

        res.render('product', {
            productFiler,
            categoryId,
            selectedFlavors: flavors || [],
            selectedSizes: sizes || [],
        });
    } catch (err) {
        console.error('Lỗi khi lọc sản phẩm theo biến thể:', err);
        res.status(500).send('Error filtering products by variants');
    }
});


router.get('/sortProduct', async (req, res) => {
    const categoryId = req.query.category_id || null;  
    const tagId = req.query.tag_id || null; 
    const priceOrder = req.query.price_order || null; 

    try {
        let sql = 'SELECT p.* FROM products p';
        let sqlContent = [];

        sql += ' JOIN product_tag_map ptm ON p.product_id = ptm.product_id';
        sql += ' JOIN product_tags pt ON ptm.tag_id = pt.tag_id';

        if (categoryId) {
            sql += ' WHERE p.category_id = ?';
            sqlContent.push(categoryId);
        } else {
            sql += ' WHERE 1=1';  
        }

        if (tagId) {
            sql += ' AND pt.tag_id = ?';
            sqlContent.push(tagId);
        }

        if (priceOrder) {
            sql += ` ORDER BY p.base_price ${priceOrder === 'Ascending' ? 'ASC' : 'DESC'}`;
        }

        const [productSort] = await db.promise().query(sql, sqlContent);

        productSort.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('product', {
            productSort,
            categoryId,
            selectedTagId: tagId,
            selectedPriceOrder: priceOrder,
        });
    } catch (err) {
        console.error('Lỗi khi lọc và sắp xếp sản phẩm:', err);
        res.status(500).send('Error sorting products');
    }
});

router.get('/productDetail/:product_id', async (req, res) => {
    const productId = req.params.product_id; 
    try {
        const [productDetails] = await db.promise().query(
            `SELECT p.*, c.name AS category_name, pv.size, pv.color, pv.stock
             FROM products p
             JOIN categories c ON p.category_id = c.category_id
             LEFT JOIN product_variants pv ON p.product_id = pv.product_id
             WHERE p.product_id = ?`,
            [productId]
        );

        if (productDetails.length === 0) {
            return res.status(404).send('Product not found');
        }

        productDetails.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        // review list
        const [reviews] = await db.promise().query(
            `SELECT r.comment, u.username, r.created_at
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [productId]
        );

        // Render ra view productDetail với dữ liệu chi tiết sản phẩm và review
        res.render('productDetail', {
            productdetails: productDetails[0],
            reviews, // Truyền danh sách review vào view
        });
    } catch (err) {
        console.error('Lỗi khi truy vấn chi tiết sản phẩm và review:', err);
        res.status(500).send('Error fetching product details and reviews');
    }
});




module.exports = router;