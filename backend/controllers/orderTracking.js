const express = require('express');
const db = require('../models/index');
const cookieParser = require('cookie-parser');

const router = express.Router();
router.use(cookieParser());

router.get('/', (req, res) => {
    const userCookie = req.cookies.user;

    if (!userCookie) {
        return res.render('orderTracking', { orders: null, error: 'Please log in to view your orders.' });
    }

    const user = JSON.parse(userCookie);

    // Truy vấn danh sách đơn hàng của người dùng
    const queryOrders = `
        SELECT orders.order_id, orders.created_at, orders.status
        FROM orders
        WHERE orders.user_id = ?;
    `;

    db.execute(queryOrders, [user.user_id], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).render('orderTracking', { orders: null, error: 'Error retrieving orders' });
        }

        // Chuyển danh sách đơn hàng thành array
        const orders = results.map((row) => ({
            order_id: row.order_id,
            created_at: row.created_at,
            status: row.status,
        }));

        // Render trang với dữ liệu đơn hàng
        res.render('orderTracking', { orders, error: null });
    });
});

// Route lấy thông tin chi tiết đơn hàng
router.get('/orderDetail/:orderId', (req, res) => {
    const orderId = req.params.orderId;

    // Truy vấn chi tiết đơn hàng bao gồm username
    const queryOrderDetail = `
        WITH RankedAddresses AS (
            SELECT 
                address, phone, user_id,
                ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
            FROM addresses
        )
        SELECT  
            orders.order_id, 
            orders.created_at AS receive_date, 
            orders.total_price, 
            ra.address, 
            ra.phone,
            users.username,
            order_items.quantity, 
            order_items.price,
            products.name AS product_name, 
            products.image_url
        FROM orders
        INNER JOIN users ON orders.user_id = users.user_id 
        INNER JOIN RankedAddresses ra ON orders.user_id = ra.user_id AND ra.rn = 1
        INNER JOIN order_items ON orders.order_id = order_items.order_id
        INNER JOIN product_variants ON order_items.variant_id = product_variants.variant_id
        INNER JOIN products ON product_variants.product_id = products.product_id
        WHERE orders.order_id = ?;

    `;
    
    db.execute(queryOrderDetail, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).render('orderDetail', { order: null, error: 'Error retrieving order details.' });
        }

        if (results.length === 0) {
            return res.render('orderDetail', { order: null, error: 'Order not found.' });
        }

        // Gom dữ liệu vào một đối tượng
        const order = {
            order_id: results[0].order_id,
            receive_date: results[0].receive_date,
            total_price: results[0].total_price,
            address: results[0].address,
            phone: results[0].phone,
            items: results.map(row => ({
                name: row.product_name,
                image: row.image_url,
                quantity: row.quantity,
                price: row.price,
            })),
        };
        
        const user = {
            username: results[0].username,
        };

        res.render('orderDetail', { order, user, error: null }); 
    });
});

module.exports = router;
