// todo enums for type injection, will make modifications easier/ensure names are not misspelled.
const userRoles = Object.freeze({
    1: 'customer',
    2:'employee',
    3:'admin',
    'customer': 1,
    'employee':2,
    'admin':3
})

const transactionTypes = Object.freeze({
    1: 'transfer',
    2:'deposit',
    3:'withdrawal',
    'transfer': 1,
    'deposit':2,
    'withdrawal':3
})

const sqlBool = Object.freeze({
    true:"b'1'",
    false:"b'0'",
    "b'1'":true,
    "b'0'":false
})

const accountTypes = Object.freeze({
    1:'savings',
    2:'checking',
    'savings':1,
    'checking':2
})

const DBTableStatements = [
    account_types= {
        statement: "CREATE TABLE IF NOT EXISTS account_types\n" +
            "(\n" +
            "    account_type_id INT         NOT NULL AUTO_INCREMENT,\n" +
            "    type            VARCHAR(16) NOT NULL,\n" +
            "    PRIMARY KEY (account_type_id),\n" +
            "    UNIQUE (type)\n" +
            ");",
        name: "account_types"
    },
    transaction_type= {
        statement: "CREATE TABLE IF NOT EXISTS user_roles\n" +
            "(\n" +
            "    user_role_id INT         NOT NULL AUTO_INCREMENT,\n" +
            "    role         VARCHAR(16) NOT NULL,\n" +
            "    PRIMARY KEY (user_role_id),\n" +
            "    UNIQUE (role)\n" +
            ");",
        name: "transaction_type"
    },
    transaction_type= {
        statement: "CREATE TABLE IF NOT EXISTS transaction_type\n" +
            "(\n" +
            "    transaction_type_id INT         NOT NULL AUTO_INCREMENT,\n" +
            "    type                VARCHAR(16) NOT NULL,\n" +
            "    PRIMARY KEY (transaction_type_id),\n" +
            "    UNIQUE (type)\n" +
            ");",
        name: "transaction_type"
    },
    users= {
        statement: "CREATE TABLE IF NOT EXISTS users\n" +
            "(\n" +
            "    user_id         INT          NOT NULL AUTO_INCREMENT,\n" +
            "    external_id     INT          NOT NULL,\n" +
            "    hashed_password VARCHAR(255) NOT NULL,\n" +
            "    salt            VARCHAR(255) NOT NULL,\n" +
            "    first_name      VARCHAR(32)  NOT NULL,\n" +
            "    last_name       VARCHAR(32)  NOT NULL,\n" +
            "    user_role_id    INT          NOT NULL,\n" +
            "    PRIMARY KEY (user_id),\n" +
            "    FOREIGN KEY (user_role_id) REFERENCES user_roles (user_role_id),\n" +
            "    UNIQUE (external_id),\n" +
            "    UNIQUE (salt),\n" +
            "    UNIQUE (first_name, last_name)\n" +
            ");",
        name: "users"
    },
    accounts= {
        statement: "CREATE TABLE IF NOT EXISTS accounts\n" +
            "(\n" +
            "    account_id      INT    NOT NULL AUTO_INCREMENT,\n" +
            "    account_cents   INT    NOT NULL DEFAULT (0),\n" +
            "    account_type_id INT    NOT NULL,\n" +
            "    user_id         INT    NOT NULL,\n" +
            "    addressable     bit(1) NOT NULL default "+sqlBool.true+",\n" +
            "    PRIMARY KEY (account_id),\n" +
            "    FOREIGN KEY (account_type_id) REFERENCES account_types (account_type_id),\n" +
            "    FOREIGN KEY (user_id) REFERENCES users (user_id)\n" +
            ");",
        name: "accounts\n"
    },
    account_transactions= {
        statement: "CREATE TABLE IF NOT EXISTS account_transactions\n" +
            "(\n" +
            "    transaction_id                   INT      NOT NULL AUTO_INCREMENT,\n" +
            "    transaction_type_id              INT      NOT NULL DEFAULT "+transactionTypes.transfer+",\n" +
            "    transaction_memo                 TEXT              DEFAULT NULL,\n" +
            "    transaction_timestamp            DATETIME NOT NULL DEFAULT NOW(),\n" +
            "    transaction_source_account_id    INT,\n" +
            "    transaction_target_account_id    INT,\n" +
            "    transaction_initiated_by_user_id INT      NOT NULL,\n" +
            "    transaction_amount_cents         INT      NOT NULL,\n" +
            "    initial_cents_origin             INT      NOT NULL DEFAULT (0),\n" +
            "    initial_cents_target             INT      NOT NULL DEFAULT (0),\n" +
            "    new_cents_origin                 INT,\n" +
            "    new_cents_target                 INT,\n" +
            "    PRIMARY KEY (transaction_id),\n" +
            "    FOREIGN KEY (transaction_type_id) REFERENCES transaction_type (transaction_type_id),\n" +
            "    FOREIGN KEY (transaction_initiated_by_user_id) REFERENCES users (user_id),\n" +
            "    FOREIGN KEY (transaction_source_account_id) REFERENCES accounts (account_id),\n" +
            "    FOREIGN KEY (transaction_target_account_id) REFERENCES accounts (account_id)\n" +
            ");",
        name: "account_transactions"
    }
];

