var express = require('express');
var router = express.Router();
let con = require('../lib/database').conreg;
let fileName = "base";

/* GET page. */
router.get('/', function(req, res, next) {
    this.body = req.body;
    console.log(fileName + ".js: GET");
    res.render(fileName , { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");

    res.render(filename, this.body);

    res.redirect('/');
});

module.exports = router;