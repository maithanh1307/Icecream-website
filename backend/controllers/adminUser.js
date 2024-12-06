const express = require('express');
const db = require('../models/index.js'); 
var router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [users] = await db.promise().query(
            `SELECT user_id, username, email, status, role from users;`
        );
        res.render('AdminUser', {users})
    } 
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching users.',
        });
    }
})

router.get('/edit', async(req, res) => {
    const userId = req.query.user_id; 
    try {
        const [users] = await db.promise().query(
            `SELECT user_id, username, email, status, role from users WHERE user_id = ?;`, [userId]
        );

        if (users.length === 0) {
            return res.status(404).send("User not found.");
        }

        console.log('User data for editing:', users[0]);
        res.render('AdminUser', { usersEdit: users[0] || {} });    
    } 
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching users.',
        });
    }
})

router.post('/editUser', async (req, res) => {
    console.log('Data received from form:', req.body); // Log kiểm tra
    const { user_id, status, role } = req.body;
    try {
        await db.promise().query(
            `UPDATE users SET status = ?, role = ? WHERE user_id = ?`,
            [status, role, user_id]
        );
        res.redirect('/admin/manageUser');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Failed to update user');
    }
});


module.exports = router;