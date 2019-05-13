//Set variables for dependencies and program business
let mysql = require('mysql')
//inquirer is the dependency for the user menus
let inquirer = require('inquirer')
//cli-table2 allows pretty printing of sql tables in the console. It eliminates the need for column title aliasing
//and makes the tables easy for the user to read
let Table = require('cli-table2')
//colors makes the data easier to read by rendering text colors for varying menu and input items
let colors = require('colors')
let orderItem = []
let orderQuant = 0
let newSales = 0
//Set mysql server connection
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: ""
});
connection.connect(function(err) {
  if (err) throw err
  runSearch()
})
//Query the products table from the server and serves up the menu for the user to buy an item
function runSearch() {
  var query = "SELECT * FROM products";
  connection.query(query, function(err, res) {
    let table = new Table({
      head: ['ID'.bold, 'Item Description'.bold, {hAlign: 'center', content: 'Department'.bold}, {hAlign: 'center', content: 'Price'.bold}, 'In Stock'.bold],
      colWidths: [5,40,20,10,10]
    })
    for (var i = 0; i < res.length; i++) {
      table.push([colors.cyan.bold(res[i].item_id), res[i].product_name, res[i].department_name,{hAlign:'right', content :'$'+parseFloat(res[i].price).toFixed(2)}, {hAlign: 'right', content: res[i].stock_quantity}])
    }
    console.log(table.toString())
    getTheOrder()
  })
}
//Greet the user and ask them what they would like to buy
function getTheOrder(){
  console.log('\nWelcome to Bamazon! The console everything store. What would you like to buy today?'.magenta.bold)
  inquirer.prompt([
    {
      type: 'input',
      name: 'selection',
      message: 'Please enter the ID of the item you would like to order:'.magenta.bold
    }
  ]).then(function(item) {
    var query = connection.query('SELECT * FROM products WHERE item_id=?', [item.selection], function(err,res) {
      if (err || res.length == 0) orderError()
      else {
        inquirer.prompt([
          {
            type: 'input',
            name: 'quantity',
            message: 'Please enter a quantity of '.magenta.bold + colors.cyan.bold(res[0].product_name) + ' that you would like to order:'.magenta.bold
          }
        //Check if the item is available in the quantity selected
        ]).then(function(item) {
          if (item.quantity > parseInt(res[0].stock_quantity)) {
            console.log('\nWe are sorry. There are not enough '.magenta.bold + colors.cyan.bold(res[0].product_name) + 's'.cyan.bold + ' currently in stock to satisfy your order.'.magenta.bold)
            orderAgain()
          }//If so, complete the order
          else {
            orderItem = res
            orderQuant = item.quantity
            completeOrder()
          }
        })
      }
    })
  })
}
//If the item is not valid, let the user know and restart the process
function orderError() {
  console.log('\nWe are sorry. That item is not in our inventory.\nPlease choose another item. Thank you!'.magenta.bold)
  runSearch()
}
//If the order was valid, complete it
function completeOrder() {
  let newQuant = orderItem[0].stock_quantity - orderQuant
  let orderTotal = orderQuant * orderItem[0].price
  let newSales = orderItem[0].product_sales + orderTotal
  let table = new Table({
    head: ['Item'.bold, {hAlign: 'center', content: 'Quantity'.bold}, {hAlign: 'right', content: 'Price'.bold}],
    colWidths: [40,10,10]
  })
  table.push([orderItem[0].product_name, {hAlign: 'right', content: orderQuant}, {hAlign:'right', content :'$'+parseFloat(orderItem[0].price).toFixed(2)}])
  table.push(['TOTAL ORDER', '', {hAlign:'right', content :'$'+parseFloat(orderTotal).toFixed(2)}])
  console.log(table.toString())
  console.log('Your order has been completed!\nThank you for helping Bamazon take over the world today!')
  //Update the database by removing the item from the stock_quantity in the quantity of the order and adding the sales amount to the product_sales amount
  connection.query(
    'UPDATE products SET ? WHERE ?',
    [
      {
        stock_quantity: newQuant,
        product_sales: newSales
      },
      {
        item_id: orderItem[0].item_id
      }
    ]
  )
  orderAgain()
}
//Ask the user if they want to order again or exit
function orderAgain() {
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Would you like to order again?'
    }
  ]).then(function(confirm) {
    if (confirm.confirm) {
      runSearch()
    }
    else {
      console.log('Thank you for shopping with us!')
      connection.end()
    }
  })
}
