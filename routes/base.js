const express = require('express');
const {Employee, Customer, BankUtils} = require("../Lib/interfaceClasses");
const {roles, accountIndices} = require("../Lib/SQL_DDL");
const router = express.Router();
let fileName = "base";



router.get('/init', async (req, res) => {
   try {
       try {
       if (req.session.user_role_id === roles.customer) {
           req.session.user_object = await Customer.create(req.session.external_id);
       } else if (req.session.user_role_id === roles.employee) {
           req.session.user_object = await Employee.create(req.session.external_id);
       }
       } catch (e) {
           console.log(e);
           console.log(e.message);
       }
       req.session.save(function (err) {res.redirect('/base');});

   } catch (e) {
       console.log(e);
       console.log(e.message);
       res.redirect('/error');
   }
})

/* GET page. */
router.get('/', async function (req, res, next) {
    console.log(fileName + ".js: GET");

    try {
       let opts = await new Promise(async (resolve, reject) => {

            try {
                if (req.session.user_role_id === roles.customer) {
                    req.session.user_object = await new Customer(null, req.session.user_object);

                } else if (req.session.user_role_id === roles.employee) {
                    req.session.user_object = await new Employee(null, req.session.user_object);
                }
            } catch (e) {
                console.log(e);
                console.log(e.message);
            }

            return resolve(await BankUtils.renameMe(req.session, req.session.user_object));
        })
        res.render(fileName, opts);
    } catch (e) {
        console.log(e);
        console.log(e.message);
        res.redirect('/error');
    }
});

router.get("/savings", async (req, res) => {
    req.session.user_object.current_account = req.session.user_object.accounts[0];
    req.session.user_object.page = "overview";

    console.log(req.session.user_object);
    await req.session.save(function (err) {res.redirect('/base')});
})

router.get("/checking", async (req, res) => {
    try {
        if (req.session.user_role_id === roles.customer) {
            req.session.user_object = await new Customer(null, req.session.user_object);

        } else if (req.session.user_role_id === roles.employee) {
            req.session.user_object = await new Employee(null, req.session.user_object);
        }
    } catch (e) {
        console.log(e);
        console.log(e.message);
    }
    if (req.session.user_object.accounts.length == 1) {
        await req.session.user_object.insert_account(req.session.user_object.external_id);
        // reinitialize object since accounts[] is now stale
        req.session.user_object = (req.session.user_object instanceof (Employee)) ? await Employee.create(req.session.user_object.external_id) : await Customer.create(req.session.user_object.external_id);
    }
    req.session.user_object.current_account = req.session.user_object.accounts[1];
    req.session.user_object.page = "overview";

    console.log(req.session.user_object);
    await req.session.save(function (err) {res.redirect('/base')});
})

router.get("/transfers", async (req, res) => {
    req.session.user_object.page = "transfers";
    console.log('clicked transfers href');
    await req.session.save(function (err) {res.redirect('/base')});

})


router.post('/reset_password', async function (req, res, next) {
    try {
        req.session.user_object = await new Customer(null, req.session.user_object);
    } catch (e) {
        console.log(e);
        console.log(e.message);
    }
    let result = await BankUtils.check_credentials( req.session.user_object.external_id, req.body.oldPassword).then((authResult) => {
        if(authResult.idAuthed && authResult.passwordAuthed){
            req.session.user_object.reset_password(req.body.newPassword);
            return undefined;
        }
    }).catch((reason) => {return reason})

    if (result === undefined) {
        req.session.message = "true"
        req.session.save(function (err) {res.redirect('/base')});

    }else{
        req.session.message = "false"
        req.session.save(function (err) {res.redirect('/base')});

    }
})


router.get("/withdrawal", (req, res) => {
    console.log('clicked withdrawal href');
    req.session.table_index = 0;
    req.session.user_object.page =  'withdrawal';
    req.session.receiver_id =  req.session.user_object.external_id;
    req.session.save(function (err) {res.redirect('/base')});

})

router.get("/deposit", (req, res) => {
    console.log('clicked deposit href');
    req.session.table_index = 0;
    req.session.user_object.page = 'deposit';
    // reset this just in case
    req.session.receiver_id = req.session.user_object.external_id;
    req.session.save(function (err) {res.redirect('/base')});

})

router.get('/pagination', async (req, res) => {
    console.log('clicked a pagination href');
    req.session.table_index = parseInt(req.query.index);
    req.session.save(function (err) {res.redirect('/base')});

})

/*POST ROUTES*/

router.post('/manageUser', async function (req, res, next) {

    if (await BankUtils.verifyExistsAndNotAdminOrEmp(req.body.customer_id)) {
        req.session.user_object.current_user = await Customer.create(req.body.customer_id);
        req.session.receiver_id = req.session.user_object.current_user.external_id;
        req.session.user_object.current_user.user_role_id = roles.employee;
        req.session.message = "true"
        req.session.save(function (err) {res.redirect('/baseEmployeeAsCustomer')});

    }else
    {
        req.session.message = "false"
        req.session.save(function (err) {res.redirect('/base')});

    }

})


/* POST page. */
router.post('/submit', async function (req, res, next) {
    console.log(fileName + ".js: POST");
    let f = req.body;
    try {
        if (req.session.user_role_id === roles.customer) {
            req.session.user_object = await new Customer(null, req.session.user_object);

        } else if (req.session.user_role_id === roles.employee) {
            req.session.user_object = await new Employee(null, req.session.user_object);
        }
    } catch (e) {
        console.log(e);
        console.log(e.message);
    }

    /*TODO catch null amounts*/
    let x;
    if (req.session.user_object.page === "transfers") {
        // not worried about whether someone wants to transfer money out of and back into the same account.
        x = await req.session.user_object.initiate_transfer(f.sendingAccount, f.receivingAccount, f.transferMemo, BankUtils.toCentsFromDollars(f.amount))
        req.session.same_account = (!x)?"Sending account and receiving account cannot be the same.":undefined;
        req.session.message_alt = x.toString();
    } else if (req.session.user_object.page === "deposit") {
        //call deposit
        x = await req.session.user_object.initiate_deposit(BankUtils.toCentsFromDollars(f.amount), f.receivingAccount);
        req.session.message = x.toString();
    } else if (req.session.user_object.page === "withdrawal") {
        // withdrawal
        x = await req.session.user_object.initiate_withdrawal(BankUtils.toCentsFromDollars(f.amount), f.sendingAccount);
        req.session.message = x.toString();
    }
    req.session.save(function (err) {res.redirect('/base')});
});

router.post('/transfer', function (req, res, next) {
    req.session.receiver_id = req.body.receiverID;
    req.session.save(function (err) {res.redirect('/base')});
})

router.get('/password', function (req, res, next) {
    req.session.user_object.page = 'password';
    req.session.save(function (err) {res.redirect('/base')});
})

router.get('/logout', function (req, res, next) {
    res.redirect('/loginuser');

})

module.exports = router;