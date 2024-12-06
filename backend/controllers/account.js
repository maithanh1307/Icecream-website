const express = require('express');
const db = require('../models/index.js'); 
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');


const router = express.Router();
router.use(cookieParser());  

// Route hiển thị thông tin người dùng (Account)
router.get('/', (req, res) => {
    const userCookie = req.cookies.user;
  
    if (userCookie) {
      const user = JSON.parse(userCookie);  // Chuyển thông tin từ string về object
  
      // Truy vấn thông tin địa chỉ và số điện thoại từ bảng addresses
      const query = `SELECT * FROM addresses WHERE user_id = ?`;
  
      db.execute(query, [user.user_id], (err, results) => {
        if (err) {
          console.error('Error fetching address data:', err);
          return res.status(500).send('Error retrieving address data');
        }
  
        // Kiểm tra nếu có kết quả trả về
        if (results.length > 0) {
          const addressData = results[0];  // Lấy dữ liệu địa chỉ đầu tiên
          const userDetails = {
            username: user.username,
            email: user.email,
            address: addressData.address,
            phone: addressData.phone
          };
  
          // Hiển thị trang account với thông tin người dùng và địa chỉ
          res.render('user', { user: userDetails, error: null });
        } else {
          // Nếu không có địa chỉ, chỉ truyền thông tin người dùng
          const userDetails = {
            username: user.username,
            email: user.email,
            address: 'No address available',
            phone: 'No phone number available'
          };
  
          res.render('user', { user: userDetails, error: null });
        }
      });
    } else {
      // Nếu người dùng không đăng nhập, hiển thị thông báo lỗi
      res.render('user', { user: null, error: 'Please log in to view your account.' });
    }
});


router.post('/updatePassword', (req, res) => {
    const { currentPassword, newPassword, repeatNewPassword } = req.body;
    const userCookie = req.cookies.user;

    if (!userCookie) {
        return res.render('login', { error: 'Please log in to change your password.' });
    }

    const user = JSON.parse(userCookie);

    // Kiểm tra nếu mật khẩu mới và mật khẩu lặp lại không khớp
    if (newPassword !== repeatNewPassword) {
        return res.render('user', { error: 'New passwords do not match.' });
    }

    // Truy vấn mật khẩu đã mã hóa từ cơ sở dữ liệu
    const query = `SELECT password FROM users WHERE user_id = ?`;

    db.execute(query, [user.user_id], async (err, results) => {
        if (err) {
            return res.status(500).render('user', { error: 'Error fetching user data' });
        }

        if (results.length === 0) {
            return res.status(404).render('user', { error: 'User not found' });
        }

        const storedPassword = results[0].password;

        // So sánh mật khẩu hiện tại của người dùng với mật khẩu đã mã hóa trong cơ sở dữ liệu
        const isMatch = await bcrypt.compare(currentPassword, storedPassword);

        if (!isMatch) {
            return res.render('user', { error: 'Current password is incorrect.' });
        }

        // Mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateQuery = `UPDATE users SET password = ? WHERE user_id = ?`;

        db.execute(updateQuery, [hashedPassword, user.user_id], (err) => {
            if (err) {
                return res.status(500).render('user', { error: 'Error updating password' });
            }

            res.render('user', { success: 'Password updated successfully.' });
        });
    });
});


router.post('/updateAddress/:addressId', (req, res) => {
    const { phone, address } = req.body;
    const { addressId } = req.params;
    const userCookie = req.cookies.user;

    if (!userCookie) {
        return res.send('Please log in to update your address.');
    }

    const user = JSON.parse(userCookie);

    // Cập nhật địa chỉ và số điện thoại vào cơ sở dữ liệu
    const query = `UPDATE addresses SET phone = ?, address = ? WHERE address_id = ? AND user_id = ?`;

    db.execute(query, [phone, address, addressId, user.user_id], (err) => {
        if (err) {
            return res.status(500).send('Error updating address');
        }

        res.send('Address updated successfully.');
    });
});



  
  
  

module.exports = router;
