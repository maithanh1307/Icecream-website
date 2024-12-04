const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const express = require('express');
const router = express.Router();
require('dotenv').config();

let userProfile;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    function (profile, done) {
      userProfile = profile;
      return done(null, userProfile);
    }
  )
);


router.get('/',
    passport.authenticate('google', { scope: ['profile', 'email'] }
));

router.get('/callback', passport.authenticate('google', { failureRedirect: '/login/google/error' }), (req, res) => {
    res.redirect('/'); 
});

router.get('/error', (req, res) => res.send('Error logging in via Google..'));


module.exports = router;
