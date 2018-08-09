// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// Define our user detail schema
var TwoFactorSchema = new mongoose.Schema({
    msisdn: {
        type: String,
        unique: true,
        required: true
    },
    salt: {
        type: String
    },
    password: {
            type: String
    },
    expectedPassword: {
	        type: String
    }
});

TwoFactorSchema.methods.verifyPassword = function (salt, cb) {
	var record = this;

	bcrypt.hash(record.password, salt, null, function (err, hash) {
	            if (err) return cb(err);
	            if(hash.localeCompare(record.expectedPassword) == 0)
	            {
					//cool
					return cb(null, true);
				}
				return cb(null, false);
        });
};

// Export the Mongoose model
module.exports = mongoose.model('TwoFactor', TwoFactorSchema);