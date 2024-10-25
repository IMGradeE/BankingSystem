CREATE DATABASE IF NOT EXISTS banking_system;

use banking_system;

CREATE TABLE IF NOT EXISTS account_types
(
    account_type_id INT         NOT NULL AUTO_INCREMENT,
    type            VARCHAR(16) NOT NULL,
    PRIMARY KEY (account_type_id),
    UNIQUE (type)
);

CREATE TABLE IF NOT EXISTS user_roles
(
    user_role_id INT         NOT NULL AUTO_INCREMENT,
    role         VARCHAR(16) NOT NULL,
    PRIMARY KEY (user_role_id),
    UNIQUE (role)
);

CREATE TABLE IF NOT EXISTS transaction_type
(
    transaction_type_id INT         NOT NULL AUTO_INCREMENT,
    type                VARCHAR(16) NOT NULL,
    PRIMARY KEY (transaction_type_id),
    UNIQUE (type)
);

CREATE TABLE IF NOT EXISTS users
(
    user_id         INT          NOT NULL AUTO_INCREMENT,
    external_id     INT          NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    salt            VARCHAR(255) NOT NULL,
    first_name      VARCHAR(32)  NOT NULL,
    last_name       VARCHAR(32)  NOT NULL,
    user_role_id    INT          NOT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_role_id) REFERENCES user_roles (user_role_id),
    UNIQUE (external_id),
    UNIQUE (salt),
    UNIQUE (first_name, last_name)
);

