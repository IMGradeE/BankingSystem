var express = require('express');
var router = express.Router();
let con = require('../lib/database').conreg;


/* GET page. */
router.get('/', function(req, res, next) {

    console.log("register.js: GET");
    res.render('register', { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    
    console.log("register.js: POST");
    res.redirect('/');
});

module.exports = router;