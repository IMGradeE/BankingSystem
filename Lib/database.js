let mysql = require('mysql2');
const ddl_ = require('./SQL_Statements');
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
    con.execute("CREATE DATABASE IF NOT EXISTS " + conInfo.DB_NAME, function (err, result){
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

function registerUser(externalID, first_name, last_name, password, role){
    let successFlag = 0;
    let sql;

    if (typeof role === "undefined") {
        sql = "CALL register_user("+externalID+", '"+password+"', '"+first_name+"', '"+last_name+"', 1 , @ret);";
    }else{
        sql = "CALL register_user("+externalID+", '"+password+"', '"+first_name+"', '"+last_name+"', "+role+", @ret);";
    }

    con.execute(sql, function(err, results, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        }
    });
    con.execute("select @ret as ret;", function(err, result, fields) {
        if (err) {
            console.log(err.message);
            throw err;
        }
        else{
            successFlag = result[0]['ret'];
            console.log(result[0]['ret'])
        }
        if(successFlag === 0){
            console.log("Failed to add user: "+ first_name + " "+ last_name +" because the user already exists.");
        }else{
            console.log("Successfully added user: "+  first_name + " "+ last_name +". External ID: " + externalID);
        }
    });
}

function addTableData() {
    let accountArgs = [ddl_.accountTypes[1], ddl_.accountTypes[2]];
    let userRoleArgs = [ddl_.roles[1], ddl_.roles[2], ddl_.roles[3]];
    let transactionArgs = [ddl_.transactionTypes[1], ddl_.transactionTypes[2], ddl_.transactionTypes[3]];
    let fnArgs = [
        account = {tableName: 'account_types', funcName: 'insert_account_type', args: accountArgs},
        users = {tableName: 'user_roles', funcName: 'insert_user_role', args: userRoleArgs},
        transactions = {tableName: 'transaction_types', funcName: 'insert_transaction_type', args: userRoleArgs}
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


async function AddDummyDataToDatabase() {
    let names = ["anne", "beetle", "codel", "dier", "john", "fort", "gray"];

    for (let i = 0, j = 0; i < 50; i++, j = Math.trunc(i / names.length)) {
        /* This doesn't work and I can't figure out how to get values out of this syntax
        let sql = "select count(*) as cnt, max(external_id) as mx from users;";
        con.query(sql, function (err, results, fields) {
            if (err) {
                console.log(err.message);
                throw err;
            }
            console.log("F");
            console.log(results[0]['mx']);
            console.log("G");
            value = {id: (results[0]['cnt'] === 0) ? 100000 : (results[0]['mx'] + 1)};
        });*/
        registerUser(i, names[i % 7], names[j], names[i] + names[j]);
    }
}

exports.con = con;
exports.conreg = conreg;
exports.registerUser = registerUser;



