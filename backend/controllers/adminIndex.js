const express = require('express');
const db = require('../models/index.js'); 

const router = express.Router();

router.get('/', (req, res) => {
    // tong so nguoi dung
    const customerQuery = "SELECT COUNT(*) AS count FROM users WHERE role = 'customer'";

    // tong doanh thu va don hang
    const revenueAndOrdersQuery = `
        SELECT 
            COUNT(DISTINCT o.order_id) AS total_orders, 
            COALESCE(SUM(o.total_price), 0) AS total_revenue 
        FROM orders o
    `;

    // best selling
    const bestSellingQuery = `
        SELECT p.name, SUM(oi.quantity) AS total_quantity
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.variant_id
        JOIN products p ON pv.product_id = p.product_id
        GROUP BY p.name
        ORDER BY total_quantity DESC
        LIMIT 5;
    `;

    // doanh thu va so luong don hang theo tuan
    const weeklyDataQuery = `
        SELECT 
            YEARWEEK(o.created_at, 1) AS week, 
            SUM(o.total_price) AS total_revenue, 
            COUNT(o.order_id) AS total_orders
        FROM orders o
        GROUP BY week
        ORDER BY week ASC;
    `;

    db.query(customerQuery, (err, customerResults) => {
        if (err) {
            console.error('Error querying customer count:', err);
            return res.status(500).send('Internal Server Error');
        }

        db.query(revenueAndOrdersQuery, (err, revenueResults) => {
            if (err) {
                console.error('Error querying revenue and orders:', err);
                return res.status(500).send('Internal Server Error');
            }

            db.query(bestSellingQuery, (err, bestSellingResults) => {
                if (err) {
                    console.error('Error querying best-selling products:', err);
                    return res.status(500).send('Internal Server Error');
                }

                db.query(weeklyDataQuery, (err, weeklyResults) => {
                    if (err) {
                        console.error('Error querying weekly data:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Lấy dữ liệu sản phẩm bán chạy nhất
                    const bestSellingNames = bestSellingResults.map(row => row.name);
                    const bestSellingQuantities = bestSellingResults.map(row => row.total_quantity);

                    // Lấy dữ liệu doanh thu và đơn hàng theo tuần
                    const weeks = weeklyResults.map(row => row.week);
                    const revenues = weeklyResults.map(row => row.total_revenue);
                    const orders = weeklyResults.map(row => row.total_orders);

                    revenueResults[0].total_revenue = Math.round(revenueResults[0].total_revenue); 
                    revenueResults[0].total_revenue = revenueResults[0].total_revenue.toLocaleString('en-US') + 'đ';

                    // Render view với dữ liệu
                    res.render('AdminIndex', { 
                        customerCount: customerResults[0].count, 
                        totalOrders: revenueResults[0].total_orders, 
                        totalRevenue: revenueResults[0].total_revenue,
                        bestSellingNames: JSON.stringify(bestSellingNames),
                        bestSellingQuantities: JSON.stringify(bestSellingQuantities),
                        weeks: JSON.stringify(weeks),
                        revenues: JSON.stringify(revenues),
                        orders: JSON.stringify(orders)
                    });
                });
            });
        });
    });
});

module.exports = router;
