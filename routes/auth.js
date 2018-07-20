var express = require("express");
var router = express.Router();
var crypto = require("crypto");
var models = require('../models/models');

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
        password: hashPassword(req.body.password)
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
