const ddl_ = require('./SQL_DDL');

const conInfo = require("./connectionInfo");
let mysqlP = require('mysql2/promise');
let mysql = require('mysql2');

const con =
    mysql.createConnection(
        {
            host: conInfo.rootConInfo.host,
            user: conInfo.rootConInfo.user,
            password: conInfo.rootConInfo.password,
            port: conInfo.rootConInfo.port,
            multipleStatements: true              // Needed for stored procedures with OUT results
        }
    )

const conreg =
    mysql.createConnection(
        {
            host: conInfo.connectionInfo.host,
            user: conInfo.connectionInfo.user,
            password: conInfo.connectionInfo.password,
            port: conInfo.connectionInfo.port,
            multipleStatements: true              // Needed for stored procedures with OUT results
        }
    )


function initCon(){
    conreg.connect(function (err,) {
        if (err) throw err;
        let sql = "use " + conInfo.DB_NAME + ";";
        conreg.query(sql, function (err, result){
            if(err) throw err;});
    })
}

function initDB() {
    con.connect(function (err,) {
        if (err) throw err;
        console.log('Connected successfully.');
        con.execute("CREATE DATABASE IF NOT EXISTS " + conInfo.DB_NAME, function (err, result) {
            if (err) throw err;
            console.log('Database created.');
            selectDatabase();
        });
    });
}
function selectDatabase(){
    let sql = "use " + conInfo.DB_NAME + ";";
    con.query(sql, function (err, result){
        if(err) throw err;
        console.log("Database selected successfully.");
        execSQL(ddl_.tables, 'tables');
        execSQL(ddl_.views,'view');
        execSQL(ddl_.procedures, 'procedures');
        addTableData();
        AddDummyDataToDatabase();
    })
}

function execSQL(arr, _type) {

    for (const key of arr)
    {
        con.query(key.statement, function (err, results, fields) {
            if (err) {
                console.log(err.message);
                throw err;
            } else {
                console.log("database.js: "+_type+" "+key.name+" created if it didn't exist");
            }
        });
    }
}

function registerUser(externalID, first_name, last_name, password, role) {
    return new Promise(async (resolve, reject) => {
        let sql;
        if (typeof role === "undefined") {
            sql = "CALL register_user(" + externalID + ", '" + password + "', '" + first_name + "', '" + last_name + "', 1 );";
        } else {
            sql = "CALL register_user(" + externalID + ", '" + password + "', '" + first_name + "', '" + last_name + "', " + role + ");";
        }
        con.execute(sql, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            return resolve(results);
        });
    })
}

function addTableData() {
    let accountArgs = [ddl_.accountTypes[1], ddl_.accountTypes[2]];
    let userRoleArgs = [ddl_.roles[1], ddl_.roles[2], ddl_.roles[3]];
    let transactionArgs = [ddl_.transactionTypes[1], ddl_.transactionTypes[2], ddl_.transactionTypes[3]];
    let fnArgs = [
        account = {tableName: 'account_types', funcName: 'insert_account_type', args: accountArgs},
        users = {tableName: 'user_roles', funcName: 'insert_user_role', args: userRoleArgs},
        transactions = {tableName: 'transaction_types', funcName: 'insert_transaction_type', args: transactionArgs}
    ]
    for (const fnArgsKey of fnArgs) {
        {
            for (const arg of fnArgsKey.args) {
                let sql = "CALL " + fnArgsKey.funcName + "('" + arg + "');";
                con.execute(sql, function (err, rows) {
                    if (err) {
                        console.log(err.message);
                        throw err;
                    }
                    console.log("database.js: Added '" + arg + "' to " + fnArgsKey.tableName + " if it did not already exist.");
                });
            }
        }
    }
}

async function registerUserAndReturnExternalID(first_name, last_name, password, role) {
    return new Promise(async (resolve, reject) => {
        try {
            let externalID = await getUIDMax();
            await registerUser(externalID, first_name, last_name, password, role);
            console.log("Successfully added user " + first_name+ " "+ last_name+ " with externalID: " + externalID);
            return resolve(externalID);
        } catch (e) {
            return reject(e);
        }
    })
}

function getUIDMax() {
    return new Promise(async (resolve, reject) => {
        let sql = "select count(*) as cnt, max(external_id) as mx from users;";
        con.query(sql, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            return resolve((results[0]['cnt'] === 0) ? 100000 : (results[0]['mx'] + 1));
        });
    })
}

async function AddDummyDataToDatabase() {
    let names = ["anne", "beetle", "codel", "dier", "john", "fort", "gray"];
    // TODO generate transaction history for non-admins, check if admin creation works on accounts with balances.
    // initial deposit, then withdrawals

    for (let i = 0, j = 0; i < 49; i++, j = Math.trunc(i / names.length)) {
        let role =  (i === 0)? ddl_.roles.admin : undefined;
        try{
            let uid = await registerUserAndReturnExternalID(names[i % 7], names[j], names[i % 7] + names[j], role);

        }
        catch (e){
            console.log(e.message)
        }

       /* try {
            let externalID = await getUIDMax();
            await registerUser(externalID, names[i % 7], names[j], names[i%7] + names[j]);
            console.log("Successfully added user " + names[i%7]+ " "+ names[j]+ " with externalID: " + externalID);
        } catch (e) {
            console.log(e.message)
        }*/
    }
}


exports.con = con;
exports.initCon = initDB;
exports.conreg = conreg;
exports.initConReg = initCon;
exports.registerUser = registerUserAndReturnExternalID;



