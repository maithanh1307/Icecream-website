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


module.exports = router;
