// Load required packages
var Content = require('../models/content');

exports.requestContent = function (req, res) {
    var methodName = req.query.requestId;

    var resp = function (retval) {
        this._d = retval;
    }
    var retVal = function (response, responseDescription, methodname, data) {
        this._response = response;
        this._responseDescription = responseDescription;
        this._MethodResult = data;
        this._MethodName = methodname;
    };

    var content = new Content();

    content.policyid = req.body.policyId;
    content.profileid = req.body.profileId;

    content.requestBatchId(
        function (err, result) {
            if (!err) {
                res.json(new resp(new retVal(0, 'Success', methodName,
                    {
                        requestid: result.requestid,
                        batchid: result.batchid,
                        requeststatus: "1"
                    }
                )));
            } else {
                res.json(new resp(new retVal(91, 'Failure', methodName, err.toString())));
            }
        });
};

exports.batchReady = function (req, res) {
    var methodName = req.query.requestId;


    var resp = function (retval) {
        this._d = retval;
    }
    var retVal = function (response, responseDescription, methodname, data) {
        this._response = response;
        this._responseDescription = responseDescription;
        this._MethodResult = data;
        this._MethodName = methodname;
    };

    var content = new Content();

    content.batchid = req.params.profileContentBatchId;
    content.profileid = req.query.profileContentProfileId;
    content.policyid = req.query.profileContentPolicyId;
    content.requestid = req.query.profileContentRequestId;

    content.checkIfBatchReady(function (err,result){
        if (!err) {
            var bstatus = parseInt(result.BatchStatus._);
            switch(bstatus) {
                case 1: {
                    res.json(new resp(new retVal(1, 'Failure', methodName,
                        'Batch not ready yet')
                    ));
                    break;
                }
                case 5: {
                    res.json(new resp(new retVal(1, 'Failure', methodName,
                        'Batch not ready yet')
                    ));
                    break;
                }
                default: {
                    //We don't really care for other states but 5
                    res.json(new resp(new retVal(0, 'Success', methodName,
                        {
                            requestid: result.RequestId._,
                            batchid: result.BatchId._,
                            batchstatus: result.BatchStatus._,
                            content: result.ContentList._.split(';')
                        })
                    ));
                    break;
                }
            }
         /*   if(bstatus != 5) {
                //We don't really care for other states but 5
                res.json(new resp(new retVal(0, 'Success', methodName,
                    {
                        requestid: result.RequestId._,
                        batchid: result.BatchId._,
                        batchstatus: result.BatchStatus._,
                        content: result.ContentList._.split(';')
                    })
                ));
            }else {
                res.json(new resp(new retVal(1, 'Failure', methodName,
                    'Batch not ready yet')
                ));
            }*/
        } else {
            res.json(new resp(new retVal(91, 'Failure', methodName, err.toString())));
        }
    });
};

exports.updateBatchStatus = function (req, res) {
    var methodName = req.query.requestId;

    var resp = function (retval) {
        this._d = retval;
    }
    var retVal = function (response, responseDescription, methodname, data) {
        this._response = response;
        this._responseDescription = responseDescription;
        this._MethodResult = data;
        this._MethodName = methodname;
    };

    var content = new Content();

    content.batchid = req.body.profileContentBatchId;
    content.profileid = req.body.profileContentProfileId;
    content.policyid = req.body.profileContentPolicyId;
    content.requestid = req.body.profileContentRequestId;
    content.batchstatus = req.body.profileContentBatchStatus;

    content.updateBatchStatus(
        function (err, result) {
            if (!err) {
                res.json(new resp(new retVal(0, 'Success', methodName,''
                    
                )));
            } else {
                res.json(new resp(new retVal(91, 'Failure', methodName, err.toString())));
            }
        });

};

exports.fetchContent = function (req, res) {
    var methodName = req.query.requestId;


    var resp = function (retval) {
        this._d = retval;
    }
    var retVal = function (response, responseDescription, methodname, data) {
        this._response = response;
        this._responseDescription = responseDescription;
        this._MethodResult = data;
        this._MethodName = methodname;
    };

    var content = new Content();

    content.contentid = req.params.profileContentId;
    content.batchid = req.query.profileContentBatchId;
    content.profileid = req.query.profileContentProfileId;
    content.policyid = req.query.profileContentPolicyId;

    content.fetchContentUrls(function (err,result){
        if (!err) {
            res.json(new resp(new retVal(0, 'Success', methodName,
                {
                    contentactionurl: result.Content_ActionURL._,
                    contentb64url: result.Content_B64URL._,
                    contentrawurl: result.Content_RawURL._,
                    contentid:result.ContentId._
                })
            ));
        } else {
            res.json(new resp(new retVal(91, 'Failure', methodName, err.toString())));
        }
    });

};
