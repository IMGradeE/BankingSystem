var express = require('express');
const registerUser = require("../Lib/database").registerUser;
var router = express.Router();
let con = require('../lib/database').conreg;


/* GET page. */
router.get('/', function(req, res, next) {

    console.log("register.js: GET");
    //TODO Pass list of users to check new registrations against
    res.render('register', { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    
    console.log("register.js: POST");
    //TODO create the referenced user.
    //registerUser()
    res.redirect('/loginuser');
});

module.exports = router;