const conInfo = require("./connectionInfo");
const con = require("database").conreg;
const register_user = require("database").registerUser;
var transactionTypes = require('SQL_Statements').transactionTypes;
// write procedure calls

//static
class BankUtils {
    /*in externalID int, in unHashedPassword varchar(255), out userRoleID int, out credentialsAuthorized bit(1)
    returns boolean indicating whether the credentials are valid.*/
    static check_credentials(externalID, unHashedPassword) {
        // TODO I don't know if I need to pass userRoleID and CredentialsAuthorized
        let sql = "call check_credentials(" + externalID + "," + unHashedPassword + ", userRoleID, credentialsAuthorized);";
        try{
            let results = con.query(sql, function (err, result){
                if(err) {
                    console.log(err.message);
                    throw err;
                }
            });
            console.log("Credentials are authorized.");
            return {authed: results['credentialsAuthorized'][0] , role: results['userRoleID'][0] };
        }catch (QueryError){
            return {authed: false, role: null};
        }
    }

    /*in externalID int, in unHashedPassword varchar(255), in firstName varchar(32),
     in lastName varchar(32), in userRoleID int, out registerSuccess bit(1)*/
    static register_user = register_user;

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
    userInfo;

    /*Throws ERROR */
    constructor(externalID) {
        this.userInfo = this.get_user_info(externalID);
    }

    /*in externalID int*/
    get_user_info(externalID) {
        let sql = "call get_user_info(" + externalID + ");";
        return con.query(sql, function (err, result) {
            if (err) throw err;
            return result;
        });
    }

}

class Admin extends User {
    constructor(externalID) {
        super(externalID);
    }

    /*in externalID int, in newPassword varchar(255)*/
    reset_password(externalID, newPassword) {
        let sql = "call reset_password(" + externalID + "," + newPassword + ");";
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
        let sql = "call alter_user_role(" + targetRole + "," + externalID + ", roleAltered, errormsg);";
        let procResult;
        let procMsg;
        try {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err.message);
                    throw err;
                }
                procResult = result['roleAltered'][0];
                procMsg = result['errormsg'][0];
            });
            if (procResult) {
                console.log("Role Altered successfully.");
                return true;
            } else {
                console.log(procMsg);
                return false;
            }
        } catch (QueryError) {
            return false;
        }
    }
}

class Customer extends User {
    constructor(externalID) {
        super(externalID);
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

}

class Employee extends Customer {
    constructor(externalID, firstName, lastName) {
        super(externalID, firstName, lastName);
    }
}

exports.Employee = Employee;
exports.Customer = Customer;
exports.Admin = Admin;
exports.BankUtils = BankUtils;


