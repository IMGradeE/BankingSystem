const conInfo = require("./connectionInfo");
const {con} = require("../lib/database");
const {sqlBool, accountIndices,roles, transactionTypes, accountTypes} = require("./SQL_DDL");
const querystring = require("querystring");
// write procedure calls
//static

class BankUtils {
    /*in externalID int, in unHashedPassword varchar(255), out userRoleID int, out credentialsAuthorized bit(1)
    returns boolean indicating whether the credentials are valid.*/
    static moneyRegex = "^([0-9]*(.[0-9]{2}||.[0-9])?)$"
    //TODO refactor (now returns an int for idAuthed and passwordAuthed as components instead of @credentialsAuthed)
    static async check_credentials(externalID, unHashedPassword) {
        let sql = "call check_credentials(" + externalID + ",'" + unHashedPassword + "', @userRoleID, @idAuthed, @passwordAuthed);";
        await new Promise(async (resolve, reject) => {
            con.execute(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    return reject(err);
                }
                return resolve(result);
            })
        })
        return await new Promise(async (resolve, reject) => {
            con.execute("select @userRoleID as role, @idAuthed as idAuthed, @passwordAuthed as passwordAuthed", function (err, result) {
                if (err) {
                    console.log(err.message);
                    return reject(err);
                }
                return resolve({
                    passwordAuthed: (result[0]['passwordAuthed'] === 1),
                    idAuthed: (result[0]['idAuthed'] === 1),
                    role: result[0]['role']
                });
            })
        })

    }


    static get_users_array() {
        return new Promise((resolve, reject) => {
            let sql = "select external_id, user_role_id from users;";
            con.query(sql, function (err, results) {
                if (err) {
                    console.log(err.message);
                    reject(err);
                }
                return resolve(results);
            })
        })
    }

    static backToBase(res, userObj) {
        let q = querystring.stringify({
            externalID: userObj.external_id,
            role: userObj.user_role_id,
            setCurrentAccount: userObj.currentAccount,
            add: undefined,
            tableIndex: 0,
            page: 'overview'
        });
        res.redirect("/base?" + q);
    }
//TODO function for representing a fractional dollar amount as integer cents.

    static async verifyExistsAndNotAdminOrEmp(external_id) {
        return await BankUtils.get_users_array()
            .then((users) => {
                return users.contains({external_id: parseInt(external_id), user_role_id: roles.customer}, (a, b) => {
                    console.log(a, b)
                    return (a.external_id === b.external_id) && (a.user_role_id === b.user_role_id);
                });
            })
            .catch((reason) => {
                return false
            });
    }


    static async verifyExists(external_id) {
        return await BankUtils.get_users_array()
            .then((users) => {
                return users.contains({external_id: parseInt(external_id), user_role_id: roles.customer}, (a, b) => {
                    console.log(a, b)
                    return (a.external_id === b.external_id);
                });
            })
            .catch((reason) => {
                return false
            });
    }

    static toDollarsFromCents(amount){
        amount = parseInt(amount);
        let dollars = Math.floor(amount/100);
        let cents = amount%100;
        return parseFloat(dollars+"."+cents)
    }

    static toCentsFromDollars(amount){
        let DollarsAndCents = amount.split('.', 2);
        let dollars = (DollarsAndCents[0] !== undefined && DollarsAndCents[0] !== "")? DollarsAndCents[0] : '0';
        let cents = (DollarsAndCents[1] !== undefined && DollarsAndCents[1] !== "")? DollarsAndCents[1] : '0';
        dollars = parseInt(dollars)
        cents = parseInt(cents);
        return dollars * 100 + cents;
    }


    /*in externalID int, in unHashedPassword varchar(255), in firstName varchar(32),
     in lastName varchar(32), in userRoleID int, out registerSuccess bit(1)*/
    static register_user = con.register_user;
}

class User {
    currentAccountNumber;
    constructor(userInfo) {
        this.external_id = userInfo[0].external_id;
        this.user_id = userInfo[0].user_id;
        this.user_role_id = userInfo[0].user_role_id;
        this.role = userInfo[0].role;
        this.name = userInfo[0].first_name + " " + userInfo[0].last_name;
        for (let i = 0; i < userInfo.length; ++i) {
            let x = {
                account_id: userInfo[i].account_id,
                account_type_id: userInfo[i].account_type_id,
                account_type: userInfo[i].type,
                addressable: (userInfo[i].addressable[0] === 1)
            }
            this.accounts.push(x)
        }
        this.page = "overview"
        this.currentAccountNumber = accountTypes.savings - 1;
        this.currentAccount = accountTypes[this.currentAccountNumber];
    }

    static async create(externalID) {
        let userInfo = await User.get_user_info(externalID);
        userInfo = userInfo[0];
        return new User(userInfo);
    }

    user_id
    external_id;
    name;
    accounts = [];
    user_role_id;
    role;

    /*in externalID int*/
    static async get_user_info(externalID) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = await User.getUserInfoPromise(externalID);
                return resolve(results);
            } catch (e) {
                console.log(e.message)
                return reject(e);
            }
        })
    }

    static getUserInfoPromise(externalID) {
        return new Promise(async (resolve, reject) => {
            let sql = "call get_user_info(" + externalID + ");";
            con.query(sql, async function (err, results, fields) {
                if (err) {
                    return reject(err);
                }
                return resolve(results);
            });
        })
    }
}

class Admin extends User {
    constructor(userInfo) {
        super(userInfo);
    }

    static async create(externalID) {
        let userInfo = await User.get_user_info(externalID);
        userInfo = userInfo[0];
        return new Admin(userInfo);
    }

