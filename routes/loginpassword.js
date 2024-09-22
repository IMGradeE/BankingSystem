var express = require('express');
var router = express.Router();

/* POST page. */
router.post('/', function(req, res, next) {
    console.log("loginpassword.js: POST");
    // if (user == adminUser)    && (password == correct), redirect to admin dash
    // if (user == customerUser) && (password == correct), redirect to Customer dash
    // if (user == employeeUser) && (password == correct), redirect to user dash
    res.render('loginpassword', { });
});

module.exports = router;