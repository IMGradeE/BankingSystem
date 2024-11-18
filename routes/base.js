const mysql = require('mysql2');
var express = require('express');
const {Employee, Customer, BankUtils} = require("../Lib/interfaceClasses");
const {roles, accountIndices} = require("../Lib/SQL_DDL");
const linq = import('linq');
var router = express.Router();
const querystring = require('querystring');
let fileName = "base";

let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

let userObj;
let query;

/* GET page. */
router.get('/', async function(req, res, next) {
    console.log(fileName + ".js: GET");
    try{
        query = req.query;
        if(parseInt(query.role, 10) === roles.customer){
            userObj = await Customer.create(query.externalID);
        }else if (parseInt(query.role, 10) === roles.employee){
            userObj = await Employee.create(query.externalID);
        }

        if(query.add === "true"){
            await userObj.insert_account(userObj.external_id);
            // reinitialize object since accounts[] is now stale
            userObj = (userObj instanceof(Employee))? await Employee.create(userObj.external_id): await Customer.create(userObj.external_id);
        }

        userObj.currentAccount = (query.setCurrentAccount !== undefined)? query.setCurrentAccount: userObj.currentAccount;
        userObj.page = (query.page !== undefined) ? query.page : "overview";

        let accountHistory, x;
        try {
            accountHistory = await userObj.view_all_history(userObj.accounts[accountIndices[userObj.currentAccount]].account_id) // can use linq to alter woohoo
            //TODO function for representing a fractional dollar amount as integer cents.
            x = Object.keys(accountHistory[0][0]);
            x[0] = "#";
        }catch (e){
            x = []
        }
        query = {user: userObj, utils:BankUtils, qs: querystring, history: accountHistory[0], headers : x, maxRows: 15, tableIndex:( (query.tableIndex !== undefined) ? query.tableIndex : 0), usd: USDollar, account_id:userObj.accounts[accountIndices[userObj.currentAccount]].account_id};
        res.render(fileName , query);
    }catch (e){
        console.log(e);
        console.log(e.message);
        res.redirect('/error');
    }
});

/* POST page. */
router.post('/', function(req, res, next) {
    console.log(fileName + ".js: POST");
    let f = req.body;
    if(f.receivingAccount === undefined && f.sendingAccount === undefined){
        // check if the id submitted corresponds to a customer, not an admin or another employee
        // goto customerasemployee
    }else if(f.receivingAccount!== undefined && f.sendingAccount === undefined) {
        // deposit
        userObj.initiate_deposit(f.amount, userObj.accounts[f.receivingAccount].account_id);
    }else if(f.receivingAccount === undefined && f.sendingAccount !== undefined){
        // withdrawal
        userObj.initiate_withdrawal(f.amount, userObj.accounts[f.sendingAccount].account_id);
    }else if(f.transferMemo !== undefined){
        //transfer
    }

    let q = querystring.stringify({externalID: userObj.external_id, role: userObj.user_role_id, setCurrentAccount: userObj.currentAccount, add: undefined, tableIndex: 0, page: 'overview'});
    res.redirect("/"+ fileName + "?" + q);
});

module.exports = router;