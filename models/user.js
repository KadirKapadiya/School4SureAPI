// Load required packages
var azure = require('azure-storage');
var entGen = azure.TableUtilities.entityGenerator;

var bcrypt = require('bcrypt-nodejs');

var TABLE_NAME = 'Users';
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);

function queryWithContinuation(query, cb) {
    tableSvc.queryEntities(TABLE_NAME, query,null, function(error, entities, continuationToken){
        if (continuationToken.nextPartitionKey) {
            nextPage(error, entities, continuationToken, cb);
        } else {
            cb(error, entities);
        }
    });
}

// used to recursively retrieve the results
function nextPage(error, entities, continuationToken, cb){
    continuationToken.getNextPage(function(error, results, newContinuationToken){
        entities = entities.concat(results);
        if (newContinuationToken.nextPartitionKey){
            nextPage(error, entities, newContinuationToken, cb);
        } else {
            cb(error, entities);
        }
    });
}


function UserSchema(){}

UserSchema.prototype.username = '';
UserSchema.prototype.password = '';

UserSchema.prototype.find = function (cb){
    var query = new azure.TableQuery().select().where('PartitionKey eq ?', 'UserNames');
    queryWithContinuation(query, function(error, results){
        cb(error, results);
    });
};

UserSchema.prototype.findOne = function (username, cb) {
    tableSvc.retrieveEntity(TABLE_NAME, 'UserNames', username, function (error, result, response) {
        if (!error) {
            // result contains the entity

            var returnVal = new UserSchema();
            returnVal.username = result.RowKey._;
            returnVal.password = result.Password._;

            cb(null, returnVal);
        } else {
            cb(null, null);
        }
    });
};

UserSchema.prototype.verifyPassword = function (password, cb) {
    var user = this;
    var pwd = '' + password;
    bcrypt.compare(pwd, user.password, cb);
};

UserSchema.prototype.passwordChanged = function () {
    var user = this;
    return true;
};

// Execute before each user.save() call
UserSchema.prototype.save = function (callback) {
    var user = this;
    
    // Break out if the password hasn't changed
    if (!user.passwordChanged()) return callback();
    
    // Password changed so we need to hash it
    bcrypt.genSalt(5, function (err, salt) {
        if (err) return callback(err);
        
        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return callback(err);
            user.password = hash;
            //save here
            var entGen = azure.TableUtilities.entityGenerator;
            var userEntity = {
                PartitionKey: entGen.String('UserNames'),
                RowKey: entGen.String(user.username),
                Password: entGen.String(user.password),
                CreationDate: entGen.DateTime(new Date())
            };
            var retryOperations = new azure.ExponentialRetryPolicyFilter();
            var tableSvc = azure.createTableService().withFilter(retryOperations);
            tableSvc.insertEntity(TABLE_NAME,userEntity, function (error, result, response) {
                if(!error){
                    // Entity inserted
                    callback();
                }else {
                    callback(error);
                }
            });
        });
    });
};

// Export the Mongoose model
module.exports = UserSchema;