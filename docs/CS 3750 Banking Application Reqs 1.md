# Stakeholders (Users)
- Customers 
- Admins 
- Employees 

# Functional
- login to account

- Add 1 checking account to Customer account
- Add 1 savings account to Customer account
- View transfer activity
	- timestamps
	- memos
- Create and Execute Transfers
	- Memos
	- Timestamps
- Make Withdrawals
- Make Deposits
- View Statements
- View Balances
- Change passwords
- View List of users
- 

| Item                    |        C        |             R              |           U            |           D            |    E     |
| :---------------------- | :-------------: | :------------------------: | :--------------------: | :--------------------: | :------: |
| Customer ID (~username) |    Customer     | Customer, Admin, Employees |        Customer        |    Admin(Customer)     |    -     |
| Customer Password       |    Customer     |             -              |    Admin(Customer)     |           -            |    -     |
| Employee Password       | Employee, Admin |             -              | Admin, Admin(Employee) | Admin, Admin(Employee) |    -     |
| ?                       |                 |                            |                        |                        |          |
| Login                   |        -        |             -              |           -            |           -            |   All    |
| Account Type            |    Customer     |    Customer, Employees     |        Customer        |    Admin(Customer)     |    -     |
| Transfers               |    Customer     |    Customer, Employees     |        Customer        |        Customer        | Customer |
| Transfer History        |        -        |    Customer, Employees     |           -            |           -            |    -     |
| Balances                |        -        |    Customer, Employees     |           -            |           -            |    -     |
| Withdrawals             |    Customer     |    Customer, Employees     |           -            |           -            | Customer |
| Deposits                |    Customer     |    Customer, Employees     |           -            |           -            | Customer |
|                         |                 |                            |                        |                        |          |




# Non-Functional
## Usability
## Reliability 
## Performance
## Security
- Prevent double spending
- Prevent over-spending
- verify password changes with account owner

## Legal

### Questions
- [ ] (dumb) Is the relationship of users to bank accounts strictly 1:2, or is there a user->account\[n]\(savings, checking) relationship where each user can have multiple accounts with a savings and checking? (should be 1:2)
- [ ] Do employees have accounts? (should be yes)
- [ ] Is there an existing registration platform?
- [ ] What other infrastructure and interfaces already exist?
- [ ] What information will need to be converted from other mediums? 
- [ ] Are transfers restricted to internal accounts? 
- [ ] Are transfers restricted to a customer's own internal accounts?
- [ ] What fields are required for registration?
- [ ] How are password resets to be handled?
- [ ] Are updates to user id's also handled by admins?
- [ ] If a customer would like to make changes to an account, such as closing the account or changing its type, would an employee or admin handle it or would the customer be able to do it on their own?
- [ ] What actions, if any, can be performed on the customers request by a staff member? which of these actions are shared between admins and regular employees, and which are exclusive to each group?
- [ ] Does the system need to support withdrawals and deposits?
- [ ] Are there any user stories already or do I need to come up with them?


# Diagram topics
- Activity:
	- Change password
	- Initiate Transfer
- 