const DBViewStatements = [
    view_transactions= {
        statement: "create or replace view view_transactions as\n" +
            "select transaction_id                                    'Transaction Number',\n" +
            "       CONCAT('$', SIGN(act.initial_cents_origin) * ABS(act.initial_cents_origin) DIV 100, '.',\n" +
            "              ABS(act.initial_cents_origin) MOD 100)     'Origin Starting Balance',\n" +
            "       CONCAT('$', SIGN(act.initial_cents_target) * ABS(act.initial_cents_target) DIV 100, '.',\n" +
            "              ABS(act.initial_cents_target) MOD 100)     'Target Starting Balance',\n" +
            "       CONCAT('$', SIGN(act.transaction_amount_cents) * ABS(act.transaction_amount_cents) DIV 100, '.',\n" +
            "              ABS(act.transaction_amount_cents) MOD 100) 'Amount',\n" +
            "       CONCAT('$', SIGN(act.new_cents_origin) * ABS(act.new_cents_origin) DIV 100, '.',\n" +
            "              ABS(act.new_cents_origin) MOD 100)         'Origin Final Balance',\n" +
            "       CONCAT('$', SIGN(act.new_cents_target) * ABS(act.new_cents_target) DIV 100, '.',\n" +
            "              ABS(act.new_cents_target) MOD 100)         'Target Final Balance',\n" +
            "       concat(u.first_name, ' ', u.last_name)            'Initiated by',\n" +
            "       transaction_memo                                  'Memo',\n" +
            "       transaction_timestamp                             'Date and Time',\n" +
            "       tt.type                                           'Transaction Type',\n" +
            "       transaction_source_account_id                     source_acct,\n" +
            "       transaction_target_account_id                     target_acct\n" +
            "from account_transactions act\n" +
            "         inner join transaction_type tt on act.transaction_type_id = tt.transaction_type_id\n" +
            "         inner join users u on act.transaction_initiated_by_user_id = u.user_id;\n",
        name: "view_transactions"
    },
    view_incoming_transfers= {
        statement: "create or replace view view_incoming_transfers as\n" +
            "select `Transaction Number`,\n" +
            "       `Target Starting Balance` AS `Starting Balance`,\n" +
            "       `Amount`,\n" +
            "       `Target Final Balance`    AS `Final Balance`,\n" +
            "       `Initiated by`,\n" +
            "       `Memo`,\n" +
            "       `Date and Time`,\n" +
            "       `Transaction Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where `Transaction Type` = '"+transaction_type[transactionTypes.transfer]+"'\n" +
            "group by `to`;",
        name: "view_incoming_transfers"
    },
    view_outgoing_transfers = {
        statement: "create or replace view view_outgoing_transfers as\n" +
            "select `Transaction Number`,\n" +
            "       `Origin Starting Balance` AS `Starting Balance`,\n" +
            "       `Amount`,\n" +
            "       `Origin Final Balance`    AS `Final Balance`,\n" +
            "       `Initiated by`,\n" +
            "       `Memo`,\n" +
            "       `Date and Time`,\n" +
            "       `Transaction Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where `Transaction Type` = '"+transaction_type[transactionTypes.transfer]+"'\n" +
            "group by `from`;",
        name: "view_outgoing_transfers"
    },
    view_deposits = {
        statement: "create or replace view view_deposits as\n" +
            "select `Transaction Number`,\n" +
            "       `Target Starting Balance` AS `Starting Balance`,\n" +
            "       `Amount`,\n" +
            "       `Target Final Balance`    AS `Final Balance`,\n" +
            "       `Initiated by`,\n" +
            "       `Memo`,\n" +
            "       `Date and Time`,\n" +
            "       `Transaction Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where source_acct is null\n" +
            "  AND `Transaction Type` = (select transaction_type.type\n" +
            "                            from transaction_type\n" +
            "                            where transaction_type.type = '"+transactionTypes[transactionTypes.deposit]+"'\n" +
            "                            limit 1)\n" +
            "group by 'to';",
        name: "view_deposits"
    },
    view_withdrawals = {
        statement: "create or replace view view_withdrawals as\n" +
            "select `Transaction Number`,\n" +
            "       `Origin Starting Balance` AS `Starting Balance`,\n" +
            "       `Amount`,\n" +
            "       `Origin Final Balance`    AS `Final Balance`,\n" +
            "       `Initiated by`,\n" +
            "       `Memo`,\n" +
            "       `Date and Time`,\n" +
            "       `Transaction Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where target_acct is null\n" +
            "  AND `Transaction Type` = (select transaction_type.type\n" +
            "                            from transaction_type\n" +
            "                            where transaction_type.type = '"+transactionTypes[transactionTypes.withdrawal]+"'\n" +
            "                            limit 1)\n" +
            "group by 'from';",
        name: "view_withdrawals"
    },
    view_balance = {
        statement: "create or replace view view_balance as\n" +
            "select u.user_id as                       uid,\n" +
            "       type,\n" +
            "       CONCAT('$', SIGN(account_cents) * ABS(account_cents) DIV 100, '.',\n" +
            "              ABS(account_cents) MOD 100) `Present Balance`\n" +
            "from accounts\n" +
            "         inner join account_types a on accounts.account_type_id = a.account_type_id\n" +
            "         inner join users u on accounts.user_id = u.user_id;",
        name: "view_balance"
    },
    user_info = {
        statement: "create or replace view user_info as\n" +
            "select *\n" +
            "from users\n" +
            "         inner join accounts a on users.user_id = a.user_id\n" +
            "         inner join user_roles ur on users.user_role_id = ur.user_role_id\n" +
            "         inner join account_types on a.account_type_id = account_types.account_type_id;",
        name: "user_info"
    }
];

