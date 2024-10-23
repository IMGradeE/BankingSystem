let mysql = require('mysql2');
const ddl_ = require('SQL_Statements');
const conInfo = require('./connectionInfo');

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

con.connect(function (err, ) {
    if(err) throw err;
    console.log('Connected successfully.');
    con.query("CREATE DATABASE IF NOT EXISTS " + conInfo.DB_NAME, function (err, result){
        if(err) throw err;
        console.log('Database created.');
        selectDatabase();
    });
});

function selectDatabase(){
    let sql = "use " + conInfo.DB_NAME + ";";
    con.query(sql, function (err, result){
        if(err) throw err;
        console.log("Database selected successfully.");
        execSQL(ddl_.tables, 'tables');
        execSQL(ddl_.views,'view');
        execSQL(ddl_.procedures, 'procedures');
        addTableData();
    })
}

function execSQL(arr, _type) {

    for (const key of arr)
    {
        con.execute(key.statement, function (err, results, fields) {
            if (err) {
                console.log(err.message);
                throw err;
            } else {
                console.log("database.js: "+_type+" "+key.name+" created if it didn't exist");
            }
        });
    }
}

function registerUser(first_name, last_name, password){
    let successFlag = 0;
    let externalID;
    let sql = "select count(*) as cnt from view_users;";
    con.query(sql, function(err, results, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        }
        externalID = 100000 + results['cnt']++;
    });

    sql = "CALL register_user('"+externalID+"', '"+first_name+"', '"+last_name+"', '"+password+"', @ret);";
    con.query(sql, function(err, results, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        }
    });

    con.query("select @ret as ret;", function(err, result, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        }
        else{
            successFlag = result['ret'];
        }
    });
    if(successFlag === true){
        console.log("Failed to add user: "+ first_name + " "+ last_name +" because the user already exists.");
    }else{
        console.log("Successfully added user: "+  first_name + " "+ last_name +". External ID: " + externalID);
    }
    return successFlag;
}

function addTableData() {
    let accountArgs = [ddl_.accountTypes[1], ddl_.accountTypes[2]];
    let userRoleArgs = [ddl_.roles[1], ddl_.roles[2], ddl_.roles[3]];
    let transactionArgs = [ddl_.transactionTypes[1], ddl_.transactionTypes[2], ddl_.transactionTypes[3]];
    let fnArgs = [
        account = {tableName: 'account_types', funcName: 'insert_account_type', args: accountArgs},
        users = {tableName: 'user_roles', funcName: 'insert_user_role', args: userRoleArgs},
        transactions = {tableName: 'transaction_types', funcName: 'insert_transaction_types', args: userRoleArgs}
    ]
    for (const fnArgsKey of fnArgs) {
        {
            for (const arg of fnArgsKey.args) {
                let sql = "CALL " + fnArgsKey.funcName + "('" + arg + "');";
                con.query(sql, function (err, rows) {
                    if (err) {
                        console.log(err.message);
                        throw err;
                    }
                    console.log("database.js: Added '" + arg + "' to " + fnArgsKey.tableName + " if it did not already exist.");
                });
            }
        }
    }
    registerUser("admin", "a", "passtest");
}

exports.con = con;
exports.conreg = conreg;
exports.registerUser = registerUser;