CREATE TABLE IF NOT EXISTS accounts
(
    account_id      INT    NOT NULL AUTO_INCREMENT,
    account_cents   INT    NOT NULL DEFAULT (0)/*TODO inject*/,
    account_type_id INT    NOT NULL,
    user_id         INT    NOT NULL,
    addressable     bit(1) NOT NULL default b'1'/*TODO inject*/,
    PRIMARY KEY (account_id),
    FOREIGN KEY (account_type_id) REFERENCES account_types (account_type_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS account_transactions
(
    transaction_id                   INT      NOT NULL AUTO_INCREMENT,
    transaction_type_id              INT      NOT NULL DEFAULT 1 /*TODO inject*/,
    transaction_memo                 TEXT              DEFAULT NULL,
    transaction_timestamp            DATETIME NOT NULL DEFAULT NOW(),
    transaction_source_account_id    INT,
    transaction_target_account_id    INT,
    transaction_initiated_by_user_id INT      NOT NULL,
    transaction_amount_cents         INT      NOT NULL,
    initial_cents_origin             INT      NOT NULL DEFAULT (0),
    initial_cents_target             INT      NOT NULL DEFAULT (0),
    new_cents_origin                 INT,
    new_cents_target                 INT,
    PRIMARY KEY (transaction_id),
    FOREIGN KEY (transaction_type_id) REFERENCES transaction_type (transaction_type_id),
    FOREIGN KEY (transaction_initiated_by_user_id) REFERENCES users (user_id),
    FOREIGN KEY (transaction_source_account_id) REFERENCES accounts (account_id),
    FOREIGN KEY (transaction_target_account_id) REFERENCES accounts (account_id)
);

create or replace view view_transactions as
select transaction_id                                    'Transaction Number',
       CONCAT('$', SIGN(act.initial_cents_origin) * ABS(act.initial_cents_origin) DIV 100, '.',
              ABS(act.initial_cents_origin) MOD 100)     'Origin Starting Balance',
       CONCAT('$', SIGN(act.initial_cents_target) * ABS(act.initial_cents_target) DIV 100, '.',
              ABS(act.initial_cents_target) MOD 100)     'Target Starting Balance',
       CONCAT('$', SIGN(act.transaction_amount_cents) * ABS(act.transaction_amount_cents) DIV 100, '.',
              ABS(act.transaction_amount_cents) MOD 100) 'Amount',
       CONCAT('$', SIGN(act.new_cents_origin) * ABS(act.new_cents_origin) DIV 100, '.',
              ABS(act.new_cents_origin) MOD 100)         'Origin Final Balance',
       CONCAT('$', SIGN(act.new_cents_target) * ABS(act.new_cents_target) DIV 100, '.',
              ABS(act.new_cents_target) MOD 100)         'Target Final Balance',
       concat(u.first_name, ' ', u.last_name)            'Initiated by',
       transaction_memo                                  'Memo',
       transaction_timestamp                             'Date and Time',
       tt.type                                           'Transaction Type',
       transaction_source_account_id                     source_acct,
       transaction_target_account_id                     target_acct
from account_transactions act
         inner join transaction_type tt on act.transaction_type_id = tt.transaction_type_id
         inner join users u on act.transaction_initiated_by_user_id = u.user_id;

create or replace view view_incoming_transfers as
select `Transaction Number`,
       `Target Starting Balance` AS `Starting Balance`,
       `Amount`,
       `Target Final Balance`    AS `Final Balance`,
       `Initiated by`,
       `Memo`,
       `Date and Time`,
       `Transaction Type`,
       source_acct               as `from`,
       target_acct               as `to`
from view_transactions
where `Transaction Type` = 'transfer'
group by `to`;
/*We would get this for a specific user by
  select * from view_incoming_transfers where 'to' = account_id*/

create or replace view view_outgoing_transfers as
select `Transaction Number`,
       `Origin Starting Balance` AS `Starting Balance`,
       `Amount`,
       `Origin Final Balance`    AS `Final Balance`,
       `Initiated by`,
       `Memo`,
       `Date and Time`,
       `Transaction Type`,
       source_acct               as `from`,
       target_acct               as `to`
from view_transactions
where `Transaction Type` = 'transfer'
group by `from`;
/*We would get this for a specific user by
  select * from view_outgoing_transfers where 'from' = account_id*/

create or replace view view_deposits as
select `Transaction Number`,
       `Target Starting Balance` AS `Starting Balance`,
       `Amount`,
       `Target Final Balance`    AS `Final Balance`,
       `Initiated by`,
       `Memo`,
       `Date and Time`,
       `Transaction Type`,
       source_acct               as `from`,
       target_acct               as `to`
from view_transactions
where source_acct is null
  AND `Transaction Type` = (select transaction_type.type
                            from transaction_type
                            where transaction_type.type = 'deposit'/*TODO inject*/
                            limit 1)
group by 'to';
/*We would get this for a specific user by
  select * from view_deposits where 'to' = account_id*/

create or replace view view_withdrawals as
select `Transaction Number`,
       `Origin Starting Balance` AS `Starting Balance`,
       `Amount`,
       `Origin Final Balance`    AS `Final Balance`,
       `Initiated by`,
       `Memo`,
       `Date and Time`,
       `Transaction Type`,
       source_acct               as `from`,
       target_acct               as `to`
from view_transactions
where target_acct is null
  AND `Transaction Type` = (select transaction_type.type
                            from transaction_type
                            where transaction_type.type = 'withdrawal'/*TODO inject*/
                            limit 1)
group by 'from';
/*We would get this for a specific user by
  select * from view_withdrawals where user_id = 'user_id' AND 'from' = account_id*/

create or replace view view_balance as
select u.user_id as                       uid,
        accounts.account_id as                   aid,
       type,
       CONCAT('$', SIGN(account_cents) * ABS(account_cents) DIV 100, '.',
              ABS(account_cents) MOD 100) `Present Balance`,
       account_cents as cents
from accounts
         inner join account_types a on accounts.account_type_id = a.account_type_id
         inner join users u on accounts.user_id = u.user_id;
/*We would get this for a specific user by
  select 'Present Balance' from view_balance where user_id = 'user_id' AND 'Account Type' = <type>*/

create or replace view user_info as
select *
from users
         inner join accounts a on users.user_id = a.user_id
         inner join user_roles ur on users.user_role_id = ur.user_role_id
         inner join account_types on a.account_type_id = account_types.account_type_id;

/*PROCEDURES*/
/*TODO needs locks?*/

create procedure if not exists initiate_transfer(in origin int, in type int, in target int, in initiatedBy int,
                                                 in memo text,
                                                 in amount int,
                                                 in origin_beginningBalance int, in origin_finalBalance int,
                                                 in target_beginningBalance int, in target_finalBalance int,
                                                 out transferSuccess bit(1))
begin

    set transferSuccess = b'1'; /*assume we will be successful*/
    if transferSuccess = (select addressable from accounts as a where a.account_id = target) and origin != target then
        start transaction;
        insert into account_transactions(transaction_memo, transaction_source_account_id, transaction_target_account_id,
                                         transaction_initiated_by_user_id, initial_cents_origin, initial_cents_target,
                                         new_cents_origin, new_cents_target, transaction_amount_cents,
                                         transaction_type_id)
        values (memo, origin, target, initiatedBy, origin_beginningBalance, target_beginningBalance,
                origin_finalBalance, target_finalBalance, amount, type);
        update accounts
        set account_cents = origin_finalBalance
        where account_id = origin;
        update accounts
        set account_cents = target_finalBalance
        where account_id = target;
        commit;
    else
        set transferSuccess = b'0';
    end if;
end;

create procedure if not exists initiate_withdrawal(in origin int, in type int, in initiatedBy int, in amount int,
                                                   in beginningBalance int, in finalBalance int)
begin
    insert into account_transactions(transaction_source_account_id,
                                     transaction_initiated_by_user_id, initial_cents_origin,
                                     new_cents_origin, transaction_amount_cents, transaction_type_id)
    values (origin, initiatedBy, beginningBalance, finalBalance, amount, type);
    update accounts
    set account_cents = finalBalance
    where account_id = origin;
end;

create procedure if not exists initiate_deposit(in destination int, in type int, in initiatedBy int, in amount int,
                                                in beginningBalance int, in finalBalance int, out depositSuccess bit(1))
begin
    set depositSuccess = b'1'; /*assume we will be successful*/
    if depositSuccess = (select addressable from accounts as a where a.account_id = destination) then
        insert into account_transactions(transaction_target_account_id,
                                         transaction_initiated_by_user_id, initial_cents_target,
                                         transaction_amount_cents,
                                         new_cents_target, transaction_type_id)
        values (destination, initiatedBy, beginningBalance, amount, finalBalance, type);
        update accounts
        set account_cents = finalBalance
        where account_id = destination;
    else
        set depositSuccess = b'0';
    end if;
end;

create procedure if not exists reset_password(in external_id int, in unhashedPassword varchar(255))
begin
    set @salt = (SELECT SUBSTRING(SHA1(RAND()), 1, 6));
    update users
    set hashed_password = SHA1(CONCAT(unHashedPassword, @salt)) and salt = @salt
    where external_id = externalID;
end;


create procedure if not exists alter_user_role(in targetRole int, in externalID int, out roleAltered bit(1),
                                               out errormsg varchar(18))
begin
    set roleAltered = b'1';
    if targetRole in (select user_role_id from user_roles where role = 'admin'/*TODO inject*/) then
        if externalID in (select user_id from accounts where external_id = externalID and account_cents > 0) then
            set roleAltered = b'0';
            set errormsg = 'Has accounts open.';
        else
            update users
            set user_role_id = (select user_role_id from user_roles where role = 'admin'/*TODO inject*/)
            where externalID = external_id;
            update accounts
            set addressable = b'0'
            where externalID = external_id;
        end if;
    elseif targetRole in (select user_role_id from user_roles where role = 'customer'/*TODO inject*/) then
        update users
        set user_role_id = (select user_role_id from user_roles where role = 'customer'/*TODO inject*/)
        where externalID = external_id;
        update accounts
        set addressable = b'1'
        where externalID = external_id;
    elseif targetRole in (select user_role_id from user_roles where role = 'employee'/*TODO inject*/) then
        update users
        set user_role_id = (select user_role_id from user_roles where role = 'employee'/*TODO inject*/)
        where externalID = external_id;
        update accounts
        set addressable = b'1'
        where externalID = external_id;
    else
        set roleAltered = b'0';
        set errormsg = 'Invalid role.';
    end if;
end;

create procedure if not exists insert_user_role(in roleName varchar(16))
begin
if roleName not in (select role from user_roles) then
   insert into user_roles(role)
        values (roleName);
   end if;
end;

create procedure if not exists insert_transaction_type(in typeString varchar(16))
begin
if typeString not in (select type from transaction_type) then
    insert into transaction_type(type)
    values (typeString);
   end if;
end;

create procedure if not exists insert_account_type(in typeString varchar(16))
begin
    if typeString not in (select type from account_types) then
        insert into account_types(type)
        values (typeString);
    end if;
end;

/*
TODO should the password be hashed locally instead? May have other issues, I know nothing
*/

create procedure if not exists register_user(in externalID int, in unHashedPassword varchar(255),
                                             in firstName varchar(32),
                                             in lastName varchar(32), in userRoleID int, out registerSuccess bit(1))
begin
    set registerSuccess = b'1';
    set @salt = (SELECT SUBSTRING(SHA1(RAND()), 1, 6));
    insert into users(external_id, hashed_password, salt, first_name, last_name, user_role_id)
    values (externalID, SHA1(CONCAT(unHashedPassword, @salt)), @salt, firstName, lastName, userRoleID);
end;

create procedure if not exists check_credentials(in externalID int, in unHashedPassword varchar(255),
                                                 out userRoleID int,
                                                 out credentialsAuthorized bit(1))
begin
    if SHA1(CONCAT(unHashedPassword, (select salt from users where external_id = externalID LIMIT 1))) =
       (select (hashed_password) from users where external_id = externalID LIMIT 1) then
        set credentialsAuthorized = b'1';
        set userRoleID = (select user_role_id from users where external_id = externalID);
    else
        set credentialsAuthorized = b'0';
        set userRoleID = -1;
    end if;
end;

create procedure if not exists view_all_history(in accountID int)
begin
    select *
    from (select *
          from view_deposits
          UNION
          select *
          from view_withdrawals
          UNION
          select *
          from view_incoming_transfers
          where `to` = accountID
          UNION
          select *
          from view_outgoing_transfers
          where `from` = accountID) as unionTbls
    order by unionTbls.`Transaction Number` desc;
end;

create procedure if not exists get_user_info(in externalID int)
begin
    select * from user_info where external_id = externalID;
end;

create procedure if not exists get_user_info_from_name(in firstName varchar(32), in lastName varchar(32))
begin
    select * from user_info where first_name = firstName AND last_name = lastName;
end;

/*
TODO IN JAVASCRIPT
export history date range
export incoming transfers date range
export outgoing date range
export withdrawals date range
export deposits date range
*/

create procedure if not exists get_incoming_transfers(in accountID int)
begin
    select * from view_incoming_transfers where accountID = `to`;
end;

create procedure if not exists get_outgoing_transfers(in accountID int)
begin
    select * from view_outgoing_transfers where accountID = `from`;
end;

create procedure if not exists get_deposits(in accountID int)
begin
    select * from view_deposits where accountID = `to`;
end;

create procedure if not exists get_withdrawals(in accountID int)
begin
    select * from view_withdrawals where accountID = `from`;
end;

create procedure if not exists get_balance(in accountNumber int)
begin
    select `Present Balance`, cents from view_balance where aid = accountNumber;
end;


create procedure if not exists get_incoming_transfers_date_range(in accountID int, in lower DATETIME, in upper DATETIME)
begin
    select * from view_incoming_transfers where accountID = `to` and `Date and Time` BETWEEN lower and upper;
end;

create procedure if not exists get_outgoing_transfers_date_range(in accountID int, in lower DATETIME, in upper DATETIME)
begin
    select * from view_outgoing_transfers where accountID = `from` and `Date and Time` BETWEEN lower and upper;
end;

create procedure if not exists get_deposits_date_range(in accountID int, in lower DATETIME, in upper DATETIME)
begin
    select * from view_deposits where accountID = `to` and `Date and Time` BETWEEN lower and upper;
end;

create procedure if not exists get_withdrawals_date_range(in accountID int, in lower DATETIME, in upper DATETIME)
begin
    select * from view_withdrawals where accountID = `from` and `Date and Time` BETWEEN lower and upper;
end;
