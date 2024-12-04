const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 8080;
const db = require('./models')

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'frontend/views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


var adminProductController = require('./controllers/adminProduct')
var userHomeController = require('./controllers/userHome')
var userProductController = require('./controllers/userProduct')

app.use('/admin/manageProduct', adminProductController)
app.use('/', userHomeController)
app.use('/product', userProductController)

app.listen(port, async () => {
    db.connect((err) => {
        if (err) {
          console.error('error db:', err);
          return;
        }
        console.log('connect successful');
    });
});