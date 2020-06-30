const mysql = require('mysql');

const con =  mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "tyfon",    
    multipleStatements:true
  });  
 


module.exports = con;