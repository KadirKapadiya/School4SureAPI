// Load required packages
var azure = require('azure-storage');
var uuid = require('node-uuid');
var entGen = azure.TableUtilities.entityGenerator;

var bcrypt = require('bcrypt-nodejs');

var POLICIES_TABLE_NAME = 'Policies';

var POLICY_ACT_TABLE_NAME = 'PolicyHolderActivity';

var POLICY_STAT_TABLE_NAME = 'PolicyHolderStats';

var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);

function queryWithContinuation(query, tablename, cb) {
    tableSvc.queryEntities(tablename, query,null, function(error, entities, continuationToken){
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

var checkIfRowExists = function(tableName, partKey, rowKey) {
    return new Promise(function (resolve, reject) {
        var query = new azure.TableQuery().select().where('PartitionKey eq ? and RowKey eq ?', partKey, rowKey);
        queryWithContinuation(query, tableName, function (error, results) {
            if (!error) {
                if(results)
                {
                    if(results.entries) {
                        if (results.entries.length > 0) {
                            resolve(results);
                        }else {
                            reject(Error('0|No existing records found'));
                        }
                    }else
                    {
                        reject(Error('0|No existing records found'));
                    }
                }else {
                    reject(Error('0|No existing records found'));
                }
            }
            else {
                reject(Error('91|' + error.toString()));
            }

        });
    });
};

function PolicySchema(){}

PolicySchema.prototype.policyid = '';
PolicySchema.prototype.underwriter = '';
PolicySchema.prototype.termsurl = '';
PolicySchema.prototype.policyduration = '';
PolicySchema.prototype.viewrequirement = '';
PolicySchema.prototype.dailyviewrequirement = '';
PolicySchema.prototype.policydocsurl = '';

PolicySchema.prototype.findPolicies = function (cb){
    var query = new azure.TableQuery().select().where('PartitionKey eq ?', 'UserNames');
    queryWithContinuation(query, POLICIES_TABLE_NAME, function(error, results){
        cb(error, results);
    });
};

PolicySchema.prototype.calculateAndReturnStats = function (profileid, policyid, callback) {
    var holder = this;
    var uqKey = uuid.v4();
    var entGen = azure.TableUtilities.entityGenerator;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var theMonth = year + "-" + month;

    //Ok do lookuo
    var partKey = profileid + "_" + policyid;
    var rowKey = theMonth;

    checkIfRowExists(POLICY_STAT_TABLE_NAME, partKey, rowKey)
        .then(function successHandler(result) {
            //Does exist - so return
            callback(null, {
                Month: result.entries[0].Month._,
                Progress: result.entries[0].Progress._,
                Number: result.entries[0].Number._,
                Status: result.entries[0].Status._,
                Life: result.entries[0].Life._,
                Expiry: result.entries[0].Expiry._
            });
        }, function failureHandler(error) {
            //Does not exist - so return
            callback(error,null);
        });
};

PolicySchema.prototype.updateAuditTrail = function (profileid, policyid, contentid, action, callback) {
    var holder = this;
    var uqKey = uuid.v4();
    var entGen = azure.TableUtilities.entityGenerator;
    var holderEntity = {
        PartitionKey: entGen.String(profileid + "_" + policyid),
        RowKey: entGen.String(contentid +"_" + uqKey),
        ProfileId: entGen.String(profileid),
        PolicyId: entGen.String(policyid),
        ContentId: entGen.String(contentid),
        Action: entGen.String(action),
        CreationDate: entGen.DateTime(new Date()),
        LastUpdate: entGen.DateTime(new Date())
    };

    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);
    tableSvc.insertOrReplaceEntity(POLICY_ACT_TABLE_NAME, holderEntity, function (error, result, response) {
        if (!error) {
            // Entity inserted or replaced
            callback();
        } else {
            callback(error);
        }
    });
};

// Export the Policy model
module.exports = PolicySchema;