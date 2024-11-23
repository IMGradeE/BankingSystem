var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const {User, Admin} = require('../Lib/interfaceClasses');
const {roles} = require("../Lib/SQL_DDL");
let con = require('../Lib/database').conreg;
let fileName = "adminAction";

let admin;
let target;

/* GET page. */
router.get('/', async function (req, res, next) {
    console.log(fileName + ".js: GET");
    console.log(querystring.stringify(req.query));
    try{
        admin = await Admin.create(req.query.adminID);
        target = await User.create(req.query.userID);
    }catch (e) {
        //TODO show dialog indicating an invalid userID (this is the only error that can happen here, I think.)
        res.redirect('/adminBase?externalID='+ req.query.adminID);
        return;
    }
    res.render(fileName, {
        userID: req.query.userID,
        action: req.query.adminAction,
        name: target.name,
        role: target.role,
        title: (req.query.adminAction === "password") ? "Reset Password" : "Alter User Role"
    });
});

/* POST page. */
router.post('/role', async function(req, res, next) {
    console.log(fileName + ".js: POST");
    //TODO action
    try{
        let results = await admin.alter_user_role(roles[req.body.desiredRole], target.external_id);
        //todo if results[0].errormsg is not null, echo the error.
        //if target and origin are the same redirect to login instead, if role no longer admin.
        if (target.external_id === admin.external_id && results[0].altered !== roles.admin) {
            res.redirect('/loginuser?externalID=' + admin.external_id);
            return;
        }
    }catch (e){
        console.log(e);
        //TODO display an error message for a role change failure.
    }
    res.redirect('/adminBase?externalID='+ admin.external_id);
});

/* POST page. */
router.post('/password', async function(req, res, next) {
    console.log(fileName + ".js: POST");
    //TODO action
    try{
        admin.reset_password(target.external_id, req.body.newPassword);
    }catch (e){
        console.log(e);
    }
    res.redirect('/adminBase?externalID='+ admin.external_id);
});

module.exports = router;