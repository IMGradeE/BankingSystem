const mysql = require('mysql2');
var express = require('express');
const {Employee, Customer} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');
let fileName = "base";

/* GET page. */
router.get('/', async function(req, res, next) {
    console.log(fileName + ".js: GET");
    try{
        let userObj;
        if(parseInt(req.query.role, 10) === roles.customer){
            userObj = await Customer.create(req.query.externalID);
        }else if (parseInt(req.query.role, 10) === roles.employee){
            userObj = await Employee.create(req.query.externalID);
            //TODO add initialization for user to act on i.e userObj.selectedUser = await Customer.create(externalID);
        }
        userObj.currentAccount = (req.query.setCurrentAccount !== undefined)? req.query.setCurrentAccount: userObj.currentAccount;
        userObj.page = (req.body.page !== undefined) ? req.body.page : "overview";
        if(req.query.add === "true"){
            userObj.insert_account(userObj.external_id);
            // reinitialize object since accounts[] is now stale
            userObj = (userObj instanceof(Employee))? await Employee.create(userObj.external_id): await Customer.create(userObj.external_id);
        }
        res.render(fileName , {user: userObj});
    }catch (e){
        res.redirect('/error');
    }
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");

    res.render(filename, req.query);
});

module.exports = router;