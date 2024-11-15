const conInfo = require("./connectionInfo");
const {con} = require("../lib/database");
const {sqlBool} = require("./SQL_DDL");
var transactionTypes = require('../lib/SQL_DDL').transactionTypes;
// write procedure calls
//static
class BankUtils {
    /*in externalID int, in unHashedPassword varchar(255), out userRoleID int, out credentialsAuthorized bit(1)
    returns boolean indicating whether the credentials are valid.*/
    static async check_credentials(externalID, unHashedPassword) {
        let sql = "call check_credentials(" + externalID + ",'" + unHashedPassword + "', @userRoleID, @credentialsAuthorized);";
        try{
            await new Promise(async (resolve, reject) => {
                con.execute(sql, function (err, result){
                    if(err) {
                        console.log(err.message);
                        return reject(err);
                    }
                    return resolve(result);
                })
            })
            let results = await new Promise(async (resolve, reject) => {
                con.execute("select @userRoleID as role, @credentialsAuthorized as authed", function (err, result){
                    if(err) {
                        console.log(err.message);
                        return reject(err);
                    }
                    return resolve(result);
                })
            })
            return {authed: (results[0]['authed'] === sqlBool.true) , role: results[0]['role'] };
        }catch (e){
            return {authed: false, role: null};
        }
    }


    static get_users_array(){
        return new Promise((resolve, reject) => {
            let sql = "select * from users;";
            con.query(sql, function (err, results) {
                if (err) {
                    console.log(err.message);
                    reject(err);
                }
                return resolve(results);
            })
        })
    }

    /*in externalID int, in unHashedPassword varchar(255), in firstName varchar(32),
     in lastName varchar(32), in userRoleID int, out registerSuccess bit(1)*/
    static register_user = con.register_user;

}
/*
template
let sql = "call _("+ _ + "," + ");";
        try{
            con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("TODO");
            return _;
        }catch (QueryError){
            return _;
        }
*/

class User {
    constructor(userInfo) {
        this.external_id = userInfo[0][0].external_id;
        this.user_role_id = userInfo[0][0].user_role_id;
        this.role = userInfo[0][0].role;
        this.name = userInfo[0][0].first_name + " " + userInfo[0][0].last_name;
        for (const row in userInfo[0]) {
            this.accounts.push({
                account_id: row.account_id,
                account_type_id:  row.account_type_id,
                account_type: row.type,
                addressable: row.addressable
            })
        }
    }

    static async create(externalID){
        let userInfo = await User.get_user_info(externalID);
        return new User(userInfo);
    }

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

    static getUserInfoPromise(externalID){
        return new Promise(async (resolve, reject) => {
            let sql = "call get_user_info(" + externalID + ");";
            con.query(sql, function (err, results, fields) {
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

    static async create(externalID){
        let userInfo = await User.get_user_info(externalID);
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
    page ;
    currentAccount;
    constructor(userInfo) {
        super(userInfo);
        this.page = "overview";
        this.currentAccount = "savings";
    }
    static async create(externalID){
        let userInfo = await User.get_user_info(externalID);
        return new Customer(userInfo);
    }
    /*in origin int, in type int, in target int, in initiatedBy int,
    in memo text,
    in amount int,
    in origin_beginningBalance int, in origin_finalBalance int,
    in target_beginningBalance int, in target_finalBalance int,
        out transferSuccess bit(1)*/
    initiate_transfer(origin, type, target, initiatedBy, memo, amount) {
        // origin must be <User>.userInfo['checking' or 'savings'], target can be any extant account number.
        let origin_beginningBalance = this.get_balance(origin)['cents'][0];
        let target_beginningBalance = this.get_balance(target)['cents'][0];
        let target_finalBalance = target_beginningBalance + amount;
        let origin_finalBalance = origin_beginningBalance - amount;

        let sql = "call initiate_transfer("
            + origin + "," + transactionTypes.transfer + "," + target + "," + this.userInfo['user_id'][0] +
            "'," + memo + "," + amount + "," + origin_beginningBalance + "," + origin_finalBalance +
            "," + target_beginningBalance + "," + target_finalBalance + ");";
        try {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Transfer successful.");
            return true;
        } catch (QueryError) {
            return false;
        }
    }

    /*in origin int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int*/
    initiate_withdrawal(origin, amount) {
        let beginningBalance = this.get_balance(origin)['cents'][0];
        let finalBalance = beginningBalance - amount;
        let sql = "call initiate_withdrawal("+ origin + "," + transactionTypes.withdrawal + "," + this.userInfo['user_id'][0] + "," + amount +"," + beginningBalance +"," + finalBalance +");";
        try{
            con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Withdrawal successful.");
            return true;
        }catch (QueryError){
            return false;
        }
    }

    /*in destination int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int, out depositSuccess bit(1)*/
    initiate_deposit(destination, amount) {
        let beginningBalance = this.get_balance(destination)['cents'][0];
        let finalBalance = beginningBalance + amount;
        let sql = "call initiate_deposit("+ origin + "," + transactionTypes.deposit + "," + this.userInfo['user_id'][0] + "," + amount +"," + beginningBalance +"," + finalBalance +");";
        try{
            con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Withdrawal successful.");
            return true;
        }catch (QueryError){
            return false;
        }
    }

    /*in accountID int*/
    view_all_history(accountID) {
        let sql = "call view_all_history("+ accountID +");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved history.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int*/
    get_incoming_transfers(accountID) {
        let sql = "call get_incoming_transfers("+ accountID +");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved incoming transfers.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int*/
    get_outgoing_transfers(accountID) {
        let sql = "call get_outgoing_transfers("+ accountID +");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved outgoing transfers.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int*/
    get_deposits(accountID) {
        let sql = "call get_deposits("+ accountID +");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved deposits.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int*/
    get_withdrawals(accountID) {
        let sql = "call get_withdrawals("+ accountID +");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved withdrawals.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountNumber int*/
    get_balance(accountNumber) {
        let sql = "call get_balance_from_acct( " + accountNumber + ");";
        try{
            let results = con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Balance for account " + accountNumber + " retrieved successfully.");
                return result;
            });
            return results;
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_incoming_transfers_date_range(accountID, lower, upper) {
        let sql = "call get_incoming_transfers_date_range("+ accountID + "," + lower + "," + upper + ");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved incoming transfers in date range.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_outgoing_transfers_date_range(accountID, lower, upper) {
        let sql = "call get_outgoing_transfers_date_range("+ accountID + "," + lower + "," + upper + ");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved outgoing transfers in date range.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_deposits_date_range(accountID, lower, upper) {
        let sql = "call get_deposits_date_range("+ accountID + "," + lower + "," + upper + ");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved deposits in date range.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_withdrawals_date_range(accountID, lower, upper) {
        let sql = "call get_withdrawals_date_range("+ accountID + "," + lower + "," + upper + ");";
        try{
            return con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
                console.log("Successfully retrieved withdrawals in date range.");
                return result;
            });
        }catch (QueryError){
            return null;
        }
    }

    insert_account(){
        let sql = "call insert_account("+this.external_id+");";
        con.query(sql, (err, result) =>{
            if (err) console.log(err.message);
            console.log("Successfully inserted account.");
        })
    }

}

class Employee extends Customer {
    userType = 2
    selectedCustomer = null;
    constructor(externalID) {
        super(externalID);
    }
}

exports.Employee = Employee;
exports.Customer = Customer;
exports.User = User;
exports.Admin = Admin;
exports.BankUtils = BankUtils;


