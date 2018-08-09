// Load required packages
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

passport.use(new BasicStrategy(
    function (username, password, callback) {
        // Success
        var user = new User();
      //  return callback(null, user);
        user.findOne(username, function (err, retUser) {
            if (err) { return callback(err); }

            // No user found with that username
            if (!retUser) { return callback(null, false); }

            // Make sure the password is correct
            retUser.verifyPassword(password, function (err, isMatch) {
                if (err) { return callback(err); }

                // Password did not match
                if (!isMatch) { return callback(null, false); }

                // Success
                return callback(null, retUser);
            });
        });
    }
));

exports.isAuthenticated = passport.authenticate('basic', { session : false })