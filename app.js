// Main
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Session
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require("crypto");

// Routes
var routes = require('./routes/index');
var auth = require('./routes/auth');

// Models
var models = require('./models/models');
var User = models.User;

var app = express();

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport
app.use(session({ secret: 'This is a very secret message.' }));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// sha256 Hashing For Passwords
var hashPassword = function(password) {
  var hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
}

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function (err, user) {
    if (err)
    {
      console.log(err);
      return done(err);
    }

    if (!user)
    {
      return done(null, false);
    }

    if (user.password !== hashPassword(password))
    {
      return done(null, false);
    }

    return done(null, user);
  });
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', auth(passport));
app.use('/', routes);

// Catch 404 and Forward to Error Handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error Handlers

// Development Error Handler
// Will Print Stacktraces
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production Error Handler
// No Stacktraces Leaked to User
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Listening on Port: " + port );

module.exports = app;
