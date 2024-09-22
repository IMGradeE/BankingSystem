
var express = require('express');
var router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {
    console.log("loginuser.js: GET");
    res.render('loginuser', { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log("loginuser.js: POST");
    if (req.body.username === "admin"){
        res.render('adminreportselect',{});
    }else if(req.body.username === "customer"){
        res.render('index', { title: 'Express' });
    }else if(req.body.username === "employee"){
        res.render('survey', { });
    }
});

module.exports = router;
