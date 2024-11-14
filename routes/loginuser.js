var express = require('express');
const {BankUtils} = require("../Lib/interfaceClasses");
const {roles} = require("../Lib/SQL_DDL");
var router = express.Router();
const querystring = require('querystring');

/* GET page. */
router.get('/', function(req, res, next) {

    console.log("loginuser.js: GET");

    res.render('loginuser', {externalID : req.query.externalID });
});

/* POST page. */
router.post('/', async function(req, res, next) {
    /*Pass assets like nav-list-items, section headers, etc as appropriate to the base page to alter it*/

/*OPTIONS:
	title,
	sections[] = [{name, pages, queryResults[], queryObj, tableTitle, TODO }]
	accessType = [userType, navItems[]{title, ref}, TODO ]
	*/
    options =  {
        title: "overview",
        page: req.body.page,
        name: "Customer", tableTitle: "transaction history",
            userType: 'customer',
            navItems: [{title: "accounts", href: 'link'}]
    }
    console.log("loginuser.js: POST");
    // query for the externalID and other stuff I guess
    const authResults = await BankUtils.check_credentials(req.body.externalID, req.body.password);
    if (authResults.authed === true) {
        console.log("Authorized");
        if (authResults.role === roles.admin){
            const query = encodeURIComponent(req.body.externalID);
            res.redirect('/adminBase?externalID=' + query);
        }else if(authResults.role === roles.employee){
            options.tableTitle = "Savings";
            options.name = "Employee";
            options.userType = "employee";
            options.title = 'Hello, Employee.';
            options.navItems[0].title = "View Users";
            const query = querystring.stringify(options);
            res.redirect('/base?' + query);

        }else if(authResults.role === roles.customer){
            const query = querystring.stringify(options);
            res.redirect('/base?' + query);
        }
    }else{
        console.log("Not authorized");
        // render login again, reset form and display error.
    }
});

module.exports = router;
