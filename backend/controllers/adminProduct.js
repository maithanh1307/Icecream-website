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


// router.get('/update', async (req, res) => {
//     const productId = req.query.productId; // Nhận productId từ form
//     try {
//         const query = 'SELECT * FROM products WHERE id = ?';
//         const [product] = await db.promise().query(query, [productId]);
//         const [products] = await db.promise().query('SELECT * FROM products');
//         if (product.length > 0) {
//             res.render('admin', { products, product: product[0] }); // Gửi sản phẩm đã chọn đến template
//         } else {
//             res.status(404).send('Product not found');
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// });


// router.post('/updateProduct', async (req, res) => {
//     const { productId, productName, productQuantity, productDescription, productPrice } = req.body;
//     try {
//         const query = 'UPDATE products SET productName = ?, productQuantity = ?, productDescription = ?, productPrice = ? WHERE id = ?';
//         await db.promise().query(query, [productName, productQuantity, productDescription, productPrice, productId]);
//         res.redirect('/admin'); // Quay lại trang admin sau khi cập nhật
//     } catch (err) {
//         console.error('Error updating product:', err);
//         res.status(500).send('Error updating product');
//     }
// });



module.exports = router;
