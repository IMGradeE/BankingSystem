// todo enums for type injection, will make modifications easier/ensure names are not misspelled.
const userRoles = Object.freeze({
    1: 'customer',
    2:'employee',
    3:'admin',
    'customer': 1,
    'employee':2,
    'admin':3
})

const accountIndices = Object.freeze({
    0 : 'savings',
    1 : 'checking',
    'savings' : 0,
    'checking' : 1
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
    true:1,
    false:0,
    1:true,
    0:false
})

const accountTypes = Object.freeze({
    1:'savings',
    2:'checking',
    'savings':1,
    'checking':2
})

const DBTableStatements = [
    account_types = {
        statement: "CREATE TABLE IF NOT EXISTS account_types\n" +
            "(\n" +
            "    account_type_id INT         NOT NULL AUTO_INCREMENT,\n" +
            "    type            VARCHAR(16) NOT NULL,\n" +
            "    PRIMARY KEY (account_type_id),\n" +
            "    UNIQUE (type)\n" +
            ");",
        name: "account_types"
    },
    user_roles = {
        statement: "CREATE TABLE IF NOT EXISTS user_roles\n" +
            "(\n" +
            "    user_role_id INT         NOT NULL AUTO_INCREMENT,\n" +
            "    role         VARCHAR(16) NOT NULL,\n" +
            "    PRIMARY KEY (user_role_id),\n" +
            "    UNIQUE (role)\n" +
            ");",
        name: "user_roles"
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
            "    constraint unique_name UNIQUE (first_name, last_name)\n" +
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
        statement: "\n" +
            "create table if not exists banking_system.account_transactions\n" +
            "(\n" +
            "    transaction_id                   int auto_increment\n" +
            "        primary key,\n" +
            "    transaction_type_id              int      default 1                 not null,\n" +
            "    transaction_memo                 text                               null,\n" +
            "    transaction_timestamp            datetime default CURRENT_TIMESTAMP not null,\n" +
            "    transaction_source_account_id    int                                null,\n" +
            "    transaction_target_account_id    int                                null,\n" +
            "    transaction_initiated_by_external_id int                                not null,\n" +
            "    transaction_amount_cents         int                                not null,\n" +
            "    initial_cents_origin             int      default (0)               not null,\n" +
            "    initial_cents_target             int      default (0)               not null,\n" +
            "    new_cents_origin                 int                                null,\n" +
            "    new_cents_target                 int                                null,\n" +
            "    constraint account_transactions_ibfk_1\n" +
            "        foreign key (transaction_type_id) references banking_system.transaction_type (transaction_type_id),\n" +
            "    constraint account_transactions_ibfk_2\n" +
            "        foreign key (transaction_initiated_by_external_id) references banking_system.users (external_id),\n" +
            "    constraint account_transactions_ibfk_3\n" +
            "        foreign key (transaction_source_account_id) references banking_system.accounts (account_id),\n" +
            "    constraint account_transactions_ibfk_4\n" +
            "        foreign key (transaction_target_account_id) references banking_system.accounts (account_id)\n" +
            ");\n",
        name: "account_transactions"
    }
];

