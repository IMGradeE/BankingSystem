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
   options =  {
        title: req.body.title,
            page
    :
        req.body.page,

            sections
    :
        [
            {name: "Customer", pages: 2, queryResults: [], queryObj: null, tableTitle: "transaction history"}
        ],
            accessType
    :
        {
            userType: 'customer',
                navItems
        :
            [{title: "accounts", ref: 'link'}]
        }
    }
    if (req.body.username === "admin"){
        res.redirect('/adminBase');
    }else if(req.body.username === "employee"){
        options.sections[0].tableTitle = "Savings";
        options.sections[0].name = "Employee";
        options.accessType.userType = "employee";
        options.title = 'Hello, Employee.';
        options.accessType.navItems[0].title = "View Users";
    }
    res.render('base', options);
});

module.exports = router;
