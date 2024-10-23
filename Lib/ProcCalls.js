const conInfo = require("./connectionInfo");
const con = require("database").conreg;
const register_user = require("database").registerUser;
// write procedure calls

//static
class BankUtils{
    /*in externalID int, in unHashedPassword varchar(255), out userRoleID int, out credentialsAuthorized bit(1)
    returns boolean indicating whether the credentials are valid.*/
    static check_credentials(externalID , unHashedPassword){

    }

    /*in externalID int, in unHashedPassword varchar(255), in firstName varchar(32),
     in lastName varchar(32), in userRoleID int, out registerSuccess bit(1)*/
    static register_user = register_user;

}

class User {
    constructor(externalID) {
        this.get_user_info(externalID);

    }
    /*in externalID int*/
    get_user_info(externalID ){
        let sql = "call get_user_info("+externalID+");";
        con.query(sql, function (err, result){
            if(err) throw err;
            return result;
        });
    }

}

class Admin extends User {
    constructor(){
        super();

    }

    /*in externalID int, in hashedPass varchar(255), in _salt varchar(255)*/
    reset_password(externalID, hashedPass , _salt ){
        // get user ID with the external ID.
        // call procedure
    }

    /*in targetRole int, in userID int, out roleAltered bit(1),
    out errormsg varchar(18)*/
    alter_user_role(targetRole , userID ){

    }


}

class Employee extends Customer{
    constructor(){
        super();

    }
    // special views
}

class Customer extends User {
    constructor(){
        super();

    }

    /*in origin int, in type int, in target int, in initiatedBy int,
    in memo text,
    in amount int,
    in origin_beginningBalance int, in origin_finalBalance int,
    in target_beginningBalance int, in target_finalBalance int,
        out transferSuccess bit(1)*/
    initiate_transfer(origin , type , target , initiatedBy ,
                               memo ,
                               amount ,
                               origin_beginningBalance , origin_finalBalance ,
                               target_beginningBalance , target_finalBalance ){

    }

    /*in origin int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int*/
    initiate_withdrawal(origin , _type , initiatedBy, amount ,
                                 beginningBalance, finalBalance ){

    }

    /*in destination int, in type int, in initiatedBy int, in amount int, in beginningBalance int, in finalBalance int, out depositSuccess bit(1)*/
    initiate_deposit(destination , _type , initiatedBy , amount ,
                              beginningBalance , finalBalance){

    }

    /*in accountID int*/
    view_all_history(accountID ){

    }


    /*in accountID int*/
    get_incoming_transfers(accountID ){

    }

    /*in accountID int*/
    get_outgoing_transfers(accountID ){

    }

    /*in accountID int*/
    get_deposits(accountID ){

    }

    /*in accountID int*/
    get_withdrawals(accountID ){

    }

    /*in userID int, in accountType varchar(16)*/
    get_balance(userID , accountType){

    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_incoming_transfers_date_range(accountID , lower , upper ){

    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_outgoing_transfers_date_range(accountID , lower , upper ){

    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_deposits_date_range(accountID , lower , upper ){

    }

    /*in accountID int, in lower DATETIME, in upper DATETIME*/
    get_withdrawals_date_range(accountID , lower , upper ){

    }

}

