// Load required packages
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.postUsers = function (req, res) {
    var user = new User();

        user.username= req.body.username;
        user.password= req.body.password;
    
    user.save(function (err) {
        if (err)
            res.send(err);

        res.json({ message: 'New user added!' });
    });
};

// Create endpoint /api/users for GET
exports.getUsers = function (req, res) {
    //res.json('[{username:test,password:password}]');
    var user = new User();
    user.find(function (err, users) {
        if (err)
            res.send(err);

        res.json(users);
    });
};