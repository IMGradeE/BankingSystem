const express = require('express');
const {Employee, Customer, BankUtils} = require("../Lib/interfaceClasses");
const {roles, accountIndices} = require("../Lib/SQL_DDL");
const router = express.Router();
const req = require("express/lib/request");
let fileName = "baseEmployeeAsCustomer";

let usd = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
});


/* GET page. */
router.get('/', async function (req, res, next) {
    console.log(fileName + ".js: GET");

    try {
        let opts = await new Promise(async (resolve, reject) => {

            try {
                req.session.user_object = await new Employee(null, req.session.user_object);
                req.session.user_object.current_user = await new Customer(null, req.session.user_object.current_user);
            } catch (e) {
                console.log(e);
                console.log(e.message);
            }



            return resolve(await BankUtils.renameMe(req.session, req.session.user_object.current_user));
        })
        res.render(fileName, opts);
    } catch (e) {
        console.log(e);
        console.log(e.message);
        res.redirect('/error');
    }
});


router.get("/savings", (req, res) => {
    req.session.user_object.current_user.current_account = req.session.user_object.current_user.accounts[0];
    req.session.user_object.current_user.page = "overview";
    console.log('clicked savings href');
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})

router.get("/checking", async (req, res) => {

    if (req.session.user_object.current_user.accounts.length == 1) {
        try {
            req.session.user_object.current_user = await new Customer(null, req.session.user_object.current_user);
        } catch (e) {
            console.log(e);
            console.log(e.message);
        }

        await req.session.user_object.current_user.insert_account(req.session.user_object.current_user.external_id);
        // reinitialize object since accounts[] is now stale
        req.session.user_object.current_user = await Customer.create(req.session.user_object.current_user.external_id);
    }
    req.session.user_object.current_user.current_account = req.session.user_object.current_user.accounts[1];
    req.session.user_object.current_user.page = "overview";
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})

router.get("/transfers", (req, res) => {
    req.session.user_object.current_user.page = "transfers";
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})


router.get("/withdrawal", (req, res) => {
    console.log('clicked withdrawal href');
    req.session.table_index = 0;
    req.session.user_object.current_user.page =  'withdrawal';
    req.session.receiver_id =  req.session.user_object.current_user.external_id;
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})

router.get("/deposit", (req, res) => {
    console.log('clicked deposit href');
    req.session.table_index = 0;
    req.session.user_object.current_user.page = 'deposit';
    // reset this just in case
    req.session.receiver_id = req.session.user_object.current_user.external_id;
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})

req.get('/pagination', (req, res) => {
    console.log('clicked a pagination href');
    req.session.table_index = parseInt(req.query.index);

    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

})

/*POST ROUTES*/


/* POST page. */
router.post('/submit', async function (req, res, next) {
    console.log(fileName + ".js: POST");
    let f = req.body;
    try {
            req.session.user_object.current_user = await new Customer(null, req.session.user_object.current_user);
    } catch (e) {
        console.log(e);
        console.log(e.message);
    }
    /*TODO catch null amounts*/
    let x;
    if (req.session.user_object.current_user.page === "transfers") {
        // not worried about whether someone wants to transfer money out of and back into the same account.
        x = await req.session.user_object.current_user.initiate_transfer(f.sendingAccount, f.receivingAccount, f.transferMemo, BankUtils.toCentsFromDollars(f.amount))
        req.session.same_account = (!x)?"Sending account and receiving account cannot be the same.":undefined;
        req.session.message_alt = x.toString();
    } else if (req.session.user_object.current_user.page === "deposit") {
        //call deposit
        x = await req.session.user_object.current_user.initiate_deposit(BankUtils.toCentsFromDollars(f.amount), f.receivingAccount);
        req.session.message = x.toString();

    } else if (req.session.user_object.current_user.page === "withdrawal") {
        // withdrawal
        x = await req.session.user_object.current_user.initiate_withdrawal(BankUtils.toCentsFromDollars(f.amount), f.sendingAccount);
        req.session.message = x.toString();
    }
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

});

router.post('/returnToEmployee', async function (req, res, next) {
    req.session.user_object.current_user.current_user = undefined;
    req.session.save(function (err) {res.redirect('/base')});
})

router.post('/transfer', function (req, res, next) {
    req.session.receiver_id = req.body.receiverID;
    req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});
})


module.exports = router;