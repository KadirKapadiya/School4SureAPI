var express = require('express');
var passport = require('passport');
var azure = require('azure-storage');

var userController = require('../controllers/user');
var authController = require('../controllers/auth');

var policyController = require('../controllers/policy');
var contentController = require('../controllers/content');

//var twoFactorController = require('../controllers/twofactor');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.json({ message: 'Unexpected' });
});

// Create endpoint handlers for /users
router.route('/users')
  .post(userController.postUsers)
  .get(authController.isAuthenticated, userController.getUsers);

//Content
router.route('/content/request')
    .post(authController.isAuthenticated, contentController.requestContent);

router.route('/content/batch/ready/:profileContentBatchId')
    .get(authController.isAuthenticated, contentController.batchReady);

router.route('/content/batch/status')
    .put(authController.isAuthenticated, contentController.updateBatchStatus);

router.route('/content/fetch/:profileContentId')
    .get(authController.isAuthenticated, contentController.fetchContent);

//Policy

router.route('/policy/holder')
    .post(authController.isAuthenticated, policyController.newPolicyHolder);

router.route('/policies')
    .get(authController.isAuthenticated, policyController.getPolicies);

router.route('/audit/policy')
    .post(authController.isAuthenticated, policyController.updatePolicyAuditTrail);

router.route('/audit/policy/stats/:profileId')
    .get(authController.isAuthenticated, policyController.getPolicyStatsOld);

router.route('/audit/policy/stats/:profileId/:policyId')
    .get(authController.isAuthenticated, policyController.getPolicyStats);

router.route('/policy')
  .post(authController.isAuthenticated, policyController.newPolicy);

router.route('/policy/:policyRef')
  .get(authController.isAuthenticated, policyController.getPolicyDetailsForRef);

module.exports = router;
