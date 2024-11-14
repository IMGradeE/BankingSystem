const mysql = require('mysql2');
var express = require('express');
const {Employee, Customer} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');
let fileName = "base";

/* GET page. */
router.get('/', function(req, res, next) {
    console.log(fileName + ".js: GET");
    let userObj;
    if(req.query.userType === roles.customer){
        userObj = Customer();
    }else if (req.query.userType === roles.employee){
        userObj = Employee();
    }
    res.render(fileName , req.query);
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    res.render(filename, req.query);
});

module.exports = router;