const DBProcedureStatements = [
    initiate_transfer= { statement: "create procedure if not exists initiate_transfer(in origin int, in type int, in target int, in initiatedBy int,\n" +
            "                                                 in memo text,\n" +
            "                                                 in amount int,\n" +
            "                                                 in origin_beginningBalance int, in origin_finalBalance int,\n" +
            "                                                 in target_beginningBalance int, in target_finalBalance int,\n" +
            "                                                 out transferSuccess bit(1))\n" +
            "begin\n" +
            "\n" +
            "    set transferSuccess = "+sqlBool.true+"; /*assume we will be successful*/\n" +
            "    if transferSuccess = (select addressable from accounts as a where a.account_id = target) then\n" +
            "        start transaction;\n" +
            "        insert into account_transactions(transaction_memo, transaction_source_account_id, transaction_target_account_id,\n" +
            "                                         transaction_initiated_by_user_id, initial_cents_origin, initial_cents_target,\n" +
            "                                         new_cents_origin, new_cents_target, transaction_amount_cents,\n" +
            "                                         transaction_type_id)\n" +
            "        values (memo, origin, target, initiatedBy, origin_beginningBalance, target_beginningBalance,\n" +
            "                origin_finalBalance, target_finalBalance, amount, type);\n" +
            "        update accounts\n" +
            "        set account_cents = origin_finalBalance\n" +
            "        where account_id = origin;\n" +
            "        update accounts\n" +
            "        set account_cents = target_finalBalance\n" +
            "        where account_id = target;\n" +
            "        commit;\n" +
            "    else\n" +
            "        set transferSuccess = "+sqlBool.false+";\n" +
            "    end if;\n" +
            "end;", name: "initiate_transfer"},
    initiate_withdrawal= { statement: "create procedure if not exists initiate_withdrawal(in origin int, in type int, in initiatedBy int, in amount int,\n" +
            "                                                   in beginningBalance int, in finalBalance int)\n" +
            "begin\n" +
            "    insert into account_transactions(transaction_source_account_id,\n" +
            "                                     transaction_initiated_by_user_id, initial_cents_origin,\n" +
            "                                     new_cents_origin, transaction_amount_cents, transaction_type_id)\n" +
            "    values (origin, initiatedBy, beginningBalance, finalBalance, amount, type);\n" +
            "    update accounts\n" +
            "    set account_cents = finalBalance\n" +
            "    where account_id = origin;\n" +
            "end;", name: "initiate_withdrawal"},
    initiate_deposit= { statement: "create procedure if not exists initiate_deposit(in destination int, in type int, in initiatedBy int, in amount int,\n" +
            "                                                in beginningBalance int, in finalBalance int, out depositSuccess bit(1))\n" +
            "begin\n" +
            "    set depositSuccess = "+sqlBool.true+"; /*assume we will be successful*/\n" +
            "    if depositSuccess = (select addressable from accounts as a where a.account_id = destination) then\n" +
            "        insert into account_transactions(transaction_target_account_id,\n" +
            "                                         transaction_initiated_by_user_id, initial_cents_target,\n" +
            "                                         transaction_amount_cents,\n" +
            "                                         new_cents_target, transaction_type_id)\n" +
            "        values (destination, initiatedBy, beginningBalance, amount, finalBalance, type);\n" +
            "        update accounts\n" +
            "        set account_cents = finalBalance\n" +
            "        where account_id = destination;\n" +
            "    else\n" +
            "        set depositSuccess = "+sqlBool.false+";\n" +
            "    end if;\n" +
            "end;", name: "initiate_deposit"},
    reset_password= { statement: "create procedure if not exists reset_password(in userID int, in hashedPass varchar(255), in _salt varchar(255))\n" +
            "begin\n" +
            "    update users\n" +
            "    set hashed_password = hashedPass and salt = _salt\n" +
            "    where user_id = userID;\n" +
            "end;", name: "reset_password"},
    alter_user_role= { statement: "create procedure if not exists alter_user_role(in targetRole int, in userID int, out roleAltered bit(1),\n" +
            "                                               out errormsg varchar(18))\n" +
            "begin\n" +
            "    set roleAltered = "+sqlBool.true+";\n" +
            "    if targetRole in (select user_role_id from user_roles where role = '"+ userRoles[userRoles.admin] +"') then\n" +
            "        if userID in (select user_id from accounts where user_id = userID and account_cents > 0) then\n" +
            "            set roleAltered = "+sqlBool.false+";\n" +
            "            set errormsg = 'Has accounts open.';\n" +
            "        else\n" +
            "            update users\n" +
            "            set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.admin]+"')\n" +
            "            where user_id = userID;\n" +
            "            update accounts\n" +
            "            set addressable = "+sqlBool.false+"\n" +
            "            where user_id = userID;\n" +
            "        end if;\n" +
            "    elseif targetRole in (select user_role_id from user_roles where role = '"+userRoles[userRoles.customer]+"') then\n" +
            "        update users\n" +
            "        set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.customer]+"')\n" +
            "        where user_id = userID;\n" +
            "        update accounts\n" +
            "        set addressable = "+sqlBool.true+"n" +
            "        where user_id = userID;\n" +
            "    elseif targetRole in (select user_role_id from user_roles where role = '"+userRoles[userRoles.employee]+"') then\n" +
            "        update users\n" +
            "        set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.employee]+"')\n" +
            "        where user_id = userID;\n" +
            "        update accounts\n" +
            "        set addressable = "+sqlBool.true+"n" +
            "        where user_id = userID;\n" +
            "    else\n" +
            "        set roleAltered = "+sqlBool.false+";\n" +
            "        set errormsg = 'Invalid role.';\n" +
            "    end if;\n" +
            "end;", name: "alter_user_role"},
    insert_user_role= { statement: "create procedure if not exists insert_user_role(in roleName varchar(16))\n" +
            "begin\n" +
            "if roleName not in (select role from user_roles) then\n" +
            "   insert into user_roles(role)\n" +
            "        values (roleName);\n" +
            "   end if;\n" +
            "end;", name: "insert_user_role"},
    insert_transaction_type= { statement: "create procedure if not exists insert_transaction_type(in typeString varchar(16))\n" +
            "begin\n" +
            "if typeString not in (select type from transaction_type) then\n" +
            "    insert into transaction_type(type)\n" +
            "    values (typeString);\n" +
            "   end if;\n" +
            "end;", name: "insert_transaction_type"},
    insert_account_type = { statement: "create procedure if not exists insert_account_type(in typeString varchar(16))\n" +
            "begin\n" +
            "    if typeString not in (select type from account_types) then\n" +
            "        insert into account_types(type)\n" +
            "        values (typeString);\n" +
            "    end if;\n" +
            "end;", name: "insert_account_type"},
    register_user= { statement: "create procedure if not exists register_user(in externalID int, in unHashedPassword varchar(255),\n" +
            "                                             in firstName varchar(32),\n" +
            "                                             in lastName varchar(32), in userRoleID int, out registerSuccess bit(1))\n" +
            "begin\n" +
            "    set registerSuccess = "+sqlBool.true+";\n" +
            "    set @salt = (SELECT SUBSTRING(SHA1(RAND()), 1, 6));\n" +
            "    insert into users(external_id, hashed_password, salt, first_name, last_name, user_role_id)\n" +
            "    values (externalID, SHA1(CONCAT(unHashedPassword, @salt)), @salt, firstName, lastName, userRoleID);\n" +
            "end;", name: "register_user"},
    check_credentials= { statement: "create procedure if not exists check_credentials(in externalID int, in unHashedPassword varchar(255),\n" +
            "                                                 out userRoleID int,\n" +
            "                                                 out credentialsAuthorized bit(1))\n" +
            "begin\n" +
            "    if SHA1(CONCAT(unHashedPassword, (select salt from users where external_id = externalID LIMIT 1))) =\n" +
            "       (select (hashed_password) from users where external_id = externalID LIMIT 1) then\n" +
            "        set credentialsAuthorized = "+sqlBool.true+";\n" +
            "        set userRoleID = (select user_role_id from users where external_id = externalID);\n" +
            "    else\n" +
            "        set credentialsAuthorized = "+sqlBool.false+";\n" +
            "        set userRoleID = -1;\n" +
            "    end if;\n" +
            "end;", name: "check_credentials"},
    view_all_history= { statement: "create procedure if not exists view_all_history(in accountID int)\n" +
            "begin\n" +
            "    select *\n" +
            "    from (select *\n" +
            "          from view_deposits\n" +
            "          UNION\n" +
            "          select *\n" +
            "          from view_withdrawals\n" +
            "          UNION\n" +
            "          select *\n" +
            "          from view_incoming_transfers\n" +
            "          where `to` = accountID\n" +
            "          UNION\n" +
            "          select *\n" +
            "          from view_outgoing_transfers\n" +
            "          where `from` = accountID) as unionTbls\n" +
            "    order by unionTbls.`Transaction Number` desc;\n" +
            "end;", name: "view_all_history"},
    get_user_info= { statement: "create procedure if not exists get_user_info(in externalID int)\n" +
            "begin\n" +
            "    select * from user_info where external_id = externalID;\n" +
            "end;", name: "get_user_info"},
    get_incoming_transfers= { statement: "create procedure if not exists get_incoming_transfers(in accountID int)\n" +
            "begin\n" +
            "    select * from view_incoming_transfers where accountID = `to`;\n" +
            "end;", name: "get_incoming_transfers"},
    get_outgoing_transfers= { statement: "create procedure if not exists get_outgoing_transfers(in accountID int)\n" +
            "begin\n" +
            "    select * from view_outgoing_transfers where accountID = `from`;\n" +
            "end;", name: "get_outgoing_transfers"},
    get_deposits = { statement: "create procedure if not exists get_deposits(in accountID int)\n" +
            "begin\n" +
            "    select * from view_deposits where accountID = `to`;\n" +
            "end;", name: "get_deposits"},
    get_withdrawals= { statement: "create procedure if not exists get_withdrawals(in accountID int)\n" +
            "begin\n" +
            "    select * from view_withdrawals where accountID = `from`;\n" +
            "end;", name: "get_withdrawals"},
    get_balance= { statement: "create procedure if not exists get_balance(in userID int, in accountType varchar(16))\n" +
            "begin\n" +
            "    select `Present Balance` from view_balance where userID = uid and type = accountType;\n" +
            "end;", name: "get_balance"},
    get_incoming_transfers_date_range= { statement: "create procedure if not exists get_incoming_transfers_date_range(in accountID int, in lower DATETIME, in upper DATETIME)\n" +
            "begin\n" +
            "    select * from view_incoming_transfers where accountID = `to` and `Date and Time` BETWEEN lower and upper;\n" +
            "end;", name: "get_incoming_transfers_date_range"},
    get_outgoing_transfers_date_range= { statement: "create procedure if not exists get_outgoing_transfers_date_range(in accountID int, in lower DATETIME, in upper DATETIME)\n" +
            "begin\n" +
            "    select * from view_outgoing_transfers where accountID = `from` and `Date and Time` BETWEEN lower and upper;\n" +
            "end;", name: "get_outgoing_transfers_date_range"},
    get_deposits_date_range= { statement: "create procedure if not exists get_deposits_date_range(in accountID int, in lower DATETIME, in upper DATETIME)\n" +
            "begin\n" +
            "    select * from view_deposits where accountID = `to` and `Date and Time` BETWEEN lower and upper;\n" +
            "end;", name: "get_deposits_date_range"},
    get_withdrawals_date_range= { statement: "create procedure if not exists get_withdrawals_date_range(in accountID int, in lower DATETIME, in upper DATETIME)\n" +
            "begin\n" +
            "    select * from view_withdrawals where accountID = `from` and `Date and Time` BETWEEN lower and upper;\n" +
            "end;", name: "get_withdrawals_date_range"},
];

exports.tables = DBTableStatements;
exports.views = DBViewStatements;
exports.procedures = DBProcedureStatements;

exports.roles = userRoles;
exports.accountTypes = accountTypes;
exports.transactionTypes = transactionTypes;
exports.sqlBool = sqlBool;