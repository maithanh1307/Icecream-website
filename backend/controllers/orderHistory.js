const express = require('express');
const db = require('../models/index');
const cookieParser = require('cookie-parser');

const router = express.Router();
router.use(cookieParser());

router.get('/', (req, res) => {
    const userCookie = req.cookies.user;

    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!userCookie) {
        return res.render('orderHistory', { orders: null, error: 'Please log in to view your orders.' });
    }

    const user = JSON.parse(userCookie);

    // Truy vấn danh sách đơn hàng của người dùng
    const queryOrders = `
        SELECT 
            orders.order_id, orders.created_at AS order_date, 
            orders.total_price
        FROM orders
        WHERE orders.user_id = ?
        ORDER BY orders.created_at DESC;
    `;

    db.execute(queryOrders, [user.user_id], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).render('orderHistory', { orders: null, error: 'Error retrieving orders' });
        }

        if (results.length === 0) {
            return res.render('orderHistory', { orders: null, error: 'No orders found.' });
        }

        const orders = results.map(row => ({
            order_id: row.order_id,
            order_date: row.order_date,
            total_price: row.total_price,
            items: [] // Khởi tạo mảng items
        }));

        // Truy vấn chi tiết sản phẩm cho từng đơn hàng
        const orderIds = orders.map(order => order.order_id);
        const queryItems = `
            SELECT 
                order_items.order_id, products.name AS product_name, 
                order_items.quantity, order_items.price
            FROM order_items
            JOIN products ON order_items.variant_id = products.product_id
            WHERE order_items.order_id IN (${orderIds.join(',')});
        `;

        db.execute(queryItems, [], (err, itemResults) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.status(500).render('orderHistory', { orders: null, error: 'Error retrieving order items' });
            }

            // gán sản phẩm vào đơn hàng tương ứng
            itemResults.forEach(item => {
                const order = orders.find(o => o.order_id === item.order_id);
                if (order) {
                    order.items.push({
                        name: item.product_name,
                        quantity: item.quantity,
                        price: item.price
                    });
                }
            });

            res.render('orderHistory', { orders, error: null });
        });
    });
});

router.post('/rate/:order_id', (req, res) => {
    const userCookie = req.cookies.user;

    // check user login
    if (!userCookie) {
        console.log('User not logged in.');
        return res.status(401).send('Please log in to rate orders.');
    }

    const user = JSON.parse(userCookie);
    const { order_id } = req.params;
    const ratings = req.body;

    console.log(`Received ratings for order_id: ${order_id}`);
    console.log('Ratings data:', ratings);

    const queries = [];
    for (const [key, value] of Object.entries(ratings)) {
        if (value.trim()) { // if have comment
            const productName = key.replace('rating_', '');
            const comment = value;

            console.log(`Preparing to save review for product: ${productName} with comment: ${comment}`);


            const query = `
                INSERT INTO reviews (product_id, user_id, comment)
                SELECT products.product_id, ?, ?
                FROM products
                WHERE products.name = ?
            `;
            queries.push(db.execute(query, [user.user_id, comment, productName]));
        }
    }

    Promise.all(queries)
        .then(() => {
            console.log('All reviews saved successfully.');
            res.redirect('/orderHistory');
        })
        .catch(err => {
            console.error('Error saving reviews:', err);
            res.status(500).send('Error saving reviews.');
        });
});

module.exports = router;
