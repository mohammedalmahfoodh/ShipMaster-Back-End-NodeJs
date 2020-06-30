var stayAwake = require('stay-awake');
const initiateDB = require('./initiateDB');
const mySqlConnection = require("./dataBaseConnection");
stayAwake.prevent(function (err, data) {

    bodyParser = require('body-parser');
    let level_webSockets = require('./level_master_webSocket');
    let valves_webSockets = require('./valves_websocket');
    let pumps_webSockets = require('./pumpsWebsocket');
    const express = require('express');
    const routes = require('./api')
    var cors = require('cors');
    const port = 3003;
    const app = express();
    app.use(bodyParser.json());
    app.use(cors());
    var prompt = require('prompt');
    
    function readFromUser() {
        console.log('If something went wrong exit.');
     prompt.start();
             prompt.get(['exit'], function (err, result) {
               
               if (result.Exist==='exit') {
                 console.log('You exit............')
                 process.exit(0);
               }
               
             });
   }
   readFromUser();
    // Check if mysql DB is exists
    initiateDB.connect(function (err) {
        if (err) {
            console.error("Please install mysql and restart the server...")


        } else {

            console.log("Connected to mysql successfully.");
            initiateDB.query(`SHOW DATABASES LIKE 'ship_master';`, function (err, result) {
                if (err) throw err;
                if (result.length == 0) {

                    console.log("Install database ship_master and restart the app.");
                    initiateDB.destroy();
                } else {
                    console.log('Database ship_master exists in mysql..')
                    let dataInAlarmsDB = false;
                    mySqlConnection.query("SELECT * FROM alarms", function (err, result, fields) {
                      if (err) throw err;
                      dataInAlarmsDB = result.length > 0 ? true : false;
                      if (dataInAlarmsDB) {
                        const sqlUpdate = `UPDATE alarms SET archive =1 , alarm_active = 0 ,blue_alarm=0 ,alarm_description ='Archived Alarm'
                          WHERE ( (alarm_active = 1 || blue_alarm = 1));`;
                        mySqlConnection.query(sqlUpdate, function (err, result) {
                          if (err) throw err;
                          
                            const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name =null ;`;
                            mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                              if (err) throw err;
                              level_webSockets.initializingTanksTable();

                              setTimeout(() => {
                                valves_webSockets.initializingValves();
                            }, 7000);
        
                            setTimeout(() => {
                             pumps_webSockets.initializingPumps();
                            }, 15000);
        
                            setTimeout(() => {
                               app.use('/api', routes);
                                app.listen(port, (() => {
                                    console.log(`listening for requests.......... on port${port}`)
                                }));
                            }, 20000);
        
                            initiateDB.destroy();

                            });
                          
                        });
                      }else{ // If no data exist in db tables .
                       level_webSockets.initializingTanksTable();
                        setTimeout(() => {
                            valves_webSockets.initializingValves();
                        }, 7000);
    
                        setTimeout(() => {
                          pumps_webSockets.initializingPumps();
                        }, 15000);
    
                        setTimeout(() => {
                           app.use('/api', routes);
                            app.listen(port, (() => {
                                console.log(`listening for requests.......... on port${port}`)
                            }));
                        }, 20000);
    
                        initiateDB.destroy();

                      }
                  
                    });

                   
                   
                    
                }
            });
        };
    });//initDB.connect(function (err)

});//stayAwake