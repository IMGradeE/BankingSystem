var express = require('express');
var router = express.Router();
let con = require('../lib/database');
const {BankUtils} = require("../Lib/interfaceClasses");



/* GET page. */
router.get('/', async function(req, res, next) {
    console.log("register.js: GET");
    res.render('register');
});

/* POST page. */
router.post('/', async function(req, res, next) {
    console.log("register.js: POST");
    try
    {
        let eid = await con.registerUser(req.body.firstName, req.body.lastName, req.body.pass);
        res.redirect('/loginuser?externalID=' + encodeURIComponent(eid));
    }catch (e){
        // if there is an error, redirect to login page and inform the
        // user that the referenced person has already registered.
        let error = encodeURIComponent(req.body.firstName +" "+ req.body.lastName + " has already registered. Please login instead.");
        res.redirect('/loginuser?error='+ error);
    }
});

module.exports = router;