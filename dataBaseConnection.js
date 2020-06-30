const mysql = require('mysql');


let pool = mysql.createPool({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'tyfon',
    database : 'ship_master',
    port     : 3306,    
    multipleStatements:true
});

module.exports = {
    query: function(){
        let sql_args = [];
        let args = [];
        for(let i=0; i<arguments.length; i++){
            args.push(arguments[i]);
        }
        let callback = args[args.length-1]; 
        pool.getConnection(function(err, connection) {
        if(err) {
                console.log(err);
                return callback(err);
            }
            if(args.length > 2){
                sql_args = args[1];
            }
        connection.query(args[0], sql_args, function(err, results) {
          connection.release(); 
          if(err){
                    console.log(err);
                    return callback(err);
                }
          callback(null, results);
        });
      });
    }
};