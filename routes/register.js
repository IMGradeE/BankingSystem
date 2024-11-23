var express = require('express');
var router = express.Router();
let con = require('../lib/database');
const {BankUtils} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");



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
        let external_id = await con.registerUser(req.body.firstName, req.body.lastName, req.body.pass);
        req.session.external_id = external_id;
        req.session.user_role_id =  roles.customer;
        req.session.receiver_id = external_id;
        req.session.echo_external_id = true;
        await req.session.save(function (err) {res.redirect('/base/init')});
    }catch (e){
        // if there is an error, redirect to login page and inform the
        // user that the referenced person has already registered.
        let error = encodeURIComponent(req.body.firstName +" "+ req.body.lastName + " has already registered. Please login instead.");
        res.redirect('/loginuser?error='+ error);
    }
});

module.exports = router;