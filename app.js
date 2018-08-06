// Main
var express = require("express");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Session
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var crypto = require("crypto");
var MongoStore = require('connect-mongo')(session);
var FacebookStrategy = require("passport-facebook");
var TwitterStrategy = require("passport-twitter");

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
mongoose.connect(process.env.MONGODB_URI);

app.use(session({
  secret: process.env.SECRET,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

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

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ["id", "displayName", "photos"]
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, { username: profile.displayName, phone: process.env.FROM_PHONE, pictureURL: profile.photos[0].value },
      function (err, user) {
        return cb(err, user);
      }
    );
  }
));

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    profileFields: ["id", "displayName", "photos"]
  },
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({ twitterId: profile.id }, { username: profile.displayName, phone: process.env.FROM_PHONE, pictureURL: profile.photos[0].value },
      function (err, user) {
        return cb(err, user);
      }
    );
  }
));

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
