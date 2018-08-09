// Load required packages
var azure = require('azure-storage');
var entGen = azure.TableUtilities.entityGenerator;

var TABLE_NAME = 'PolicyHolder';

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

function PolicyHolderSchema(){}

PolicyHolderSchema.prototype.profileid = '';
PolicyHolderSchema.prototype.name = '';
PolicyHolderSchema.prototype.surname = '';
PolicyHolderSchema.prototype.email = '';
PolicyHolderSchema.prototype.idnumber = '';
PolicyHolderSchema.prototype.cellnumber = '';
PolicyHolderSchema.prototype.country = '';
PolicyHolderSchema.prototype.profilestatus = '';
PolicyHolderSchema.prototype.policyid = '';
PolicyHolderSchema.prototype.policynumber = '';
PolicyHolderSchema.prototype.institution = '';

PolicyHolderSchema.prototype.findPolicyHolderByProfileId = function (appid, cb){
    var query = new azure.TableQuery().select().where('PartitionKey eq ?', appid);
    queryWithContinuation(query, TABLE_NAME, function(error, results){
        cb(error, results);
    });
};

PolicyHolderSchema.prototype.save = function (callback) {
    var holder = this;
    //save here
    var entGen = azure.TableUtilities.entityGenerator;
    var holderEntity = {
        PartitionKey: entGen.String(holder.profileid),
        RowKey: entGen.String(holder.policyid),
        PolicyNumber: entGen.String(holder.policynumber),
        Name: entGen.String(holder.name),
        Surname: entGen.String(holder.surname),
        Email: entGen.String(holder.email),
        IDPassportNumber: entGen.String(holder.idnumber),
        CellNumber: entGen.String(holder.cellnumber),
        Country: entGen.String(holder.country),
        ProfileStatus: entGen.String(holder.profilestatus),
        CreationDate: entGen.DateTime(new Date()),
        LastUpdate: entGen.DateTime(new Date()),
        Institution: entGen.String(holder.institution)
    };
   // holderEntity['.metadata'].etag = '*';//force update
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);
    tableSvc.insertOrReplaceEntity(TABLE_NAME,holderEntity, function (error, result, response) {
        if(!error){
            // Entity inserted or replaced
            callback();
        }else {
            callback(error);
        }
    });
};

// Export the Policy Holder model
module.exports = PolicyHolderSchema;