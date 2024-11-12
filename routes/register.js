var express = require('express');
var router = express.Router();
let con = require('../lib/database');


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
    con.registerUser(req.body.firstName, req.body.lastName, req.body.pass);
    res.redirect('/loginuser');
});

module.exports = router;