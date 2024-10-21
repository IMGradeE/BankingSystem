const DB_NAME = "banking_system";

const connectionInfo = {
    host:"localhost",
    user:"Payton",
    port: 3306,
    password: "h329dsaf32!@#",
};

const rootConnectionInfo =
{
    host:"localhost",
        user:"root",
    password: "4254356!AwM",
    port: 3306,
    database: DB_NAME
};

  exports.DB_NAME = DB_NAME;
  exports.connectionInfo = connectionInfo;
  exports.rootConInfo = rootConnectionInfo;