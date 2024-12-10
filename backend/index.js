const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const port = process.env.PORT || 8080;
const db = require('./models')

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'frontend/views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session
app.use(session({
  secret: '123456', 
  resave: false,  
  saveUninitialized: true, 
  cookie: {
    secure: false,  
    httpOnly: true,  
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

var adminProductController = require('./controllers/adminProduct')
var userHomeController = require('./controllers/userHome')
var userProductController = require('./controllers/userProduct')
var loginController = require('./controllers/login')
var registerController = require('./controllers/register')
var cartController = require('./controllers/cart')
var checkoutController = require('./controllers/checkout')
var adminUserController = require('./controllers/adminUser')
var adminCouponController = require('./controllers/adminCoupon')
var accountController = require('./controllers/account')
var adminIndexController = require('./controllers/adminIndex')
var signoutController = require('./controllers/logout')
var orderTrackingController = require('./controllers/orderTracking')
var orderHistoryController = require('./controllers/orderHistory')
var adminOrderController = require('./controllers/adminOrder')


app.use('/admin/manageProduct', adminProductController)
app.use('/', userHomeController)
app.use('/product', userProductController)
app.use('/login', loginController)
app.use('/register', registerController)
app.use('/cart', cartController)
app.use('/orderTracking', orderTrackingController)
app.use('/orderHistory', orderHistoryController)

app.use('/checkout', checkoutController)
app.use('/admin/manageUser', adminUserController)
app.use('/admin/manageCoupon', adminCouponController)
app.use('/account', accountController)
app.use('/admin', adminIndexController)
app.use('/signout', signoutController)
app.use('/admin/manageOrder', adminOrderController)

app.listen(port, async () => {
    db.connect((err) => {
        if (err) {
          console.error('error db:', err);
          return;
        }
        console.log('connect successful');
    });
});