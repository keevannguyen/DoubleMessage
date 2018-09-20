var express = require("express");
var router = express.Router();
var crypto = require("crypto");
var models = require('../models/models');

var fromNumber = process.env.MY_TWILIO_NUMBER;

module.exports = function(passport) {
  // GET Homepage
  router.get("/", function(req, res, next) {
    if ( !req.user )
    {
      res.redirect("/welcome");
    }
    else
    {
      res.redirect("/contacts");
    }
  });

  router.get("/welcome", function(req, res, next) {
    res.render("welcome");
  });

  // GET Login Page
  router.get("/login", function(req, res, next) {
    res.render("login");
  });

  // POST Login Request
  router.post("/login", passport.authenticate("local", {
      successRedirect: "/contacts",
      failureRedirect: "/login"
  }));

  // Login through Facebook
  router.get('/auth/facebook', passport.authenticate('facebook'));

  router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful Authentication, Redirect to Home Page
      res.redirect('/contacts');
    }
  );

  // Login through Twitter
  router.get('/auth/twitter', passport.authenticate('twitter'));

  router.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful Authentication, Redirect to Home Page
      res.redirect('/');
    }
  );

  // GET Signup Page
  router.get("/signup", function(req, res, next) {
    res.render("signup");
  });

  // Signup Validation
  var validateSignup = function(userData) {
    return ( userData.username && userData.password && userData.passwordRepeat && userData.password === userData.passwordRepeat );
  };

  // sha256 Hashing For Passwords
  var hashPassword = function(password) {
    var hash = crypto.createHash("sha256");
    hash.update(password);
    return hash.digest("hex");
  }

  // POST Signup Request
  router.post("/signup", function(req, res, next) {
    if ( !validateSignup(req.body) )
    {
      res.status(400).send("Invalid Request");
    }
    else
    {
      new models.User({
        username: req.body.username,
        password: hashPassword(req.body.password),
        phone: fromNumber
      }).save( function(err){
        if(err)
        {
          console.log(err);
          res.status(500).redirect("/register");
        }
        else
        {
          res.redirect("/login");
        }
      });
    }
  });

  // GET Logout Request
  router.get("/logout", function(req, res, next) {
    req.logout();
    res.redirect('/welcome');
  });

  return router;
}
