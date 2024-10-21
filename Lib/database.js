let mysql = require('mysql2');
const conInfo = require('./connectionInfo');

const DBTableStatements = [
    account_types = {
        name:"account_types",
        statement: "account_types\n" +
            "(\n" +
            "  account_type_id INT NOT NULL AUTO_INCREMENT,\n" +
            "  account_type varchar(45) NOT NULL,\n" +
            "  PRIMARY KEY (account_type_id)\n" +
            ");"},
    user_types = {
        name:"user_types",
        statement: "user_types\n" +
            "(\n" +
            "  type_id INT NOT NULL AUTO_INCREMENT,\n" +
            "  type varchar(12) NOT NULL,\n" +
            "  PRIMARY KEY (type_id)\n" +
            ");"},
    users = {
        name:"users",
        statement: "users\n" +
            "(\n" +
            "  user_id INT NOT NULL AUTO_INCREMENT,\n" +
            "  username VARCHAR(45) NOT NULL,\n" +
            "  hashed_password VARCHAR(255) NOT NULL,\n" +
            "  salt VARCHAR(45) NOT NULL,\n" +
            "  education VARCHAR(45) NOT NULL,\n" +
            "  email VARCHAR(128) NOT NULL,\n" +
            "  first_name VARCHAR(45) NOT NULL,\n" +
            "  last_name VARCHAR(45) NOT NULL,\n" +
            "  gender VARCHAR(12) NOT NULL,\n" +
            "  user_role_id INT NOT NULL,\n" +
            "  PRIMARY KEY (user_id),\n" +
            "  FOREIGN KEY (user_role_id) REFERENCES user_types(type_id),\n" +
            "  UNIQUE (username),\n" +
            "  UNIQUE (email)\n" +
            ");"},
    timings = {
        name:"timings",
        statement: "timings\n" +
            "(\n" +
            "  timing_id INT NOT NULL AUTO_INCREMENT,\n" +
            "  timing INT NOT NULL,\n" +
            "  user_id INT NOT NULL,\n" +
            "  timing_type_id INT NOT NULL,\n" +
            "  PRIMARY KEY (timing_id),\n" +
            "  FOREIGN KEY (timing_type_id) REFERENCES timing_types(timing_type_id),\n" +
            "  FOREIGN KEY (user_id) REFERENCES users(user_id)\n" +
            ");"}
    ];

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
        createTables();
        createStoredProcedures();
        addTableData();
    })
}

function createTables() {

    for (const key of DBTableStatements)
    {
        let sql = "CREATE TABLE IF NOT EXISTS " + key.statement;
        con.execute(sql, function (err, results, fields) {
            if (err) {
                console.log(err.message);
                throw err;
            } else {
                console.log("database.js: table "+key.name+" created if it didn't exist");
            }
        });
    }
}

