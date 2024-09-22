var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log("survey.js: GET");
    res.render('survey', {});
});

module.exports = router;