const DBViewStatements = [
    view_transactions= {
        statement: "create or replace view view_transactions as\n" +
            "select transaction_id                                    'Transaction Number',\n" +
            "       CONCAT( SIGN(act.initial_cents_origin) * ABS(act.initial_cents_origin) DIV 100, '.',\n" +
            "              RPAD(ABS(act.initial_cents_origin) MOD 100, 2, 0))     'Origin Starting Balance',\n" +
            "       CONCAT( SIGN(act.initial_cents_target) * ABS(act.initial_cents_target) DIV 100, '.',\n" +
            "              RPAD(ABS(act.initial_cents_target) MOD 100, 2, 0))     'Target Starting Balance',\n" +
            "       CONCAT( SIGN(act.transaction_amount_cents) * ABS(act.transaction_amount_cents) DIV 100, '.',\n" +
            "              RPAD(ABS(act.transaction_amount_cents) MOD 100, 2, 0)) 'Amount',\n" +
            "       CONCAT( SIGN(act.new_cents_origin) * ABS(act.new_cents_origin) DIV 100, '.',\n" +
            "              RPAD(ABS(act.new_cents_origin) MOD 100, 2, 0))         'Origin Final Balance',\n" +
            "       CONCAT( SIGN(act.new_cents_target) * ABS(act.new_cents_target) DIV 100, '.',\n" +
            "              RPAD(ABS(act.new_cents_target) MOD 100, 2, 0))         'Target Final Balance',\n" +
            "       concat(u.first_name, ' ', u.last_name)            'Initiated by',\n" +
            "       transaction_memo                                  'Memo',\n" +
            "       transaction_timestamp                             'Date and Time',\n" +
            "       tt.type                                           'Type',\n" +
            "       transaction_source_account_id                     source_acct,\n" +
            "       transaction_target_account_id                     target_acct\n" +
            "from account_transactions act\n" +
            "         inner join transaction_type tt on act.transaction_type_id = tt.transaction_type_id\n" +
            "         inner join users u on act.transaction_initiated_by_external_id = u.external_id\n" +
            "group by `Transaction Number`;\n",
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
            "       `Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where `Type` = 'transfer'\n" +
            "group by banking_system. view_transactions.`Transaction Number`, `to`;",
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
            "       `Type`,\n" +
            "       source_acct               as `from`,\n" +
            "       target_acct               as `to`\n" +
            "from view_transactions\n" +
            "where `Type` = 'transfer'\n" +
            "group by banking_system.view_transactions.`Transaction Number`, `from`;",
        name: "view_outgoing_transfers"
    },
    view_all_transfers = {statement: "create or replace definer = root@localhost view view_all_transfers as\n" +
            "select `banking_system`.`view_transactions`.`Transaction Number`      AS `Transaction Number`,\n" +
            "       `banking_system`.`view_transactions`.`Target Starting Balance` AS `Starting Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Amount`                  AS `Amount`,\n" +
            "       `banking_system`.`view_transactions`.`Target Final Balance`    AS `Final Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Initiated by`            AS `Initiated by`,\n" +
            "       `banking_system`.`view_transactions`.`Memo`                    AS `Memo`,\n" +
            "       `banking_system`.`view_transactions`.`Date and Time`           AS `Date and Time`,\n" +
            "       `banking_system`.`view_transactions`.`Type`                    AS `Type`,\n" +
            "       `banking_system`.`view_transactions`.`source_acct`             AS `from`,\n" +
            "       `banking_system`.`view_transactions`.`target_acct`             AS `to`\n" +
            "from `banking_system`.`view_transactions`\n" +
            "where (`banking_system`.`view_transactions`.`Type` = 'transfer')\n" +
            "group by `banking_system`.`view_transactions`.`Transaction Number`;", name: "view_all_transfers"   },


    view_deposits = {
        statement: "create or replace definer = root@localhost view banking_system.view_deposits as\n" +
            "select `banking_system`.`view_transactions`.`Transaction Number`      AS `Transaction Number`,\n" +
            "       `banking_system`.`view_transactions`.`Target Starting Balance` AS `Starting Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Amount`                  AS `Amount`,\n" +
            "       `banking_system`.`view_transactions`.`Target Final Balance`    AS `Final Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Initiated by`            AS `Initiated by`,\n" +
            "       `banking_system`.`view_transactions`.`Memo`                    AS `Memo`,\n" +
            "       `banking_system`.`view_transactions`.`Date and Time`           AS `Date and Time`,\n" +
            "       `banking_system`.`view_transactions`.`Type`        AS `Type`,\n" +
            "       `banking_system`.`view_transactions`.`source_acct`             AS `from`,\n" +
            "       `banking_system`.`view_transactions`.`target_acct`             AS `to`\n" +
            "from `banking_system`.`view_transactions`\n" +
            "where ((`banking_system`.`view_transactions`.`source_acct` is null) and\n" +
            "       (`banking_system`.`view_transactions`.`Type` in (select `banking_system`.`transaction_type`.`type`\n" +
            "                                                                    from `banking_system`.`transaction_type`\n" +
            "                                                                    where (`banking_system`.`transaction_type`.`type` = 'deposit'))))\n" +
            "group by `banking_system`.`view_transactions`.`Transaction Number`, `to`\n" +
            "order by `banking_system`.`view_transactions`.`Transaction Number` desc;\n",
        name: "view_deposits"
    },
    view_withdrawals = {
        statement: "create or replace view view_withdrawals as\n" +
            "select `banking_system`.`view_transactions`.`Transaction Number`      AS `Transaction Number`,\n" +
            "       `banking_system`.`view_transactions`.`Origin Starting Balance` AS `Starting Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Amount`                  AS `Amount`,\n" +
            "       `banking_system`.`view_transactions`.`Origin Final Balance`    AS `Final Balance`,\n" +
            "       `banking_system`.`view_transactions`.`Initiated by`            AS `Initiated by`,\n" +
            "       `banking_system`.`view_transactions`.`Memo`                    AS `Memo`,\n" +
            "       `banking_system`.`view_transactions`.`Date and Time`           AS `Date and Time`,\n" +
            "       `banking_system`.`view_transactions`.`Type`        AS `Type`,\n" +
            "       `banking_system`.`view_transactions`.`source_acct`             AS `from`,\n" +
            "       `banking_system`.`view_transactions`.`target_acct`             AS `to`\n" +
            "from `banking_system`.`view_transactions`\n" +
            "where ((`banking_system`.`view_transactions`.`target_acct` is null) and\n" +
            "       `banking_system`.`view_transactions`.`Type` in (select `banking_system`.`transaction_type`.`type`\n" +
            "                                                                   from `banking_system`.`transaction_type`\n" +
            "                                                                   where (`banking_system`.`transaction_type`.`transaction_type_id` = 3)))\n" +
            "group by `banking_system`.`view_transactions`.`Transaction Number`, `from`;",
        name: "view_withdrawals"
    },
    view_balance = {
        statement: "create or replace view view_balance as\n" +
            "select u.user_id as                       uid,\n" +
            "        accounts.account_id as                   aid,\n" +
            "       type,\n" +
            "       CONCAT('$', SIGN(account_cents) * ABS(account_cents) DIV 100, '.',\n" +
            "              ABS(account_cents) MOD 100) `Present Balance`,\n" +
            "       account_cents as cents\n" +
            "from accounts\n" +
            "         inner join account_types a on accounts.account_type_id = a.account_type_id\n" +
            "         inner join users u on accounts.user_id = u.user_id;",
        name: "view_balance"
    },
    user_info = {
        statement: "create or replace view user_info as\n" +
            "select first_name,\n" +
            "       last_name,\n" +
            "       users.user_id,\n" +
            "       account_id,\n" +
            "       account_cents,\n" +
            "       a.account_type_id,\n" +
            "       addressable,\n" +
            "       users.user_role_id,\n" +
            "       users.external_id,\n" +
            "       role,\n" +
            "       type\n" +
            "from users\n" +
            "         inner join accounts a on users.user_id = a.user_id\n" +
            "         inner join user_roles ur on users.user_role_id = ur.user_role_id\n" +
            "         inner join account_types on a.account_type_id = account_types.account_type_id;",
        name: "user_info"
    }
];

