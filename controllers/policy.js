// Load required packages
var Policy = require('../models/policy');
var PolicyHolder = require('../models/policyholder');
var PolicyHolderIdx = require('../models/policyholderidx');

exports.getPolicies = function (req, res) {
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

	var policy = new Policy();
	policy.findPolicies(function (err, policies) {
		if (err) {res.json(new resp(new retVal(91, 'Failure', methodName, '')));}

		results = [];

		policies.entries.forEach(function(value) {
            results.push(
                {
                    policyid: value.RowKey._,
                    underwriter: value.Underwriter._,
                    termsurl: value.TermsUrl._,
                    policyduration: value.Duration._,
                    viewrequirement: value.ViewRequirement._,
                    dailyviewrequirement: value.DailyViewRequirement._,
                    policydocsurl: value.PolicyDocsUrl._
                });
        });

		res.json(new resp(new retVal(0, 'Success', methodName, results)));
	});
};

exports.getPolicyStatsOld = function (req, res) {
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
	res.json(new resp(new retVal(91, 'Failure', methodName, '')));
};

exports.getPolicyStats = function (req, res) {
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

	var policy = new Policy();

	policy.calculateAndReturnStats(req.params.profileId,req.params.policyId,function (err,result) {
		if (err) {
			res.json(new resp(new retVal(91, 'Failure', methodName, '')));
		}

		res.json(new resp(new retVal(0, 'Success', methodName,
			{
				month: result.Month,
				progress: result.Progress,
				policyNumber: result.Number,
				policyStatus: result.Status,
				policyLife: result.Life,
				policyExpiry: result.Expiry
			})
		));
	});

};


exports.getPolicyAuditTrail = function (req, res) {
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

	var policy = new Policy();
	res.json(new resp(new retVal(91, 'Failure', methodName, '')));

};

exports.updatePolicyAuditTrail = function (req, res) {
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

	var policy = new Policy();

	policy.updateAuditTrail(req.body.profileId,req.body.policyId,req.body.contentId,req.body.action,function (err) {
		if (err) {
			res.json(new resp(new retVal(91, 'Failure', methodName, '')));
		}

		res.json(new resp(new retVal(0, 'Success', methodName, '')));
	});

};

exports.newPolicy = function (req, res) {
	var resp = function (retval) {
		this._d = retval;
	}
	var retVal = function (response, responseDescription, methodname, data) {
		this._response = response;
		this._responseDescription = responseDescription;
		this._MethodResult = data;
		this._MethodName = methodname;
	};

	//if (err) {
	//	console.error(err);
	res.json(new resp(new retVal(91, 'Failure', 'newPolicy', '')));
	//}
};

exports.getPolicyDetailsForRef = function (req, res) {
	var resp = function (retval) {
		this._d = retval;
	}
	var retVal = function (response, responseDescription, methodname, data) {
		this._response = response;
		this._responseDescription = responseDescription;
		this._MethodResult = data;
		this._MethodName = methodname;
	};

	//if (err) {
	//	console.error(err);
	res.json(new resp(new retVal(91, 'Failure', 'getPolicyDetailsForRef', '')));
	//}
};

exports.newPolicyHolder = function (req, res) {
    var methodName = req.query.requestId;
    var holder = new PolicyHolder();
    holder.profileid = req.body.profileid;
    holder.name = req.body.name;
    holder.surname = req.body.surname;
    holder.email = req.body.email;
    holder.idnumber = req.body.idnumber;
    holder.cellnumber = req.body.cellnumber;
    holder.country = req.body.country;
    holder.profilestatus = req.body.profilestatus;
    holder.policyid = req.body.policyid;
    holder.policynumber = req.body.policynumber;
    holder.institution = req.body.institution;

	var holderidx = new PolicyHolderIdx();
	holderidx.policyId = req.body.policyid;
	holderidx.policyHolderId = req.body.profileid;

    var resp = function (retval) {
        this._d = retval;
    }
    var retVal = function (response, responseDescription, methodname, data) {
        this._response = response;
        this._responseDescription = responseDescription;
        this._MethodResult = data;
        this._MethodName = methodname;
    };

    //Check if holder exists ...
    holder.findPolicyHolderByProfileId(holder.profileid, function(error, results)
	{
		if (!error) {
			if(results) {
				if (results.entries) {
					if (results.entries.length > 0) {
						holderidx.save(function (err) {
							if (err) {
								res.json(new resp(new retVal(91, 'Failure', methodName, '')));
							}

							res.json(new resp(new retVal(0, 'Success_Exists', methodName, '')));
						});
					} else {
						holder.save(function (err) {
							if (err) {
								res.json(new resp(new retVal(91, 'Failure', methodName, '')));
							}

							holderidx.save(function (err) {
								if (err) {
									res.json(new resp(new retVal(91, 'Failure', methodName, '')));
								}

								res.json(new resp(new retVal(0, 'Success', methodName, '')));
							});
						});
					}
				} else {
					holder.save(function (err) {
						if (err) {
							res.json(new resp(new retVal(91, 'Failure', methodName, '')));
						}

						holderidx.save(function (err) {
							if (err) {
								res.json(new resp(new retVal(91, 'Failure', methodName, '')));
							}

							res.json(new resp(new retVal(0, 'Success', methodName, '')));
						});
					});
				}
			}else {
				holder.save(function (err) {
					if (err) {
						res.json(new resp(new retVal(91, 'Failure', methodName, '')));
					}

					holderidx.save(function (err) {
						if (err) {
							res.json(new resp(new retVal(91, 'Failure', methodName, '')));
						}

						res.json(new resp(new retVal(0, 'Success', methodName, '')));
					});
				});
			}
		}else {
			res.json(new resp(new retVal(91, 'Failure', methodName, '')));
		}
	});

    //if (err) {
    //	console.error(err);
    
    //}
};