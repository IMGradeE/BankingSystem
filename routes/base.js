const mysql = require('mysql2');
var express = require('express');
const {Employee, Customer, BankUtils} = require("../Lib/interfaceClasses");
const {roles, accountIndices} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');
const {shallowCopy} = require("ejs/lib/utils");
require("linqjs");
let fileName = "base";

let usd = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
});

let userObj;
let query;
let receivingUser;
let recipientError;
let currentUser;
let receiverID;


/* GET page. */
router.get('/', async function (req, res, next) {
    console.log(fileName + ".js: GET");
    query = req.query;
    try {
        if (parseInt(query.role, 10) === roles.customer) {
            userObj = await Customer.create(query.externalID);
        } else if (parseInt(query.role, 10) === roles.employee) {
            userObj = await Employee.create(query.externalID);
            userObj.currentUser = currentUser;
        }
    } catch (e) {
        console.log(e);
        console.log(e.message);
        res.redirect('/error');
    }
    try {
        //always a customer object, verify the user exists.
        query.receiverID = (await BankUtils.verifyExists(query.receiverID)) ? query.receiverID : userObj.external_id;
        receivingUser = await Customer.createRecipient(query.receiverID).then((user) => {
            recipientError = undefined;
            query.receiverID = user.external_id;
            return user;
        })
            .catch((reason) => {
                recipientError = reason;
                query.receiverID = userObj.external_id;
                return userObj
            });
        if (query.add === "true") {
            await userObj.insert_account(userObj.external_id);
            // reinitialize object since accounts[] is now stale
            userObj = (userObj instanceof (Employee)) ? await Employee.create(userObj.external_id) : await Customer.create(userObj.external_id);
        }
        let u = (userObj.currentUser === undefined)? userObj : userObj.currentUser;

        u.currentAccount = (query.setCurrentAccount !== undefined && query.setCurrentAccount !== "undefined") ? query.setCurrentAccount : u.currentAccount;
        u.currentAccountNumber = accountIndices[u.currentAccount];
        u.page = (query.page !== undefined) ? query.page : "overview";

        balance = BankUtils.toDollarsFromCents( await u.get_balance(u.accounts[u.currentAccountNumber].account_id))
        let accountHistory, transferHistory;
        let account_id = u.accounts[u.currentAccountNumber].account_id; /*TODO problem here idk*/
        accountHistory = await u.view_all_history(u.accounts[u.currentAccountNumber].account_id)
        transferHistory = await u.get_all_transfers()
        let history = (u.page !== "transfers")? accountHistory[0]: transferHistory[0];

        opts = {
            user: userObj,
            u,
            history,
            utils: BankUtils,
            qs: querystring,
            query,
            account_id,
            maxRows: 15,
            tableIndex: ((query.tableIndex !== undefined) ? query.tableIndex : 0),
            usd: usd,
            receivingUser,
            notAddressableRecipient: recipientError
        };
        res.render(fileName, opts);
    } catch (e) {
        console.log(e);
        console.log(e.message);
        res.redirect('/error');
    }
});

router.post('/manageUser', async function (req, res, next) {

    if (await BankUtils.verifyExistsAndNotAdminOrEmp(req.body.customerID)) {
        userObj.currentUser = await Customer.create(req.body.customerID);
        userObj.currentUser.role = roles.employee;
        currentUser = userObj.currentUser;
    }
    BankUtils.backToBase(res, userObj);
})

/* POST page. */
router.post('/submit', function (req, res, next) {
    console.log(fileName + ".js: POST");
    let f = req.body;
    /*TODO catch null amounts*/
    if (userObj.page === "transfers") {
        // not worried about whether someone wants to transfer money out of and back into the same account.
        userObj.initiate_transfer(f.sendingAccount, f.receivingAccount, f.transferMemo, BankUtils.toCentsFromDollars(f.amount))
    } else if (userObj.page === "deposit") {
        //call deposit
        userObj.initiate_deposit(BankUtils.toCentsFromDollars(f.amount), f.receivingAccount);
    } else if (userObj.page === "withdrawal") {
        // withdrawal
        userObj.initiate_withdrawal(BankUtils.toCentsFromDollars(f.amount), f.sendingAccount);
    }
    BankUtils.backToBase(res, userObj);
});

router.post('/transfer', function (req, res, next) {
    res.redirect('/base?' + req.body.transferQuery + "receiverID=" + req.body.receiverID);
})

module.exports = router;