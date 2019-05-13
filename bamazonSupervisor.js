let mysql = require('mysql')
let inquirer = require('inquirer')
let Table = require('cli-table2')
let colors = require('colors')

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: ""
});
connection.connect(function(err) {
  if (err) throw err
  runMenu()
})
//Initial user menu
function runMenu(){
  console.log('\nWelcome to the Bamazon Supervisor console.'.cyan.bold)
  inquirer.prompt([
    {
      type: 'list',
      message: 'What would you like to do today?'.magenta.bold,
      choices: ['View Product Sales by Department'.cyan.bold, 'Create New Department'.cyan.bold, 'Exit'.cyan.bold],
      name: 'choice'
    }
  ]).then(function(selection) {
    switch (selection.choice) {
      case 'View Product Sales by Department'.cyan.bold:
      getTable()
      break
    case 'Create New Department'.cyan.bold:
      addDepartment()
      break
    case 'Exit'.cyan.bold:
      connection.end()
    }
  })
  }
//If user selects View product sales by department, this function creates a table that shows -- from the departments table: in order by department id,
//the name of the department, the overhead cost and from the products table: the sum of total product sales from each department and a dynamically
//created column that maths the profit or loss from each category. Not to geek out too much, but I actually really loved figuring this query out.
//It was definitely my favorite part of this homework!
  function getTable() {
    console.log('\n')
    var query = 'SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.product_sales) FROM departments INNER JOIN products ON departments.department_name=products.department_name GROUP BY departments.department_id ORDER BY departments.department_id ASC'
    connection.query(query, function(err, res) {
      let table = new Table({
        head: ['Department ID'.bold, 'Department'.bold, {hAlign: 'center', content: 'Overhead Cost'.bold}, {hAlign: 'center', content: 'Product Sales'.bold}, {hAlign: 'center', content: 'Total Profit/-Loss'.bold}],
        colWidths: [15,15,15,15,20]
      })
      for (var i = 0; i < res.length; i++) {
        table.push([{hAlign: 'center', content: colors.cyan.bold(res[i].department_id)}, res[i].department_name, {hAlign: 'right', content: '$'+parseFloat(res[i].over_head_costs).toFixed(2)},{hAlign:'right', content :'$'+parseFloat(res[i]['SUM(products.product_sales)']).toFixed(2)}, {hAlign: 'right', content: '$'+ parseFloat(parseInt(res[i]['SUM(products.product_sales)'])-parseInt(res[i].over_head_costs)).toFixed(2)}])
      }
      console.log(table.toString())
      runMenu()
    })
  }
//Allows the supervisor to add a new dpartment. Checks to see if that department already exists by seeing if an error is not thrown.
//No error being thrown is actually the error here. Otherwise, it adds the department and lets them know it was successful.
function addDepartment() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'newDept',
      message: 'Please enter the name of the new department you are creating.'.magenta.bold
    }
  ]).then(function(addDept) {
    let newDept = addDept.newDept
    console.log(newDept)
    var query = connection.query('SELECT * FROM departments WHERE department_name =' + '"' + newDept + '"', function(err,res){
      if (err || res.length == 0) {
        var sql = 'INSERT INTO departments (department_name, over_head_costs) VALUES ("' + newDept + '", ' + 0 + ')'
    connection.query(sql, (err, results, fields) => {
      if (err) throw err
      console.log('\nDepartment addition successful! ' + newDept + ' added.')
      runMenu()
    })
      }
      else {
        console.log('\nEither '.red.bold + newDept.cyan.bold + ' already exists or it is an invalid department name.\nPlease try again. Thank you!\n'.red.bold)
        runMenu()
      }
    })
  })
}