function createStoredProcedures() {
    // TODO add change_user_type
    let procedures = [
        insert_timing_type = {
        name: "insert_timing_type",
            statement: "insert_timing_type(IN _timing_type varchar(45))\n" +
                "BEGIN\n" +
                "    INSERT INTO timing_types (timing_type)\n" +
                "    SELECT _timing_type\n" +
                "    FROM DUAL\n" +
                "    WHERE NOT EXISTS (SELECT *\n" +
                "                      FROM timing_types\n" +
                "                      WHERE timing_types.timing_type = _timing_type\n" +
                "                      LIMIT 1);\n" +
                "END;"
        },
        insert_user_type = {
        name: "insert_user_type" ,
            statement: "insert_user_type(IN user_type varchar(12))\n" +
                "BEGIN\n" +
                "    INSERT INTO user_types (type)\n" +
                "    SELECT user_type\n" +
                "    FROM DUAL\n" +
                "    WHERE NOT EXISTS (SELECT *\n" +
                "                      FROM user_types\n" +
                "                      WHERE user_types.type = user_type\n" +
                "                      LIMIT 1);\n" +
                "END;\n"
        },
        // Caller's responsibility to separate first and last name in posted data
        register_user = {
        name: "register_user",
            statement: "register_user(IN _username varchar(255), IN _first_name varchar(255),\n" +
                "                                                     IN _last_name varchar(255), IN _email varchar(255),\n" +
                "                                                     IN _gender varchar(255), IN _education varchar(255),\n" +
                "                                                     IN _hashed_password varchar(255), IN _salt varchar(255),\n" +
                "                                                     OUT result int)\n" +
                "BEGIN\n" +
                "    DECLARE nCount INT DEFAULT 0;\n" +
                "    SET result = 0;\n" +
                "    SELECT Count(*) INTO nCount FROM users WHERE users.username = _username;\n" +
                "    IF nCount = 0 THEN\n" +
                "        INSERT INTO users (username, first_name, last_name, email, gender, education, user_role_id, hashed_password,\n" +
                "                           salt)\n" +
                "        VALUES (_username, _first_name, _last_name, _email, _gender, _education, 1, _hashed_password, _salt);\n" +
                "    ELSE\n" +
                "        SET result = 1;\n" +
                "    END IF;\n" +
                "END;"
        },
        add_timing = {
        name: "add_timing",
            statement:"`add_timing`(\n" +
                        "IN  username VARCHAR(255), \n" +
                        "IN  timing INT,\n" +
                        "IN  timing_type VARCHAR(45)\n" +
                        ")\n" +
                        "BEGIN\n" +
                        "INSERT INTO timings (user_id, timing, timing_type_id)\n" +
                        "VALUES ((SELECT user_id FROM users WHERE users.username = username),\n" +
                        "timing,\n" +
                        "(SELECT timing_type_id FROM timing_types WHERE timing_types.timing_type = timing_type)\n" +
                        ");\n" +
                        "END;" },
        get_top_ten_times = {
        name: "get_top_ten_times",
            statement:  "`get_top_ten_times`( IN _timing_type VARCHAR(45),\n" +
                "                            IN _education VARCHAR(45)\n" +
                "                            )\n" +
                "                            BEGIN\n" +
                "                            IF STRCMP(_education, '') = 0 THEN\n" +
                "                                SELECT users.username, timings.timing, timing_types.timing_type\n" +
                "                                FROM users\n" +
                "                                INNER JOIN timings ON users.user_id = timings.user_id\n" +
                "                                INNER JOIN timing_types ON timings.timing_type_id=timing_types.timing_type_id\n" +
                "                                WHERE timing_types.timing_type = _timing_type\n" +
                "                                ORDER BY timings.timing ASC\n" +
                "                                LIMIT 10;\n" +
                "                            ELSE\n" +
                "                                SELECT users.username, timings.timing, timing_types.timing_type\n" +
                "                                FROM users\n" +
                "                                INNER JOIN timings ON users.user_id=timings.user_id\n" +
                "                                INNER JOIN timing_types ON timings.timing_type_id=timing_types.timing_type_id\n" +
                "                                WHERE timing_types.timing_type = _timing_type AND users.education = _education\n" +
                "                                ORDER BY timings.timing ASC\n" +
                "                                LIMIT 10;\n" +
                "                            END IF;\n" +
                "                            END;"
        },
        get_salt = {
        name: "get_salt",
            statement: "`get_salt`(\n" +
                        "IN username VARCHAR(255)\n" +
                        ")\n" +
                        "BEGIN\n" +
                        "SELECT salt FROM users\n" +
                        "WHERE users.username = username\n" +
                        "LIMIT 1;\n" +
                        "END;"},
        check_credentials = {
        name: "check_credentials",
            statement: "`check_credentials`(\n" +
                        "IN username VARCHAR(255),\n" +
                        "IN hashed_password VARCHAR(255)\n" +
                        ")\n" +
                        "BEGIN\n" +
                        "SELECT EXISTS(\n" +
                        "SELECT * FROM users\n" +
                        "WHERE users.username = username AND users.hashed_password = hashed_password\n" +
                        ") AS result;\n" +
                        "END;"},
        //  TODO test
        // Found this here: https://sebhastian.com/mysql-median/
        get_median_timing = {
            name: "get_median_timing",
            statement: "get_median_timing(\n" +
                "                        IN _timing_type VARCHAR(45),\n" +
                "                        IN _education VARCHAR(45)\n" +
                "                        )\n" +
                "                        BEGIN\n" +
                "                        SET @row_index := -1;\n" +
                "                        IF STRCMP(_education, '') = 0 THEN\n" +
                "                            SELECT AVG(subq.timing) as median_value\n" +
                "                            FROM (\n" +
                "                            SELECT @row_index:=@row_index + 1 AS row_index, timings.timing, timing_types.timing_type\n" +
                "                            FROM timings\n" +
                "                            INNER JOIN timing_types ON timings.timing_type_id=timing_types.timing_type_id\n" +
                "                            WHERE timing_types.timing_type = _timing_type\n" +
                "                            ORDER BY timings.timing\n" +
                "                            ) AS subq\n" +
                "                            WHERE subq.row_index\n" +
                "                            IN (FLOOR(@row_index / 2) , CEIL(@row_index / 2));\n" +
                "                        ELSE\n" +
                "                            SELECT AVG(subq.timing) as median_value\n" +
                "                            FROM (\n" +
                "                            SELECT @row_index:=@row_index + 1 AS row_index, timings.timing, timing_types.timing_type\n" +
                "                            FROM timings\n" +
                "                            INNER JOIN timing_types ON timings.timing_type_id=timing_types.timing_type_id\n" +
                "                            INNER JOIN users ON timings.user_id=users.user_id\n" +
                "                            WHERE users.education = _education AND timing_types.timing_type = _timing_type\n" +
                "                            ORDER BY timings.timing\n" +
                "                            ) AS subq\n" +
                "                            WHERE subq.row_index\n" +
                "                            IN (FLOOR(@row_index / 2) , CEIL(@row_index / 2));\n" +
                "                        END IF;\n" +
                "                        END;"
        },
        change_user_type = {
            name: "change_user_type",
            statement:"`change_user_type`(\n" +
                "    IN _username VARCHAR(255)\n" +
                ")\n" +
                "BEGIN\n" +
                "    UPDATE users\n" +
                "    SET users.user_role_id = 1\n" +
                "    WHERE users.username = _username;\n" +
                "END;"
    }
    ]


    for (const proceduresKey of procedures) {
        let sql = "CREATE PROCEDURE IF NOT EXISTS "+ proceduresKey.statement ;
        con.query(sql, function(err, results, fields) {
            if (err) {
                console.log(err.message);
                throw err;
            } else {
                console.log("database.js: procedure "+proceduresKey.name+" created if it didn't exist");
            }
        });
    }
}

