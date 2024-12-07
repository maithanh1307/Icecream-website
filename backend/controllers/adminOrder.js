const express = require('express');
const db = require('../models/index.js');
const router = express.Router();

router.get('/', async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 20;
    const offset = (currentPage - 1) * itemsPerPage;

    try {
        const [[{ totalOrders }]] = await db.promise().query(
            'SELECT COUNT(*) AS totalOrders FROM orders'
        );

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        const [orders] = await db.promise().query(
            `SELECT order_id, user_id, total_price, status, created_at
            FROM orders
            ORDER BY order_id DESC
            LIMIT ? OFFSET ?;`,
            [itemsPerPage, offset]
        );

        orders.forEach(order => {
            let total = parseFloat(order.total_price);
            if (!isNaN(total)) {
                // Định dạng tổng giá trị đơn hàng theo kiểu Việt Nam với dấu phẩy phân cách nghìn
                order.total_price = new Intl.NumberFormat('en-US').format(total) + 'đ'; // 60,000đ
            } else {
                console.error('Invalid total_price value:', order.total_price);
            }
        });

        res.render('AdminOrder', {
            orders,
            totalPages,
            currentPage,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching orders.',
        });
    }
});

router.get('/edit', async(req, res) => {
    const orderId = req.query.order_id; 
    try {
        const [orders] = await db.promise().query(
            `SELECT order_id, user_id, total_price, status, created_at from orders WHERE order_id = ?;`, [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).send("order not found.");
        }

        const createdAt = orders[0].created_at.toISOString().split('T')[0];
        // dd/mm/yyyy
        const displayDate = new Date(orders[0].created_at);
        const day = String(displayDate.getDate()).padStart(2, '0');
        const month = String(displayDate.getMonth() + 1).padStart(2, '0');
        const year = displayDate.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        console.log('Order data for editing:', orders[0]);
        res.render('AdminOrder', { 
            orderEdit: { 
                ...orders[0], 
                created_at: createdAt,
                formatted_date: formattedDate 
            } 
        });  
    } 
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching order.',
        });
    }
})

router.post('/editOrder', async (req, res) => {
    console.log('Data received from form:', req.body); // Log kiểm tra
    const { order_id, status } = req.body;
    try {
        await db.promise().query(
            `UPDATE orders SET status = ? WHERE order_id = ?`,
            [status, order_id]
        );
        res.redirect('/admin/manageOrder');
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send('Failed to update order');
    }
});

router.get('/view-order', async (req, res) => {
    const orderId = req.query.order_id; // Lấy order_id từ query parameters
    if (!orderId) {
        return res.status(400).send('Order ID is required.');
    }

    try {
        // Lấy thông tin đơn hàng và thông tin người dùng
        const [orderDetails] = await db.promise().query(`
            SELECT o.order_id, o.total_price, o.status, o.created_at, u.username
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?`, [orderId]
        );

        if (orderDetails.length === 0) {
            return res.status(404).send("Order not found.");
        }

        const order = orderDetails[0];

        // Lấy thông tin địa chỉ và số điện thoại từ bảng addresses
        const [addressDetails] = await db.promise().query(`
            SELECT a.address, a.phone
            FROM addresses a
            WHERE a.user_id = ?`, [order.user_id]
        );

        const address = addressDetails.length > 0 ? addressDetails[0] : { address: 'No address available', phone: 'No phone available' };

        // Lấy thông tin chi tiết các sản phẩm trong đơn hàng kèm theo giá base_price từ bảng products
        const [orderItems] = await db.promise().query(`
            SELECT oi.quantity, oi.price, p.name, p.image_url, p.base_price
            FROM order_items oi
            JOIN products p ON oi.variant_id = p.product_id
            WHERE oi.order_id = ?`, [orderId]
        );

        // Định dạng lại tổng giá trị
        order.total_price = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total_price);

        // Chuyển đổi thời gian tạo đơn hàng sang định dạng dễ đọc
        const formattedDate = new Date(order.created_at).toLocaleString('vi-VN');

        // Render giao diện với thông tin đơn hàng
        res.render('AdminOrderDetails', { 
            order, 
            address, 
            orderItems, 
            formattedDate 
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching order details.',
        });
    }
});
 



module.exports = router;
