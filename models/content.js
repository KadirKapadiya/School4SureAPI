/**
 * Created by beukesgesin on 2016/06/24.
 */
// Load required packages
var azure = require('azure-storage');
var uuid = require('node-uuid');

var PCONTENT_RQ_TABLE_NAME = 'ProfileContentRequests';
var PCONTENT_BATCH_TABLE_NAME = 'ProfileContentBatches';
var PCONTENT_TABLE_NAME = 'ProfileContent';
var CONTENT_TABLE_NAME = 'Content';

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

var checkIfRowExists = function(profileId, policyId, requestId) {
    return new Promise(function (resolve, reject) {
        var query = new azure.TableQuery().select().where('PartitionKey eq ? and RowKey eq ?', profileId + "_" + policyId, requestId);
        queryWithContinuation(query, PCONTENT_RQ_TABLE_NAME, function (error, results) {
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

function ContentSchema(){}

ContentSchema.prototype.profileid = '';
ContentSchema.prototype.policyid = '';
ContentSchema.prototype.requestid = '';
ContentSchema.prototype.batchid = '';
ContentSchema.prototype.contentid = '';
ContentSchema.prototype.contenturl = '';
ContentSchema.prototype.contentb64url = '';
ContentSchema.prototype.batchstatus = '';
ContentSchema.prototype.requeststatus = '';

ContentSchema.prototype.requestBatchId = function (cb) {
    var content = this;
    var requestId = uuid.v4();
    var batchId = uuid.v4();
    var entGen = azure.TableUtilities.entityGenerator;
    var contentList = [];

    //2016/08/06 - Allocate content here - so batch always has content

    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);

    var query = new azure.TableQuery().select().where('PartitionKey eq ?', 'UserNames');
    queryWithContinuation(query, CONTENT_TABLE_NAME, function(error, results){
        if(!error) {
            results.entries.forEach(function (value) {

                contentList.push("UserNames|" +value.RowKey._);

                var profileContentEntity = {
                    PartitionKey: entGen.String(content.profileid + '_' + content.policyid + '|' + batchId),
                    RowKey: entGen.String("UserNames|" + value.RowKey._),
                    ContentId: entGen.String("UserNames|" + value.RowKey._),
                    Content_ActionURL: entGen.String(value.ActionURL._),
                    Content_B64URL: entGen.String(value.B64URL._),
                    Content_RawURL: entGen.String(value.RawURL._),
                    CreationDate: entGen.DateTime(new Date()),
                    LastUpdate: entGen.DateTime(new Date())
                };
                var retryOperations = new azure.ExponentialRetryPolicyFilter();
                var tableSvc = azure.createTableService().withFilter(retryOperations);
                tableSvc.insertEntity(PCONTENT_TABLE_NAME, profileContentEntity, function (error, result, response) {
                    if (!error) {
                        // Entity inserted or replaced

                    } else {
                        cb(error, null);
                    }
                });
            });

            var contentString = "";
            contentList.forEach(function (v){
                contentString += v +";";
            });

            //Ok next - profile content batch
            var profileContentBatchEntity = {
                PartitionKey: entGen.String(content.profileid + '_' + content.policyid + '|' + requestId),
                RowKey: entGen.String(batchId),
                RequestId: entGen.String(requestId),
                BatchId:entGen.String(batchId),
                ContentList: entGen.String(contentString),
                BatchStatus: entGen.String("2"),
                CreationDate: entGen.DateTime(new Date()),
                LastUpdate: entGen.DateTime(new Date())
            };
            var retryOperations = new azure.ExponentialRetryPolicyFilter();
            var tableSvc = azure.createTableService().withFilter(retryOperations);
            tableSvc.insertEntity(PCONTENT_BATCH_TABLE_NAME, profileContentBatchEntity, function (error, result, response) {
                if (!error) {
                    // Entity inserted or replaced

                } else {
                    cb(error, null);
                }
            });

            //Finally insert request
            var profileContentRequestEntity = {
                PartitionKey: entGen.String(content.profileid + "_" + content.policyid),
                RowKey: entGen.String(requestId),
                RequestId: entGen.String(requestId),
                BatchId: entGen.String(batchId),
                RequestStatus: entGen.String('1'),
                CreationDate: entGen.DateTime(new Date()),
                LastUpdate: entGen.DateTime(new Date())
            };
            var retryOperations = new azure.ExponentialRetryPolicyFilter();
            var tableSvc = azure.createTableService().withFilter(retryOperations);
            tableSvc.insertEntity(PCONTENT_RQ_TABLE_NAME, profileContentRequestEntity, function (error, result, response) {
                if (!error) {
                    // Entity inserted or replaced
                    content.requestid = requestId;
                    content.batchid = batchId;
                    content.requeststatus = "1";
                    cb(null, content);
                } else {
                    cb(error, null);
                }
            });

        }else
        {
            cb(error, null);
        }
    });
};

ContentSchema.prototype.checkIfBatchReady = function (cb) {
    var content = this;
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);
    tableSvc.retrieveEntity(PCONTENT_BATCH_TABLE_NAME, content.profileid + '_' + content.policyid + '|' + content.requestid, content.batchid, function(error, result, response){
        if(!error){
            // result contains the entity
            cb(null,result);
        }else {
            cb(error,null);
        }
    });
};

ContentSchema.prototype.updateBatchStatus = function (cb) {
    var content = this;

    var c = new ContentSchema();
    c.profileid = content.profileid;
    c.requestid = content.requestid;
    c.policyid = content.policyid;
    c.batchid = content.batchid;
    c.batchstatus = content.batchstatus;
    c.checkIfBatchReady(
        function (err, result) {
            //Should be !
            if (!err) {
                //result has the entity
                var entity = result;
                entity.BatchStatus._ = content.batchstatus;
                entity['.metadata'].etag = '*';//overwrite
                var retryOperations = new azure.ExponentialRetryPolicyFilter();
                var tableSvc = azure.createTableService().withFilter(retryOperations);
                tableSvc.replaceEntity(PCONTENT_BATCH_TABLE_NAME, entity, function (error, result, response) {
                    if (!error) {
                        // Entity inserted or replaced
                        cb(null, null);
                    } else {
                        cb(error, null);
                    }
                });
            }
        });
};

ContentSchema.prototype.fetchContentUrls = function (cb) {
    var content = this;
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    var tableSvc = azure.createTableService().withFilter(retryOperations);
    tableSvc.retrieveEntity(PCONTENT_TABLE_NAME, content.profileid + '_' + content.policyid + '|' + content.batchid, content.contentid, function(error, result, response){
        if(!error){
            // result contains the entity
            cb(null,result);
        }else {
            cb(error,null);
        }
    });
};


// Export the Policy model
module.exports = ContentSchema;