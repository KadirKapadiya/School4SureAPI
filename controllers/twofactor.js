// Load required packages
var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var TwoFactor = require('../models/twofactor');

if (typeof String.prototype.format != 'function') {
// This is the function.
String.prototype.format = function (args) {
	var str = this;
	return str.replace(String.prototype.format.regex, function(item) {
			var intVal = parseInt(item.substring(1, item.length - 1));
			var replace;
			if (intVal >= 0) {
				replace = args[intVal];
			} else if (intVal === -1) {
				replace = "{";
			} else if (intVal === -2) {
				replace = "}";
			} else {
				replace = "";
			}
			return replace;
		});
	};
	String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");
}
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

// Create endpoint /api/users for POST
exports.TwoFSendRequest = function (req, res) {
    var msisdn = req.body.msisdn;

    var resp = function(retval){
			this._d = retval;
		}
		var retVal = function (response,responseDescription,methodname,data) {
			this._response = response;
			this._responseDescription = responseDescription;
			this._MethodResult = data;
			this._MethodName = methodname;
		};

	//Check if already there - if so use that
	TwoFactor.findOne({ 'msisdn': msisdn}, function (err, record) {

		//Create two factor entry
		var twoFactorRecord = new TwoFactor({
			msisdn: req.body.msisdn
		});

		if (err)
		{
			//Already Exists
			twoFactorRecord = record;
		}
		else
		{
			if(record)
			{
				twoFactorRecord = record;
			}
		}

		twoFactorRecord.password = Math.random().toString(36).slice(-8);
		twoFactorRecord.password = twoFactorRecord.password + "/)>" + Math.random().toString(36).slice(-8);

		bcrypt.genSalt(10, function (err, salt) {
        	if (err) return callback(err);
			record.salt = "";

			bcrypt.hash(record.password, salt, null, function (err, hash) {
            if (err) return callback(err);
			record.expectedPassword = hash;
			twoFactorRecord.save(function (err) {
				if (err)
				{
					res.json(new resp(new retVal(91,'Failure','TwoFSendRequest',err)));
				}
				else
				{
					var msg = encodeURIComponent("+[IccidMEV]+" + salt);
					var url = "http://sms1.cardboardfish.com:9001/HTTPSMS?S=H&UN=<Username>&P=<Password>&DA={0}&SA=<From>&M={1}";
						url = url.format([msisdn,msg]);
						var data = {};
						request.post(
							url,
							data,
							function (error, response, body) {
								console.log(body);
								if (!error && response.statusCode == 200) {
									//Success
									res.json(new resp(new retVal(0,'Success','TwoFSendRequest',msisdn + ";" + "+[IccidMEV]+" )));
								}
								else
								{
									res.json(new resp(new retVal(response.statusCode,'Failure','TwoFSendRequest',error)));
								}
							});//end POST
				}//end else
			});//end twoFactor Save
			});//end hash
		});//end salt gen
	});//end findOne
};

exports.TwoFVerifyRequest = function (req, res) {
	var msisdn = req.params.msisdn;
	var salt = req.params.salt;

	var resp = function(retval) {
			this._d = retval;
	}
	var retVal = function (response,responseDescription,methodname,data) {
		this._response = response;
		this._responseDescription = responseDescription;
		this._MethodResult = data;
		this._MethodName = methodname;
	};

	TwoFactor.findOne({ 'msisdn': msisdn}, function (err, record) {
		if (err) { console.error(err); res.json(new resp(new retVal("91",'Failure','TwoFVerifyRequest',err))); }

		//Ok
		if(!record)
		{
			res.json(new resp(new retVal("91",'Failure','TwoFVerifyRequest',"Not Found")));
		}
		else
		{
			//Verify
			record.verifyPassword(salt, function (err, isMatch)
			{
				if (err) { console.error(err); res.json(new resp(new retVal("91",'Failure','TwoFVerifyRequest',err))); }
				else
				{
					if(isMatch)
					{
						res.json(new resp(new retVal("0",'Success','TwoFVerifyRequest',msisdn)));
					}
					else
					{
						res.json(new resp(new retVal("91",'Failure','TwoFVerifyRequest',"Could not verify!")));
					}
				}
			});//end verifyPassword
		}
	});//end findOne
};