const mysql = require('mysql2');
var express = require('express');
var router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {
    console.log("loginuser.js: GET");
    res.render('loginuser', { });
});

/* POST page. */
router.post('/', function(req, res, next) {
    /*Pass assets like nav-list-items, section headers, etc as appropriate to the base page to alter it*/

/*OPTIONS:
	title,
	sections[] = [{name, pages, queryResults[], queryObj, tableTitle, TODO }]
	accessType = [userType, navItems[]{title, ref}, TODO ]
	*/


    console.log("loginuser.js: POST");
    if (req.body.username === "admin"){
        res.render('base', {
            title: 'Support Tickets',
            sections: [
                {name: "Admin", pages: 2, queryResults: [], queryObj: null, tableTitle: "Password Reset Requests"}
            ],
            accessType: {
                userType: 'admin',
                navItems: [{title: "Support Tickets", ref:'link'}]
            }
        });
    }else if(req.body.username === "customer"){
        res.render('base', {
            title: 'Accounts',
            sections: [
                {name: "Customer", pages: 2, queryResults: [], queryObj: null, tableTitle: "transaction history"}
            ],
            accessType: {
                userType: 'customer',
                navItems: [{title: "accounts", ref:'link'}]
                }
        });
    }else if(req.body.username === "employee"){
        res.render('base', {
            title: 'View Users',
            sections: [
                {name: "Employee", pages: 2, queryResults: [], queryObj: null, tableTitle: "All Customers"}
            ],
            accessType: {
                userType: 'employee',
                navItems: [{title: "View Users", ref:'link'}]
            }
        });
    }
});

module.exports = router;
