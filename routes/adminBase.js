var express = require('express');
const querystring = require('querystring');
const {BankUtils, Admin} = require("../Lib/interfaceClasses");
var router = express.Router();
let con = require('../Lib/database').conreg;
let fileName = "adminBase";

/* GET page. */
router.get('/', async function(req, res, next) {
    console.log(fileName + ".js: GET");
    res.render(fileName , {session: req.session, req});
});

/* POST page. */
router.post('/', async function(req, res, next) {
    console.log(fileName + ".js: POST");
    try {
        let result = await BankUtils.check_credentials(req.body.userID,  "any").then((authResult) => {
            if (authResult.idAuthed) {
                return true;
            }
            return false;
        }).catch((reason) => {
            return reason
        })
        if (result === true) {
            req.session.idAuthed = "true"
            const query = querystring.stringify(req.body) + encodeURI("&adminID="+req.query.externalID);
            console.log(query);
            req.session.save(function (err) {
                res.redirect('/adminAction?' + query);
            });
        } else {
            throw new Error("UserID does not exist");
        }
    }catch(err) {
        console.log(err);
        req.session.message = "n"
        req.session.idAuthed = "false";
        req.session.save(function (err) {
            res.redirect('/adminBase?externalID='+req.query.externalID)
        });
    }
});

module.exports = router;