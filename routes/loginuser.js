var express = require('express');
const {BankUtils} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');

/* GET page. */
router.get('/', function(req, res, next) {

    console.log("loginuser.js: GET");

    res.render('loginuser', {externalID : req.query.externalID, error: decodeURI(req.query.error)});
});

/* POST page. */
router.post('/', async function(req, res, next) {
    console.log("loginuser.js: POST");
    let external_id = req.body.externalID;
    // TODO auth externalID and password separately so an error can be displayed appropriately.
    const authResults = await BankUtils.check_credentials(external_id, req.body.password);
    if (authResults.authed === true) {
        console.log("Login Authorized");
        if (authResults.role === roles.admin) {
            const query = encodeURIComponent(external_id);
            res.redirect('/adminBase?externalID=' + query);
            return;
        }else {
            res.redirect('/base?externalID=' + external_id + '&role=' + authResults.role);
            return;
        }
    }else{
        let error = encodeURIComponent("No user found matching these credentials.");
        console.log("Login Not Authorized");
        // render login again, reset form and display error.
        res.redirect('loginuser?error=' + error);
    }
});

module.exports = router;
