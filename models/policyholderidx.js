// Load required packages
var azure = require('azure-storage');
var entGen = azure.TableUtilities.entityGenerator;

var TABLE_NAME_IDX = 'PolicyHolderIndex';

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

function PolicyHolderIdxSchema(){}

PolicyHolderIdxSchema.prototype.policyId = '';
PolicyHolderIdxSchema.prototype.policyHolderId = '';

PolicyHolderIdxSchema.prototype.save = function (callback) {
    var holder = this;
    //save here
    var entGen = azure.TableUtilities.entityGenerator;
    var holderEntity = {
        PartitionKey: entGen.String(holder.policyId),
        RowKey: entGen.String(holder.policyHolderId),
        PolicyId: entGen.String(holder.policyId),
        PolicyHolderId: entGen.String(holder.policyHolderId),
        CreationDate: entGen.DateTime(new Date())
    };

    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);
    tableSvc.insertOrReplaceEntity(TABLE_NAME_IDX,holderEntity, function (error, result, response) {
        if(!error){
            // Entity inserted or replaced
            callback();
        }else {
            callback(error);
        }
    });
};

// Export the Policy Holder model
module.exports = PolicyHolderIdxSchema;
