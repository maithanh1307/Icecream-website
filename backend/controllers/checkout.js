const express = require('express');
const bcrypt = require('bcrypt'); // Mã hóa mật khẩu
const db = require('../models/index.js'); // Kết nối cơ sở dữ liệu
const cookieParser = require('cookie-parser');

const router = express.Router();
router.use(cookieParser());

// Route hiển thị form checkout
router.get('/', async (req, res) => {
    const cartCookie = req.cookies.cart || '[]';
    const total = req.cookies.total || 0;
    const cart = JSON.parse(cartCookie);
    console.log('total truoc khi pay: ', total)

    // Kiểm tra xem người dùng đã đăng nhập chưa
    const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    res.render('checkout', {
        user, // Truyền thông tin người dùng đã đăng nhập (nếu có)
        total,
        cart,
        message: null, // Không có thông báo ban đầu
    });
});

router.post('/pay', async (req, res) => {
    const { email, username, phone, address } = req.body; // Dữ liệu từ form
    console.log('POST /checkout/pay - Dữ liệu nhận được:', { email, username, phone, address });

    const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : []; // Lấy giỏ hàng từ cookie
    let total = req.cookies.total || 0;
    console.log('total: ', total)

    // **Điều chỉnh giá trị total nếu cần**
    if (typeof total === 'string') {
        // Loại bỏ các ký tự không phải số và chuyển thành số nguyên
        total = parseFloat(total.replace(/[^\d.]/g, '')) || 0;
    }
    console.log('total (converted):', total);

    const connection = db.promise(); // Use the connection instance directly for transactions

    try {
        await connection.beginTransaction(); // Start the transaction

        // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        
        let userId;
        if (existingUser.length > 0) {
            console.log(`POST /checkout/pay - Email "${email}" đã tồn tại. Thực hiện thanh toán.`);
            userId = existingUser[0].user_id; // Lấy user_id từ bảng users
        } else {
            // Nếu người dùng chưa tồn tại, tạo tài khoản mới
            const defaultPassword = '123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Mã hóa mật khẩu
            const [result] = await connection.query(
                'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                [email, username, hashedPassword]
            );
            userId = result.insertId; // Lấy user_id của người dùng mới
            console.log(`POST /checkout/pay - Tạo tài khoản mới cho email "${email}".`);

            // Sau khi tạo user, thêm địa chỉ và số điện thoại vào bảng addresses
            await connection.query(
                'INSERT INTO addresses (user_id, address, phone) VALUES (?, ?, ?)',
                [userId, address, phone]
            );
            console.log(`POST /checkout/pay - Thêm địa chỉ và số điện thoại cho user_id "${userId}".`);
        }

        // Kiểm tra và lưu địa chỉ vào bảng addresses
        const [existingAddress] = await connection.query(
            'SELECT * FROM addresses WHERE user_id = ? AND address = ?',
            [userId, address]
        );

        if (existingAddress.length === 0) {
            // Nếu địa chỉ chưa tồn tại, thêm vào bảng addresses
            await connection.query(
                'INSERT INTO addresses (user_id, address, phone) VALUES (?, ?, ?)',
                [userId, address, phone]
            );
            console.log(`POST /checkout/pay - Đã lưu địa chỉ mới cho user_id "${userId}".`);
        } else {
            console.log(`POST /checkout/pay - Địa chỉ đã tồn tại, không cần lưu lại.`);
        }

        // Tạo đơn hàng trong bảng orders
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
            [userId, total, 'pending']
        );
        const orderId = orderResult.insertId; // Lấy order_id của đơn hàng mới

        // Thêm các mục trong giỏ hàng vào bảng order_items
        for (const item of cart) {
            const { variant_id, quantity } = item; // Lấy dữ liệu từ từng mục giỏ hàng

            // Truy vấn để lấy base_price từ bảng products
            const [productInfo] = await connection.query(
                'SELECT p.base_price FROM products p JOIN product_variants pv ON p.product_id = pv.product_id WHERE pv.variant_id = ?',
                [variant_id]
            );

            if (productInfo.length === 0) {
                throw new Error(`Product variant with ID ${variant_id} not found`);
            }

            const basePrice = productInfo[0].base_price;

            // Thêm sản phẩm vào order_items
            await connection.query(
                'INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, variant_id, quantity, basePrice]
            );
        }

        // console.log('Order ite,: ', {orderId, variant_id})
        // console.log("Address: ", {address, phone})

        await connection.commit(); // Commit the transaction

        // Thành công
        console.log(`POST /checkout/pay - Thanh toán thành công. Đơn hàng #${orderId} đã được tạo.`);
        return res.render('checkout', {
            user: { email, username }, // Truyền lại thông tin người dùng
            total: 0, // Đặt lại tổng tiền sau khi thanh toán
            cart: [], // Xóa giỏ hàng
            message: `Checkout successful! Order has been created.`,
        });
    } catch (err) {
        console.error('POST /checkout/pay - Lỗi xảy ra:', err);
        await connection.rollback(); // Rollback the transaction on error
        return res.render('checkout', {
            user: null,
            total: req.cookies.total || 0,
            cart: req.cookies.cart ? JSON.parse(req.cookies.cart) : [],
            message: 'An error occurred during checkout. Please try again.',
        });
    }
});


module.exports = router;
