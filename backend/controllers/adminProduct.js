const express = require('express');
const fs = require('fs')
const db = require('../models/index.js'); 
const uploadController = require('./upload.js')
const path = require('path');

var router = express.Router();




router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT 
                p.product_id, 
                p.image_url, 
                p.name, 
                p.description, 
                GROUP_CONCAT(t.name) AS tags, 
                c.name as category_name, 
                v.size, 
                v.stock, 
                p.base_price
            FROM products p

            JOIN categories c ON p.category_id = c.category_id
            JOIN product_variants v ON p.product_id = v.product_id

            LEFT JOIN product_tag_map ptm ON p.product_id = ptm.product_id
            LEFT JOIN product_tags t ON ptm.tag_id = t.tag_id
            
            GROUP BY p.product_id, p.image_url, p.name, p.description, c.name, v.size, v.stock, p.base_price
            ORDER BY p.product_id DESC;
        `);
        rows.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(product.base_price) + 'đ';  
        });

        res.render('AdminProduct', { adminproducts: rows }); 
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Error fetching products');
    }
});

// router.get('/', (req, res) => {
//     res.render('AdminProduct')
// })

router.post('/addProduct', uploadController.uploadImage, async (req, res) => {
    const { name, description, basePrice, discount, category_id, tags, 
            variant_color, variant_size, variant_stock, variant_price  } = req.body;
    const imageUrl = req.file ? `/image/${req.file.filename}` : null;

    if (!name || !description || !basePrice || !discount || !category_id || !variant_color 
        || !variant_size || !variant_stock || !variant_price) {
        return res.status(400).send('thieu thong tin san pham'); 
    }

    try {
        // them vao bang product
        const [productResult] = await db.promise().query(`INSERT INTO products (name, description, base_price, discount_percentage, 
                                    category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)`, 
                                [name, description, basePrice, discount, category_id, imageUrl]);

        console.log('Kết quả trả về từ câu lệnh INSERT:', productResult);
        if (!productResult.insertId) {
            return res.status(500).send('Không thể lấy product_id, thất bại khi thêm sản phẩm');
        }

        const productId = productResult.insertId; 

        if (tags && Array.isArray(tags)) {
            for (let tagId of tags) {
                await db.promise().query(
                    `INSERT INTO product_tag_map (product_id, tag_id) VALUES (?, ?)`,
                    [productId, tagId]
                );
            }
        }
    

        // them variant cho kem 
        const variantResult = await db.promise().query(`INSERT INTO product_variants (product_id, color, size, stock, 
                price) VALUES (?, ?, ?, ?, ?)`, 
                [productId, variant_color, variant_size, variant_stock, variant_price]);
        

        // in sp moi
        const newProduct = {
            id: productId,
            name,
            description,
            basePrice,
            discount,
            category_id,
            tags: tags || [],
            variants: {
                color: variant_color,
                size: variant_size,
                stock: variant_stock,
                price: variant_price,
            },
            imageUrl
        };

        // In thông tin sản phẩm ra console
        console.log('Sản phẩm mới đã được thêm:', newProduct);
        res.redirect('/admin/manageProduct'); 

    } catch (err) {
        console.error('loi khi them san pham:', err);
        res.status(500).send('da xay ra loi khi them san pham');
    }
});

// router.post('/deleteProduct', async (req, res) => {
//     const productId = req.body.productId;  

//     const deleteQuery = 'DELETE FROM products WHERE id = ?';

//     try {
//         await db.promise().query(deleteQuery, [productId]);
        
//         res.redirect('/admin');  
//     } 
//     catch (err) {
//         console.error(err);
//         return res.status(500).send('Error deleting product');
//     }
// });


router.get('/edit', async (req, res) => {
    const productId = req.query.productId; // Nhận productId từ form
    if (!productId) {
        return res.status(400).send('Product ID is required');
    }
    try {
        const [products] = await db.promise().query(`
            SELECT 
                p.product_id, 
                p.name, 
                p.description, 
                p.base_price, 
                p.discount_percentage, 
                p.category_id, 
                p.image_url, 
                GROUP_CONCAT(pt.name) AS tags, 
                v.color AS variant_color, 
                v.size AS variant_size, 
                v.stock AS variant_stock, 
                v.price AS variant_price
            FROM products p
            LEFT JOIN product_tag_map ptm ON p.product_id = ptm.product_id
            LEFT JOIN product_tags pt ON ptm.tag_id = pt.tag_id
            LEFT JOIN product_variants v ON p.product_id = v.product_id
            WHERE p.product_id = ?
            GROUP BY p.product_id, v.color, v.size, v.stock, v.price;
        `, [productId]);

        if (products.length > 0) {
            const productEdit = products[0];
            productEdit.tags = productEdit.tags ? productEdit.tags.split(',').map(Number) : []; //chuyen chuoi thanh so tuong ung voi value

            const [allTags] = await db.promise().query('SELECT * FROM product_tags');
            res.render('AdminProduct', { productEdit, allTags }); 
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/editProduct', uploadController.uploadImage, async (req, res) => {
    const { productId, name, description, basePrice, discount, category_id, tags, 
            variant_color, variant_size, variant_stock, variant_price } = req.body;

    console.log('Received productId:', productId);  // Kiểm tra xem productId có được gửi đúng không

    if (!productId) {
        return res.status(400).send('Product ID is required');  // Nếu không có productId, trả về lỗi
    }

    const imageUrl = req.file ? `/image/${req.file.filename}` : null;

    try {
        const query = `UPDATE products SET name = ?, description = ?, base_price = ?, discount_percentage = ?, 
                        category_id = ?, image_url = IFNULL(?, image_url) WHERE product_id = ?`;
        await db.promise().query(query, [name, description, basePrice, discount, category_id, imageUrl, productId]);

        // Cập nhật các tags và variants
        await db.promise().query('DELETE FROM product_tag_map WHERE product_id = ?', [productId]);

        if (tags && Array.isArray(tags)) {
            for (let tagId of tags) {
                await db.promise().query(`INSERT INTO product_tag_map (product_id, tag_id) VALUES (?, ?)`, [productId, tagId]);
            }
        }

        const variantQuery = `UPDATE product_variants SET color = ?, size = ?, stock = ?, price = ? WHERE product_id = ?`;
        await db.promise().query(variantQuery, [variant_color, variant_size, variant_stock, variant_price, productId]);

        res.redirect('/admin/manageProduct'); // Quay lại trang quản lý sản phẩm sau khi cập nhật

    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send('Error updating product');
    }
});






module.exports = router;