const DBProcedureStatements = [
    get_balance = {statement: "create procedure if not exists get_balance(in accountNumber int)\n" +
            "begin\n" +
            "    select `Present Balance`, cents from view_balance where aid = accountNumber;\n" +
            "end;", name: "get_balance"},
    get_all_transfers = {
        statement:"create\n" +
            "    definer = root@localhost procedure if not exists get_all_transfers(IN userID int)\n" +
            "begin\n" +
            "    select *, case\n" +
            "    when v.`from` in (select account_id from accounts where accounts.user_id = userID) then 'outgoing'\n" +
            "    when v.`to` in (select account_id from accounts where accounts.user_id = userID) then 'incoming'\n" +
            "    END as Direction\n" +
            "    from view_all_transfers as v\n" +
            "    where v.`from` in (select account_id from accounts where accounts.user_id = userID) or v.`to` in (select account_id from accounts where accounts.user_id = userID)\n" +
            "order by v.`Date and Time` DESC;\n" +
            "end;",
        name: "get_all_transfers"
    },
    initiate_transfer= { statement: "\n" +
            "create\n" +
            "    definer = root@localhost procedure if not exists banking_system.initiate_transfer(IN origin int, IN target int,\n" +
            "                                                                        IN initiatedBy int, IN memo text, IN amount int,\n" +
            "                                                                        OUT transferSuccess bit)\n" +
            "begin\n" +
            "\n" +
            "    set transferSuccess = 1; /*assume we will be successful*/\n" +
            "    if transferSuccess = (select addressable from accounts as a where a.account_id = target) and origin != target then\n" +
            "        start transaction;\n" +
            "        set @initialOriginBalance = (select accounts.account_cents from accounts where account_id = origin);\n" +
            "        set @initialTargetBalance = (select accounts.account_cents from accounts where account_id = target);\n" +
            "        set @finalOriginBalance = @initialOriginBalance - amount;\n" +
            "        set @finalTargetBalance = @initialTargetBalance + amount;\n" +
            "        insert into account_transactions(transaction_memo, transaction_source_account_id, transaction_target_account_id,\n" +
            "                                         transaction_initiated_by_external_id, initial_cents_origin, initial_cents_target,\n" +
            "                                         new_cents_origin, new_cents_target, transaction_amount_cents,\n" +
            "                                         transaction_type_id)\n" +
            "        values (memo, origin, target, initiatedBy, @initialOriginBalance, @initialTargetBalance,\n" +
            "                @finalOriginBalance, @finalTargetBalance, amount,"+transactionTypes.transfer+");\n" +
            "        update accounts\n" +
            "        set account_cents = @finalOriginBalance\n" +
            "        where account_id = origin;\n" +
            "        update accounts\n" +
            "        set account_cents = @finalTargetBalance\n" +
            "        where account_id = target;\n" +
            "        commit;\n" +
            "    else\n" +
            "        set transferSuccess = 0;\n" +
            "    end if;\n" +
            "end;\n", name: "initiate_transfer"},
    initiate_withdrawal= { statement: "create\n" +
            "    definer = root@localhost procedure if not exists initiate_withdrawal(IN origin int, IN initiatedBy int, IN amount int, out res int)\n" +
            "begin\n" +
            "    set res = 0;\n" +
            "    set @beginningBalance = (select accounts.account_cents from accounts where account_id = origin);\n" +
            "    set @finalBalance = @beginningBalance - amount;\n" +
            "    insert into account_transactions(transaction_source_account_id,\n" +
            "                                     transaction_initiated_by_external_id, initial_cents_origin,\n" +
            "                                     new_cents_origin, transaction_amount_cents, transaction_type_id)\n" +
            "    values (origin, initiatedBy, @beginningBalance, @finalBalance, amount, 3);\n" +
            "    update accounts\n" +
            "    set account_cents = @finalBalance\n" +
            "    where account_id = origin;\n" +
            "    set res = 1;\n" +
            "end;", name: "initiate_withdrawal"},
    initiate_deposit= { statement: "create\n" +
            "    definer = root@localhost procedure if not exists banking_system.initiate_deposit(IN destination int,\n" +
            "                                                                       IN initiatedBy int, IN amount int,\n" +
            "                                                                       out success int)\n" +
            "begin\n" +
            "    set @addressable = 1;\n" +
            "    set success = 1;/*assume we will be successful*/\n" +
            "    if @addressable = (select addressable from accounts as a where a.account_id = destination) then\n" +
            "        set @initialTargetBalance =\n" +
            "                (select accounts.account_cents from accounts where account_id = destination limit 1);\n" +
            "        set @newBalance = @initialTargetBalance + amount;\n" +
            "        insert into account_transactions(transaction_target_account_id,\n" +
            "                                         transaction_initiated_by_external_id, initial_cents_target,\n" +
            "                                         transaction_amount_cents,\n" +
            "                                         new_cents_target, transaction_type_id)\n" +
            "        values (destination, initiatedBy, @initialTargetBalance, amount, @newBalance, "+transactionTypes.deposit+");\n" +
            "        update accounts\n" +
            "        set account_cents = @newBalance\n" +
            "        where account_id = destination;\n" +
            "    else\n" +
            "        set success = 0;\n" +
            "    end if;\n" +
            "end;", name: "initiate_deposit"},
    reset_password= { statement: "create procedure if not exists reset_password(in externalID int, in unhashedPassword varchar(255))\n" +
            "begin\n" +
            "    set @salt = (SELECT SUBSTRING(SHA1(RAND()), 1, 6));\n" +
            "    update users\n" +
            "    set hashed_password = SHA1(CONCAT(unHashedPassword, @salt)), salt = @salt\n" +
            "    where external_id = externalID;\n" +
            "end;", name: "reset_password"},
    alter_user_role= { statement: "create procedure if not exists alter_user_role(in targetRole int, in externalID int, out roleAltered bit(1),\n" +
            "                                               out errormsg varchar(18))\n" +
            "begin\n" +
            "    set roleAltered = "+sqlBool.false+";\n" +
            "    if targetRole in (select user_role_id from user_roles where role = '"+ userRoles[userRoles.admin] +"') then\n" +
            "        if exists (select users.user_id, users.external_id from accounts inner join users on users.user_id = accounts.user_id where external_id = externalID and account_cents > 0) then\n" +
            "            set roleAltered = "+sqlBool.false+";\n" +
            "            set errormsg = 'User cannot be made an admin until all account balances are 0.';\n" +
            "        else\n" +
            "            update users\n" +
            "            set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.admin]+"')\n" +
            "            where users.external_id = externalID;\n" +
            "            update accounts\n" +
            "            set addressable = "+sqlBool.false+"\n" +
            "            where (select user_id from users where external_id = externalID limit 1) = accounts.user_id;\n" +
            "            set roleAltered = "+userRoles.admin+";\n" +
            "        end if;\n" +
            "    elseif targetRole in (select user_role_id from user_roles where role = '"+userRoles[userRoles.customer]+"') then\n" +
            "        update users\n" +
            "        set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.customer]+"')\n" +
            "        where external_id = externalID;\n" +
            "        update accounts\n" +
            "        set addressable = "+sqlBool.true+"\n" +
            "        where (select user_id from users where external_id = externalID limit 1) = accounts.user_id;\n" +
            "    elseif targetRole in (select user_role_id from user_roles where role = '"+userRoles[userRoles.employee]+"') then\n" +
            "        update users\n" +
            "        set user_role_id = (select user_role_id from user_roles where role = '"+userRoles[userRoles.employee]+"')\n" +
            "        where external_id = externalID;\n" +
            "        update accounts\n" +
            "        set addressable = "+sqlBool.true+"\n" +
            "        where (select user_id from users where external_id = externalID limit 1) = accounts.user_id;\n" +
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
    register_user= { statement: " create procedure if not exists register_user(in externalID int, in unHashedPassword varchar(255),\n" +
            "                                                             in firstName varchar(32),\n" +
            "                                                             in lastName varchar(32), in userRoleID int)\n" +
            "                begin\n" +
            "                    set @salt = (SELECT SUBSTRING(SHA1(RAND()), 1, 6));\n" +
            "                    insert into users(external_id, hashed_password, salt, first_name, last_name, user_role_id)\n" +
            "                    values (externalID, SHA1(CONCAT(unHashedPassword, @salt)), @salt, firstName, lastName, userRoleID);\n" +
            "                    insert into accounts(account_type_id, user_id)\n" +
            "                    values(" + accountTypes.savings + ", (select user_id from users where users.external_id = externalID));\n " +
            "                end;", name: "register_user"},
    check_credentials= { statement: "create\n" +
            "    definer = root@localhost procedure if not exists banking_system.check_credentials(IN externalID int,\n" +
            "                                                                        IN unHashedPassword varchar(255),\n" +
            "                                                                        OUT userRoleID int,\n" +
            "                                                                        OUT idAuthed int,\n" +
            "                                                                        out passwordAuthed int)\n" +
            "begin\n" +
            "    if externalID in (select external_id from users where external_id = externalID) then\n" +
            "        set idAuthed = 1;\n" +
            "    else\n" +
            "        set idAuthed = 0;\n" +
            "    end if;\n" +
            "\n" +
            "    if SHA1(CONCAT(unHashedPassword, (select salt from users where external_id = externalID LIMIT 1))) =\n" +
            "       (select (hashed_password) from users where external_id = externalID LIMIT 1) then\n" +
            "        set passwordAuthed = 1;\n" +
            "        set userRoleID = (select user_role_id from users where external_id = externalID);\n" +
            "    else\n" +
            "        set passwordAuthed = 0;\n" +
            "        set userRoleID = -1;\n" +
            "    end if;\n" +
            "end ;", name: "check_credentials"},
    view_all_history= { statement: "create\n" +
            "    definer = root@localhost procedure if not exists banking_system.view_all_history(IN accountID int)\n" +
            "begin\n" +
            "    select *\n" +
            "      from view_deposits\n" +
            "      where `to` = accountID\n" +
            "      UNION\n" +
            "      select *\n" +
            "      from view_withdrawals\n" +
            "      where `from` = accountID\n" +
            "      UNION\n" +
            "      select *\n" +
            "      from view_incoming_transfers\n" +
            "      where `to` = accountID\n" +
            "      UNION\n" +
            "      select *\n" +
            "      from view_outgoing_transfers\n" +
            "      where `from` = accountID\n" +
            "  order by `Transaction Number` desc;\n" +
            "end;", name: "view_all_history"},
    get_user_info= { statement: "create procedure if not exists get_user_info(in externalID int)\n" +
            "begin\n" +
            "    select * from user_info where external_id = externalID order by a.account_type_id;\n" +
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
    get_user_info_from_name = {statement:
        "create procedure if not exists get_user_info_from_name(in firstName varchar(32), in lastName varchar(32))\n" +
                "begin\n" +
            "    select * from user_info where first_name = firstName AND last_name = lastName;\n" +
            "end;", name: "get_user_info_from_name",
    },
    insert_account = {
        statement: "CREATE DEFINER=`root`@`localhost` PROCEDURE if not exists `insert_account`(in externalID int)\n" +
            "begin\n" +
            "    set @accounts_open = (select count(*)\n" +
            "                          from accounts\n" +
            "                                   inner join users u on accounts.user_id = u.user_id\n" +
            "                          where u.external_id = externalID);\n" +
            "    set @userID = (select user_id from users u\n" +
            "                          where external_id = externalID);\n" +
            "    if @accounts_open = 0 then\n" +
            "        insert into accounts(account_type_id, user_id)\n" +
            "        values (1, @userID);\n" +
            "    elseif @accounts_open = 1 then\n" +
            "        insert into accounts(account_type_id, user_id)\n" +
            "        values ('2', @userID);\n" +
            "    end if;\n" +
            "end", name: "insert_account"
    }
];

exports.tables = DBTableStatements;
exports.views = DBViewStatements;
exports.procedures = DBProcedureStatements;
exports.accountIndices = accountIndices;
exports.roles = userRoles;
exports.accountTypes = accountTypes;
exports.transactionTypes = transactionTypes;
exports.sqlBool = sqlBool;