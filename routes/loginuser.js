var express = require('express');
const {BankUtils} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');

/* GET page. */
router.get('/', function(req, res, next) {
    req.session.regenerate(()=>{});
    console.log("loginuser.js: GET");
    res.render('loginuser', {externalID : req.query.externalID, idAuthed: ( req.query.idAuthed !== undefined)? req.query.idAuthed : "true", passwordAuthed: ( req.query.passwordAuthed !== undefined)? req.query.passwordAuthed:"true", error: req.query.error });
});

/* POST page. */
router.post('/', async function(req, res, next) {

    console.log("loginuser.js: POST");
    let external_id = parseInt(req.body.externalID);
    // TODO auth externalID and password separately so an error can be displayed appropriately.
    const authResults = await BankUtils.check_credentials(external_id, req.body.password);
    try{
        if (authResults.idAuthed && authResults.passwordAuthed) {
            console.log("Credentials Authorized.");
            if (authResults.role === roles.admin) {

                const query = encodeURIComponent(external_id);
                req.session.idAuthed = "true";
                req.session.save(function (err) {res.redirect('/adminBase?externalID=' + query);});
            }else {
                req.session.external_id = external_id;
                req.session.user_role_id = authResults.role;
                req.session.receiver_id = external_id;
                req.session.echo_external_id = undefined;
                req.session.save(function (err) {res.redirect('/base/init')});
            }
        }else{
            let error = querystring.stringify(authResults);
            // render login again, reset form
            res.redirect('/loginuser?' + error);
        }
    }catch (e){
        console.log(e);
        res.redirect('/error?error=' + error);
    }
});

module.exports = router;
