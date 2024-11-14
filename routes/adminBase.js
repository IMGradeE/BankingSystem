var express = require('express');
const querystring = require('querystring');
var router = express.Router();
let con = require('../Lib/database').conreg;
let fileName = "adminBase";

/* GET page. */
router.get('/', function(req, res, next) {
    console.log(fileName + ".js: GET");
    res.render(fileName , { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    const query = querystring.stringify(req.body) + encodeURI("&adminID="+req.query.externalID);
    res.redirect('/adminAction?' + query);
});

module.exports = router;