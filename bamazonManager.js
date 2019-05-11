let mysql = require('mysql')
let inquirer = require('inquirer')
let Table = require('cli-table2')
let colors = require('colors')
let orderItem = []
let orderQuant = 0
let finder = ''
let searchMax = 0
let rsPname = ''
let rsId = ''
let rsDepartment = ''
let rsQuant = 0
let rsUnit = 0
let addDept = ''
let addPrice = 0
let addQuant = 0
let wholeCost = 0
let departmentList = []

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "androosk",
  password: "1234",
  database: "bamazon_DB"
});
connection.connect(function(err) {
  if (err) throw err
})

function runMenu(){
  console.log('\nWelcome to the Bamazon manager console.'.cyan.bold)
  inquirer.prompt([
    {
      type: 'list',
      message: 'What would you like to do today?'.green.bold,
      choices: ['View Products for Sale'.cyan.bold, 'View Low Inventory'.cyan.bold, 'Add to Inventory'.cyan.bold, 'Add New Product'.cyan.bold, 'Exit'.cyan.bold],
      name: 'choice'
    }
  ]).then(function(selection) {
    switch (selection.choice) {
      case 'View Products for Sale'.cyan.bold:
      searchMax = 100000
      getTable()
      break
    case 'View Low Inventory'.cyan.bold:
      searchMax = 5
      getTable()
      break
    case 'Add to Inventory'.cyan.bold:
      addInventory()
      break
    case 'Add New Product'.cyan.bold:
      addNewProduct()
      break
    case 'Exit'.cyan.bold:
      connection.end()
    }
  })
  }
//TODO Sort items by department and item name
  function getTable() {
    console.log('\n')
    var query = "SELECT * FROM products";
    connection.query(query, function(err, res) {
      let table = new Table({
        head: ['ID'.bold, 'Item Description'.bold, {hAlign: 'center', content: 'Department'.bold}, {hAlign: 'center', content: 'Price'.bold}, 'In Stock'.bold],
        colWidths: [5,40,20,10,10]
      })
      for (var i = 0; i < res.length; i++) {
        if (res[i].stock_quantity <= searchMax) {
          table.push([colors.cyan.bold(res[i].item_id), res[i].product_name, res[i].department_name,{hAlign:'right', content :'$'+parseFloat(res[i].price).toFixed(2)}, {hAlign: 'right', content: res[i].stock_quantity}])
        }
      }
      console.log(table.toString())
      runMenu()
    })
  }

function addInventory() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'idNum',
      message: 'Please select the stock number of the item you would like to restock.'
    }
  ]).then(function(id_number) {
    rsId = id_number.idNum
    var query = connection.query('SELECT * FROM products WHERE item_id=?', [rsId], function(err,res){
      if (err || res.length == 0) stockError()
      else {
        rsQuant = res[0].stock_quantity
        rsPname = res[0].product_name
        rsDepartment = res[0].department_name
        rsUnit = res[0].unit_cost
        getQuantity()
      }
    })
  })
}
//Chaining inquirer callbacks throws a console error. Since we have to evaluate whether the user
//has entered a valid replenishment query before requesting a quantity, I separated the functions
function getQuantity() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'quantity',
      message: 'Please enter the quantity of ' + rsPname + ' that you would like to restock:'
    }
  ]).then(function(item) {
    newQuant = parseInt(item.quantity) + parseInt(rsQuant)
    wholeCost = rsUnit * item.quantity
    console.log(wholeCost)
    console.log(rsDepartment)
    connection.query(
      'UPDATE products SET ? WHERE ?',
      [
        {
          stock_quantity: newQuant
        },
        {
          item_id: rsId
        }
      ],
      'UPDATE departments SET ? WHERE ?',
      [
        {
          over_head_costs: (wholeCost + over_head_costs)
        },
        {
          department_name: rsDepartment
        }
      ]
    )
    finder = 'item_id'
    viewOneItem()
  })
}
//Again, I was having issues with ansynchronous callbacks on multiple questions, so I separated them to make them synchronous.
//Is this the most performant solution at scale? No. But at this level, it works perfectly fine.
function addNewProduct() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'product',
      message: 'Please enter the product name: ',
      validate: function(value) {
        if (value) {
          return true
        }
        return 'PLEASE ENTER A VALID ITEM'
      }
    }
  ]).then(function(product) {
    rsId = product.product
    addNewDepartment()
  })
}
//Dynamically creates the department list from the Supervisor Department database
function addNewDepartment() {
  var query = "SELECT * FROM departments"
  connection.query(query, function(err, res) {
    for (var i = 0; i < res.length; i++) {
      departmentList.push(res[i].department_name)
    }
    inquirer.prompt([
      {
        name: 'department',
        type: 'rawlist',
        message: 'Please enter the product department: ',
        choices: departmentList
      }
    ]).then(function(department) {
      addDept = department.department
      addNewPrice()
    })
  })
}
function addNewPrice() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'price',
      message: 'Please enter the retail price with no dollar sign: ',
      validate: function(value) {
        var pass = value.match(
          /^[.0-9]{1,100}$/
        )
        if (pass) {
          return true
        }
        return 'PLEASE ENTER A VALID PRICE'
      }
    }
  ]).then(function(price) {
    addPrice = price.price
    addNewQuantity()
  })
}
//TODO Add inquirer prompt for the wholesale unit cost
function addNewQuantity() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'stock',
      message: 'Please enter the amount of units on hand: ',
      validate: function(value) {
        var pass = value.match(
          /^[0-9]{1,100}$/
        )
        if (pass) {
          return true
        }
        return 'PLEASE ENTER A VALID NUMBER'
      }
    }
  ]).then(function(quantity) {
    addQuant = quantity.stock
    addToTable()
  })
}
//TODO Add computation and insertion of wholesale purchase cost into database
function addToTable() {
    var sql = 'INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES ("' + rsId + '","' + addDept + '",' + parseFloat(addPrice).toFixed(2) + ',' + addQuant + ')'
    connection.query(sql, (err, results, fields) => {
      if (err) stockError()
      console.log('\nInventory addition successful! ' + rsId + ' added.')
      finder = 'product_name'
      viewOneItem()
    })
}

function stockError() {
  console.log('\nWe are sorry. That item is not in the Bamazon system.\nPlease choose another item to replenish. Thank you!'.magenta.bold)
  runMenu()
}
function viewOneItem() {
  console.log('\n')
    var query = 'SELECT * FROM products WHERE ' + finder + ' = ' + '"' + rsId +'"'
    connection.query(query, function(err, res) {
      let table = new Table({
        head: ['ID'.bold, 'Item Description'.bold, {hAlign: 'center', content: 'Department'.bold}, {hAlign: 'center', content: 'Price'.bold}, 'In Stock'.bold],
        colWidths: [5,40,20,10,10]
      })
      for (var i = 0; i < res.length; i++) {
          table.push([colors.cyan.bold(res[i].item_id), res[i].product_name, res[i].department_name,{hAlign:'right', content :'$'+parseFloat(res[i].price).toFixed(2)}, {hAlign: 'right', content: res[i].stock_quantity}])
      }
      console.log(table.toString())
      runMenu()
    })
}
//Start with the opening menu
runMenu()
