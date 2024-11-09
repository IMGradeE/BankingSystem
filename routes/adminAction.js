var express = require('express');
var router = express.Router();
let con = require('../lib/database').conreg;
let fileName = "adminAction";

/* GET page. */

router.get('/', function(req, res, next) {
    console.log(fileName + ".js: GET");
    res.render(fileName , {opts: {
            userID: this.body.userID,
            action: this.body.adminAction,
            name: "John Doe",
            title: (this.body.adminAction === "password") ? "Reset Password" : "Alter User Role"
        }
    });
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    //TODO action
    res.redirect('/adminBase');
});

module.exports = router;