    /*in externalID int, in newPassword varchar(255)*/

    //TODO move error handling to route so messages can be displayed to user.
    reset_password(externalID, newPassword) {
        let sql = "call reset_password(" + externalID + ",'" + newPassword + "');";
        try {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Password reset successfully.");
            return true;
        } catch (QueryError) {
            return false;
        }
    }

    /*in targetRole int, in userID int, out roleAltered bit(1),
    out errormsg varchar(18)*/
    alter_user_role(targetRole, externalID) {
        return new Promise(async (resolve, reject) => {
            let sql = "call alter_user_role(" + targetRole + "," + externalID + ", @roleAltered, @errormsg);";
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    reject(err);
                }
            });
            sql = "select @errormsg as errormsg, @roleAltered as altered;"
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    reject(err);
                }
                console.log(result);
                // returns the nullable errormsg and rolealtered, which tells us whether the new role is admin.
                return resolve(result);
            });
        })
    }
}

class Customer extends User {
    page;
    currentAccount;

    constructor(userInfo) {
        super(userInfo);
    }

    static async create(externalID) {
        return new Promise(async (resolve, reject)=>{
            let userInfo = await User.get_user_info(externalID);
            userInfo = userInfo[0];
            if(userInfo[0].user_role_id === roles.admin || userInfo[0].user_role_id === roles.employee) {
                return reject("User is not a customer!");
            }
            return resolve(new Customer(userInfo));
        })
    }

    get_all_transfers() {
        return new Promise(async (resolve, reject)=>{
            let sql = ("call get_all_transfers("+this.user_id+");");
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    return reject(err);
                }
                return resolve(result);
            });
        })
    }

    static async createRecipient(externalID) {
        return new Promise(async (resolve, reject)=>{
            let userInfo = await User.get_user_info(externalID);
            userInfo = userInfo[0];
            if(userInfo[0].user_role_id === roles.admin) {
                return reject("User "+ externalID + " is an admin and cannot send or receive money.");
            }
            return resolve(new Customer(userInfo));
        })
    }

    initiate_transfer(origin, target, memo, amount) {
        let sql = "call initiate_transfer(" + origin + "," + target + "," + this.external_id + ",'" + memo + "'," + amount + ", @out);";
        return  new Promise(async (resolve, reject) => {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    return reject(err);
                }
            });
            con.query("select @out;", (err, result)=>{
                if (err) return reject(err);
                if (result['@out'] === 1) {
                    return resolve(true);
                }else return resolve(false);
            })
        })

    }

    /*in origin int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int*/
    async initiate_withdrawal(amount, origin) {
        let sql = "call initiate_withdrawal(" + origin + "," + this.external_id + "," + amount + ");";
        try {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Withdrawal successful.");
            return true;
        } catch (QueryError) {
            return false;
        }
    }

    /*in destination int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int, out depositSuccess bit(1)*/
    async initiate_deposit(amount, destination) {
        let sql = "call initiate_deposit(" + destination + "," + this.external_id + "," + amount + ", @success);";
        try {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Deposit successful.");
            return true;
        } catch (QueryError) {
            return false;
        }
    }

    /*in accountID int*/
    async view_all_history(accountID) {
        let sql = "call view_all_history(" + accountID + ");";
        return new Promise((resolve, reject) => {
            con.query(sql, function (err, result) {
                if (err) return reject(err);
                return resolve(result);
            })
        })
    }


    /*in accountID int*/
    get_deposits(accountID) {
        let sql = "call get_deposits(" + accountID + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved deposits.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    /*in accountID int*/
    get_withdrawals(accountID) {
        let sql = "call get_withdrawals(" + accountID + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved withdrawals.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    /*in accountNumber int*/
    async get_balance(accountNumber) {
        let sql = "call get_balance("+accountNumber+")";
        return await new Promise(async (resolve, reject) => {
            con.query(sql, function (err, result) {
                if (err) {
                    return reject(err);
                }
                console.log("Balance for account " + accountNumber + " retrieved successfully.");
                return resolve(result[0][0].cents);
            });
        });
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_incoming_transfers_date_range(accountID, lower, upper) {
        let sql = "call get_incoming_transfers_date_range(" + accountID + "," + lower + "," + upper + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved incoming transfers in date range.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_outgoing_transfers_date_range(accountID, lower, upper) {
        let sql = "call get_outgoing_transfers_date_range(" + accountID + "," + lower + "," + upper + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved outgoing transfers in date range.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_deposits_date_range(accountID, lower, upper) {
        let sql = "call get_deposits_date_range(" + accountID + "," + lower + "," + upper + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved deposits in date range.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_withdrawals_date_range(accountID, lower, upper) {
        let sql = "call get_withdrawals_date_range(" + accountID + "," + lower + "," + upper + ");";
        try {
            return con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved withdrawals in date range.");
                return result;
            });
        } catch (QueryError) {
            return null;
        }
    }

    insert_account() {
        let sql = "call insert_account(" + this.external_id + ");";
        return new Promise(async (resolve, reject) => {
                con.query(sql, (err, result) => {
                    if (err) return reject(err);
                    return resolve(result);
                })
            }
        )
    }
}

class Employee extends Customer {
    userType = 2
    currentUser;
    constructor(externalID) {
        super(externalID);
    }
    static async create(externalID) {
        let userInfo = await User.get_user_info(externalID);
        userInfo = userInfo[0];
        return new Employee(userInfo);
    }

}



exports.Employee = Employee;

exports.Customer = Customer;
exports.User = User;
exports.Admin = Admin;
exports.BankUtils = BankUtils;


