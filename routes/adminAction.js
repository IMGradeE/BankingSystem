var express = require('express');
var router = express.Router();
const {User, Admin} = require('../Lib/interfaceClasses');
const {roles} = require("../Lib/SQL_DDL");
let con = require('../Lib/database').conreg;
let fileName = "adminAction";
let admin;
let target;

/* GET page. */
router.get('/', async function (req, res, next) {
    console.log(fileName + ".js: GET");
    admin = await Admin.create(req.query.adminID);
    target = await User.create(req.query.userID);
    res.render(fileName, {
        userID: req.query.userID,
        action: req.query.adminAction,
        name: target.name,
        role: target.role,
        title: (req.query.adminAction === "password") ? "Reset Password" : "Alter User Role"
    });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    //TODO action
    if (req.query.adminAction === "password"){
        admin.reset_password(target.external_id, req.body.newPassword);
    }else{
        admin.alter_user_role(roles[req.body.desiredRole] , target.userID);
    }
    res.redirect('/adminBase');
});

module.exports = router;