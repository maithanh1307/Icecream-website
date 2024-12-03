require('dotenv').config();
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,    
    user: process.env.DB_USER,    
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,   
    port: process.env.DB_PORT,    
});

connection.connect((err) => {
    if (err) {
        console.error('Loi khi ket noi sql:', err);
    } else {
        console.log('ket noi thanh cong');
    }
});


module.exports = connection;
