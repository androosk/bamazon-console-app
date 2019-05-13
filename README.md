# bamazon-console-app
Console Node.js and MySql Amazon Simulation

## NPM Dependencies
- Run npm install
- mysql for the mysql database
- inquirer for the user input
- cli-table2 for pretty printing mysql data
- colors for more pretty formatting features and super awesome colored fonts!

## node bamazonCustomer
- Automatically displays table of available items in store with ID number for ordering, quantity available and price
- Place an order with ID number
- Finish order and your order total shows
- Item quantity is removed from stock_quantity value in products table in database
- Total sales are added to product_sales value in products table in database
- User is asked to order again or exit

## node bamazonManager
- User is presented with a menu with five options
- View Products for Sale provides same table of inventory as bamazonCustomer app
- View Low Inventory provides table of only items where value of stock_quantity is 5 or less
- Add to Current Inventory prompts the user to add items to an existing stock item by id, this also adds to the value in the over_head_costs column for that category in the departments table based on the number of units added multiplied times the unit_cost for that item in the products table
- Add New Product provides the user with a series of queries to fill out for product_name, department_name, price, unit_cost and stock_quantity for a new item being added to inventory. This adds a new row to the products table and adds to the whole_sale_costs total for that department in the departments table
- Exit the app

## node bamazonSupervisor
- User is presented with a menu with three options
- View Product Sales by Department provides a table sorted by department where the user is given the department, overhead cost, product sales, and total profit or loss by department
- Profit/-Loss is a dynamically created column that subtracts over_head_costs from the departments table from the sum of product_sales by department from the products table to provide a profit or loss number
- Create new department allows the user to create a new department for the Manager to add products to
- Exit the app

### Sample tables have been included
- departments.csv
- products.csv

## link to screencastify of all three apps in use on YouTube
https://youtu.be/oj3-CYu71ds
