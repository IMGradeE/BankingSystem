var express = require('express');
var router = express.Router();
let con = require('../lib/database').conreg;
let fileName = "adminBase";

/* GET page. */
router.get('/', function(req, res, next) {
    console.log(fileName + ".js: GET");
    res.render(fileName , { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    //TODO handle userID
    this.body = req.body;
    res.redirect('/adminAction');
});

module.exports = router;