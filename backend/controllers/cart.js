const express = require('express');
const fs = require('fs')
const db = require('../models/index.js'); 
var router = express.Router();

router.post('/addCart', async (req, res) => {
    const { product_id } = req.body;

    try {
        console.log('Session ID:', req.sessionID);
        // lay thuoc tinh cua sp
        const [variantRows] = await db.promise().query(
            'SELECT variant_id FROM product_variants WHERE product_id = ? LIMIT 1',
            [product_id]
        );

        if (variantRows.length === 0) {
            return res.status(404).send('Variant not found for this product.');
        }

        const variant_id = variantRows[0].variant_id;
        const quantity = 1; 

        // nguoi đung da dang nhap
        if (req.session.userId) {
            const userId = req.session.userId;

            // check gio hang cua user da co chua
            const [cartRows] = await db.promise().query('SELECT * FROM cart WHERE user_id = ?', [userId]);

            let cartId;
            if (cartRows.length === 0) {
                const [result] = await db.promise().query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
                cartId = result.insertId;
            } else {
                cartId = cartRows[0].cart_id;
            }

            // them sp vao gio hang
            await db.promise().query(
                'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?) ' +
                'ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
                [cartId, variant_id, quantity]
            );

            return res.json({ success: true, message: 'Product added to cart successfully.' });
        }

        // neu nguoi dung chua dang nhap
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // kiem tra gio hang va them sp vao gio hang voi user id tuong ung o trong session
        const existingItem = req.session.cart.find(item => item.variant_id == variant_id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } 
        else {
            req.session.cart.push({ variant_id, quantity });
        }

        res.json({ success: true, message: 'Product added to cart successfully.' });
    } 
    catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while adding to cart.');
    }
})
module.exports = router