function registerUser(username, first_name, last_name, email, gender, education, hashed_password, salt){
    let successFlag = 0;
    let sql = "CALL register_user('"+username+"', '"+first_name+"', '"+last_name+"', '"+email+"', '"+gender+"', '"+education+"', '"+hashed_password+"', '"+salt+"', @ret);";
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
            successFlag = result[0].ret;

        }
    });
    if(successFlag === 1){
        console.log("Failed to add user: "+username+" because the user already exists or the username is taken.");
    }else{
        console.log("Successfully added user: "+username+".");
    }
    return successFlag;

}


function addTableData() {
    let timingArgs = ["saywordtext", "sayfontcolor"];
    let userTypeArgs = ["regular", "admin"];
    let fnArgs = [
        timing = {tableName: DBTableStatements[0].name, funcName: "insert_timing_type", args: timingArgs},
        userTypes = {tableName: DBTableStatements[0].name, funcName: "insert_user_type", args: userTypeArgs}
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
                    console.log("database.js: Added '" + arg + "' to " + fnArgsKey.tableName);
                });
            }
        }
    }

   registerUser("admin", "", "", "", "", "", '518210a7b7adc34a3aac2d440bb3a2796a07e3bcc918783559528b44ca5ab26a', 'dc1998bcdb6320d');

}


module.exports = con;

