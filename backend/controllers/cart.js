const express = require('express');
const db = require('../models/index.js'); 
const cookieParser = require('cookie-parser');
var router = express.Router();

router.use(cookieParser());  

router.use((req, res, next) => {
    const sessionIdFromUrl = req.query.session_id;
    if (sessionIdFromUrl) {
        res.cookie('sessionId', sessionIdFromUrl, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
    }
    next();
});


router.post('/addCart', async (req, res) => {
    const { product_id } = req.body;
    const sessionId = req.cookies.sessionId; //session tu cookie

    try {
        console.log('Session ID:', sessionId);

        const [variantRows] = await db.promise().query(
            'SELECT variant_id FROM product_variants WHERE product_id = ? LIMIT 1',
            [product_id]
        );

        if (variantRows.length === 0) {
            return res.status(404).send('Variant not found for this product.');
        }

        const variant_id = variantRows[0].variant_id;
        const quantity = 1;

        //nguoi dung da login
        if (req.session.userId) {
            const userId = req.session.userId;

            const [cartRows] = await db.promise().query('SELECT * FROM cart WHERE user_id = ?', [userId]);

            let cartId;
            if (cartRows.length === 0) {
                const [result] = await db.promise().query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
                cartId = result.insertId;
            } else {
                cartId = cartRows[0].cart_id;
            }

            await db.promise().query(
                'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?) ' +
                'ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
                [cartId, variant_id, quantity]
            );

            return res.json({ success: true, message: 'Product added to cart successfully.' });
        }

        // nguoi dung chua login
        let cart = JSON.parse(req.cookies.cart || '[]');  // tu tao gio hang tu cookie

        const existingItem = cart.find(item => item.variant_id === variant_id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ variant_id, quantity });
        }

        // luu vao cookie
        res.cookie('cart', JSON.stringify(cart), { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });

        //lay san pham trang nao thi van o lai trang do
        const referer = req.get('Referrer');
        if (referer.includes('/')) {
            res.redirect(`/`);
        } 
        else if (referer.includes('/product') && !referer.includes('/productDetail')) {
            res.redirect(`/product`);
        } 
        else if (referer.includes('/productDetail')) {
            res.redirect(`/productDetail/${product_id}`);
        } 
        else {
            res.redirect(`/`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while adding to cart.');
    }
});



router.get('/', async (req, res) => {
    const sessionId = req.cookies.sessionId; // lấy sessionId từ cookie
    console.log('Session ID in cart:', sessionId);

    try {
        let cartProduct = [];
        let total = 0;  // Khai báo biến total cho tổng giá trị giỏ hàng

        // Nếu người dùng đã đăng nhập
        if (req.session.userId) {
            const userId = req.session.userId;
            const [cartRows] = await db.promise().query(
                `SELECT ci.cart_item_id, pv.variant_id, pv.product_id, p.name AS product_name, pv.color, 
                 pv.size, pv.price, p.base_price, p.image_url, ci.quantity 
                 FROM cart_items ci
                 JOIN cart c ON ci.cart_id = c.cart_id
                 JOIN product_variants pv ON ci.variant_id = pv.variant_id
                 JOIN products p ON pv.product_id = p.product_id
                 WHERE c.user_id = ?`,
                [userId]
            );

            cartProduct = cartRows;
        } else {
            // Nếu người dùng chưa đăng nhập, lấy giỏ hàng từ cookie
            const cart = JSON.parse(req.cookies.cart || '[]');
            console.log('Giỏ hàng trong cookie:', cart); // Kiểm tra dữ liệu giỏ hàng từ cookie

            if (cart.length > 0) {
                const variantId = cart.map(item => item.variant_id);

                const [variantRows] = await db.promise().query(
                    `SELECT pv.variant_id, pv.product_id, p.name AS product_name, pv.color, pv.size, pv.price, 
                     p.base_price, p.image_url 
                     FROM product_variants pv
                     JOIN products p ON pv.product_id = p.product_id
                     WHERE pv.variant_id IN (?)`,
                    [variantId]
                );

                cartProduct = variantRows.map(variant => {
                    const itemSession = cart.find(item => item.variant_id === variant.variant_id);
                    return {
                        ...variant,
                        quantity: itemSession.quantity
                    };
                });
            }

            // Tính tổng giỏ hàng từ cookie
            cartProduct.forEach(product => {
                total += product.quantity * product.base_price; // Tính tổng giỏ hàng (quantity * price)
            });
        }

        // Kiểm tra giá trị tổng
        console.log('Tổng giỏ hàng:', total);

        // Format lại giá trị base_price cho dễ nhìn
        cartProduct.forEach(product => {
            product.base_price = new Intl.NumberFormat('en-US').format(parseFloat(product.base_price)) + 'đ';  
        });

        // Format tổng giỏ hàng
        total = new Intl.NumberFormat('en-US').format(total) + 'đ';

        // Trả về dữ liệu cho view
        res.render('shoppingcart', { cartProduct, total });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while fetching the cart.');
    }
});





router.post('/removeCart', (req, res) => {
    const { variant_id } = req.body; // lay bien the cua sp can xoa

    if (!variant_id) {
        return res.status(400).send('Variant ID is required');
    }

    // neu nguoi dung da dang nhap thi xoa bang db
    if (req.session.userId) {
        const userId = req.session.userId;

        db.promise().query('SELECT cart_id FROM cart WHERE user_id = ?', [userId])
            .then(([cartRows]) => {
                if (cartRows.length > 0) {
                    const cartId = cartRows[0].cart_id;

                    db.promise().query(
                        'DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?',
                        [cartId, variant_id]
                    );

                    console.log(`Sản phẩm với variant_id ${variant_id} đã được xóa khỏi giỏ hàng của người dùng ${userId}.`);
                } else {
                    console.log('The cart not existent for this user.');
                }
                res.redirect('/cart');
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('An error occurred while removing the product from the cart.');
            });
    } else {
        const variantIdToRemove = Number(variant_id); // chuyen thanh so tuong ung voi id bien the cua sp

        if (req.cookies.cart) {
            let cart = JSON.parse(req.cookies.cart);

            const index = cart.findIndex(item => item.variant_id === variantIdToRemove); // so sanh kieu du lieu voi bien the sp tuong ung
            if (index !== -1) {
                // neu sp co trong gio thi xoa
                cart.splice(index, 1);
                console.log(`Sản phẩm với variant_id ${variantIdToRemove} đã được xóa khỏi giỏ hàng.`);

                // cap nhap lai cookie
                res.cookie('cart', JSON.stringify(cart), { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }); 
            } else {
                console.log(`Sản phẩm với variant_id ${variantIdToRemove} không có trong giỏ hàng.`);
            }
        } else {
            console.log('Giỏ hàng không tồn tại trong cookie.');
        }

        res.redirect('/cart');
    }
});




module.exports = router;