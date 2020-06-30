const WebSocket = require('ws')
const moment = require('moment');
let pumpsMapData = new Map() // Containes all valves data ..
const mySqlConnection = require("./dataBaseConnection");
let  dataInPumpsDB = false; // Variable for tracking the state of pumps table database checking every time the application runs...
let pumpsMapDescription = new Map();
let firstTimeRun = true; // Variable for finding out whether the websocket received data before or not...

function initializingPumps(){ 
    
     
      // Check if there are data exist in pumps table in DB
       mySqlConnection.query("SELECT * FROM pumps", function (err, result, fields) {
        if (err) throw err;
        dataInPumpsDB = result.length > 0 ? true : false;     
       if (dataInPumpsDB) {
       
       result.forEach(row=>{

        let pumpObject ={};
        // console.log(row)
          pumpObject['pump_id'] = row.pump_id;
         //  console.log(tankObject['tank_id'])
          pumpObject['errorTimeout'] = row.errorTimeout;  
               //   console.log(tankObject['code_name'])
          pumpObject['alarm_date'] = null;
          pumpObject['time_accepted'] = null;
          pumpObject['time_retrieved'] = null;
          pumpObject['archive'] = 0;
          pumpObject['alarm_description'] = null;
          pumpObject['pump_status'] = 0;
          pumpObject['acknowledged'] = 0;
          pumpObject['blue_alarm'] = 0;
          pumpObject['alarm_name']=null;
          pumpObject['alarm_active'] = 0;
          pumpObject['inserted'] = false; 
          pumpObject['updateBlue'] = true;
          pumpObject['updateRed'] = true;

          pumpsMapData.set(row.pump_id,pumpObject);

       });             
       
       }
      });    
  

  setTimeout(() => {
    if (!dataInPumpsDB) {
      console.log('No data in pumps table');
     // let pumpSetUpDataSocket = new WebSocket('ws://192.168.190.232:8089');
      let pumpSetUpDataSocket = new WebSocket('ws://127.0.0.1:8089')
       pumpSetUpDataSocket.on('open', function open() {
        console.log('Connect pumps set up data websocket...........')
        const msg = { "getSmAllPumpsSetupData": { "vessel": 1 } };

        pumpSetUpDataSocket.send(JSON.stringify(msg));   

      });

      pumpSetUpDataSocket.on('message', (data)=> {
        const received_msg = data;   
         let pumpSetUpDataS = JSON.parse(received_msg);   
         pumpSetUpDataS = pumpSetUpDataS.setSmAllPumpsSetupData
         // console.log(pumpSetUpDataS)
         if (typeof pumpSetUpDataS === "array" || pumpSetUpDataS instanceof Array) {
          
           let arrayOfPumps = [];
           pumpSetUpDataS.forEach(pumpData => {
            let pumpObject ={};
              let pumpDataArrayAtt;
           //   console.log(valveData)
             pumpDataArrayAtt = Array.of(pumpData.id, pumpData.type, pumpData.subType, pumpData.errorTimeout);
             if (pumpData.id !==0) {
              arrayOfPumps.push(pumpDataArrayAtt);  
              pumpObject['pump_id'] = pumpData.id;             
              pumpObject['errorTimeout'] = pumpData.errorTimeout;               
              pumpObject['alarm_date'] = null;
              pumpObject['time_accepted'] = null;
              pumpObject['time_retrieved'] = null;
              pumpObject['alarm_active'] = 0;
               pumpObject['alarm_description'] = null;
               pumpObject['valve_status'] = 0;
               pumpObject['acknowledged'] = 0;
               pumpObject['blue_alarm'] = 0;
               pumpObject['alarm_name'] = null;
               pumpObject['archive'] = 0;
               pumpObject['inserted'] = false;
               pumpObject['updateBlue'] = true;
               pumpObject['updateRed'] = true;
               pumpsMapData.set(pumpData.id, pumpObject);
             }

           });  // Iteration of pump setup list
    
         
         const sql = "INSERT INTO pumps (pump_id,pump_type,pump_subType,errorTimeout) VALUES ?";
          mySqlConnection.query(sql, [arrayOfPumps] , function (err, result) {
              if (err) throw err;
              console.log("Number of pumps inserted: " + result.affectedRows);
             }); 
        
        }
      }); // Ends of on message..

      pumpSetUpDataSocket.onerror = function (evt) {
        console.log('websocket closed.....')
        pumpSetUpDataSocket = null;
        initializingPumps();
      }
     
      pumpSetUpDataSocket.on('close', function () {
        pumpSetUpDataSocket = null;
        console.log('Pump set up data websocket disconnected...................');        
      });      
       setTimeout(() => {
        pumpSetUpDataSocket.close();  
        startPumpsStatus();
       }, 2000);
          

    }else{
      startPumpsStatus();
    }// Ends if data in pumpDB   

  }, 1500);// ends of getting pumps setup    
    
  }
  //*********************************** End Of initializing pumps *************************** */
  
  function startPumpsStatus() {
    //console.log(pumpsMapData);
        
        let dataInPumpsDB = false;
        

         let dumyWebSocket = new WebSocket("ws://127.0.0.1:8089");
    // let dumyWebSocket = new WebSocket('ws://192.168.190.232:8089')
    
      dumyWebSocket.on('open', function open() {
     
        console.log('Connect pumps runtime data websocket...........')
        const msg = { "setSmPumpSubscriptionOn": { "id": 0 } };       
        dumyWebSocket.send(JSON.stringify(msg));   // Subscribe to pump runtime data..
      
      //  dumyWebSocket.send('setSmPumpSubscriptionOn');
      
        
      });
    
      dumyWebSocket.onerror = function (evt) {
        console.log('Pumps live data Websocket disconnected connect to websocket ...')
        dumyWebSocket = null;
        
      }
    
      dumyWebSocket.on('close', function () {
        dumyWebSocket = null;
        console.log('Pumps live data Websocket closed connect to websocket again .........');
        startPumpsStatus();
    });
    
      dumyWebSocket.on('message', (data) => {
        let currentStatusList = [];  
       // console.log(firstTimeRun);
        const received_msg = data;
        let pumpRunTimeData = JSON.parse(received_msg);
       // console.log(pumpRunTimeData);

        pumpRunTimeData = pumpRunTimeData.setSmPumpSubscriptionData
        if (typeof pumpRunTimeData === "array" || pumpRunTimeData instanceof Array) {
         //   console.log(pumpRunTimeData);       
          pumpRunTimeData.forEach(pump => {
            let pumpObject = {};
            pumpObject = pumpsMapData.get(pump.id);
            let pumpId = pump.id;
            let pumpStatus = pump.status;
            let statusDescription = null;            
            //Create status description from status values of pump live data websocket
            switch (pump.status) {
              case 1:
                statusDescription = 'Running';

                // console.log(statusDescription)
                break;
              case 2:
                statusDescription = 'Ramping up';
                //  console.log(statusDescription)

                break;
              case 4:
                statusDescription = 'Ramping down';
                //  console.log(statusDescription)
                break;
              case 8:
               // statusDescription = 'Timeout';
                // console.log(statusDescription)
                break;
              case 16:
               // statusDescription = 'Error, Time out is: ' + pumpObject['errorTimeout'] + ' Seconds';

                //  console.log(statusDescription)
                break;

              case 32:
                  statusDescription = 'Manual mode, Pump is controled by somebody eles';
                  // console.log(statusDescription)
                  break;
                case 33:
                  statusDescription = 'pump is running but is controled by somebody';
                  // console.log(statusDescription)
                  break;
                case 34:
                  statusDescription = 'pump is ranping up but is controled by somebody';
                  //   console.log(statusDescription)
                  break;
                case 36:
                  statusDescription = 'pump is ranping down but is controled by somebody';
                  //   console.log(statusDescription)
                  break;
                case 40:
                  statusDescription = 'Timeout but is controled by somebody';
                  //   console.log(statusDescription)
                  break;
                case 48:
                  statusDescription = 'Error but is controled by somebody';
                  //   console.log(statusDescription)
                  break;
    
                default:
                  statusDescription = 'No status'
    
              }     
              if (statusDescription!==null) {
                pumpsMapDescription.set(pumpId,statusDescription);
              }
             
             if (pumpObject!==undefined) {               
             
              pumpObject['pump_status'] = pumpStatus;
              pumpObject['alarm_description'] = statusDescription;
            //  console.log(pumpsMapDescription);
            // console.log(statusDescription)
            if (pumpStatus===16 ||pumpStatus===8 ) {         
             // console.log(pumpObject)
             pumpObject['alarm_description']=null;    
             if (firstTimeRun) {
              pumpObject['alarm_description']='Active unaccepted error during running';
              pumpObject['alarm_name'] = 'Pump ' + pumpId + ' error Running';
             }else{
              // console.log("not first time")
               if (pumpsMapDescription.get(pumpId)!==undefined) {
                pumpObject['alarm_description'] ='Active unaccepted '+pumpsMapDescription.get(pumpId)+' '+pumpObject.errorTimeout+' seconds';
                pumpObject['alarm_name'] = 'Pump ' + pumpId + ' Timeout '+pumpsMapDescription.get(pumpId);
               }else{
                pumpObject['alarm_description']='Active unaccepted error during running';
               }
              
             } 
             
            //  pumpObject['alarm_name'] = 'Pump ' + pumpId + ' error';
              if (pumpObject['alarm_date'] === undefined || pumpObject['alarm_date'] === null) {
                let alarm_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                pumpObject['alarm_date'] = alarm_date;
                }
                pumpObject['time_retrieved'] = null;
                pumpObject['alarm_active'] = 1;
               // pumpObject['pump_status'] = 16;
               
               // pumpObject['alarm_name'] = 'Pump ' + pumpId + ' error';
                pumpObject['archive'] = 0;
                // valveObject['blue_alarm'] = 0;
                pumpsMapData.set(pumpId, pumpObject);
               //  console.log(pumpObject);
              }  // If (pump.status===16 ||pump.status===48 )   
           //  console.log(pumpObject);
              currentStatusList.push(pumpObject);
            }  // if (pumpObject!==undefined)
          }); // Ends for each valve runtime data
         // console.log(pumpsMapData.get(1));
         currentStatusList.forEach(pumpError=>{
            //   console.log(pumpError);
             
          });           
         
          // Save alarms for first run...
          if (typeof firstTimeRun === "boolean") {
    
            if (firstTimeRun) {
             // console.log('first Time..')
              let pumpObject ={};          
              //Convert array of objects into array of arrays to save in db            
              let toInsertAlarms = [];
            // Initializing database (pumps_statues) table this code runs when the program starts .
              currentStatusList.forEach(pumpRunTimeData => {
             //  console.log(pumpRunTimeData)
                if (pumpRunTimeData['alarm_active'] === 1) {             
                  pumpObject =pumpsMapData.get(pumpRunTimeData.pump_id);
                  pumpObject['inserted'] = true; 
                  pumpsMapData.set(pumpRunTimeData.pump_id,pumpObject);
                 // console.log(pumpObject)                
                  toInsertAlarms.push(pumpObject)
                }
    
              });
              
              if (toInsertAlarms.length>0) {
                savePumpStatusDB(toInsertAlarms);
              }        
    
            }else{
              let toInsertAlarms = [];
            //  console.log("Not first time...")
              currentStatusList.forEach(pumpError=>{
                // Insert the alarm if it is not inserted..
                let pumpObject = {};
                pumpObject = pumpsMapData.get(pumpError.pump_id);
                if (pumpObject['inserted'] === false && pumpObject.alarm_active === 1) {
                  toInsertAlarms.push(pumpObject)
                }
                // Alarm becomes archive
                if ((pumpObject['pump_status'] !== 16 && pumpObject['pump_status']!== 8) && pumpObject.acknowledged === 1) {
                  if (pumpObject['time_retrieved'] === undefined || pumpObject['time_retrieved'] === null) {
                    let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                    pumpObject['time_retrieved'] = time_retrieved;
                  }
                  
                  pumpObject['archive'] = 0;
                  pumpObject['inserted'] = false;
                  pumpObject['alarm_active'] = 0;
                  pumpObject['blue_alarm'] = 0;      
                  pumpObject.acknowledged = 0;    
                  pumpObject['time_accepted'] = null;
                  pumpObject['alarm_description'] = null;
                  
                  pumpObject['alarm_date'] = null;
                  pumpObject['updateRed'] = true;
                  pumpObject['alarm_name'] = null;                
    
    
                  const sqlUpdate = `UPDATE alarms SET alarm_description = 'Archived Alarm' ,blue_alarm = 0, time_retrieved ='${pumpObject['time_retrieved']}',alarm_active =0,archive=1,pump_status='${pumpObject.pump_status}'
                  WHERE (pump_id='${pumpObject.pump_id}' && (alarm_active = 1 || blue_alarm = 1));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
    
                  });
                //  console.log(pumpObject)
                  pumpObject['time_retrieved'] = null;
                  pumpObject['pump_status'] = pumpError.pump_status;
                  pumpsMapData.set(pumpError.pump_id, pumpObject);
                }
                //Blue Alarm
                if ((pumpObject.pump_status !==16 && pumpObject.pump_status !==8) && (pumpObject.acknowledged===0 && pumpObject.updateBlue===true && pumpObject.alarm_active===1 ) ) {
                if (pumpObject.inserted === true ) {              
                    pumpObject['alarm_active'] = 0;
                    pumpObject.updateBlue = false;
                    let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                    pumpObject.alarm_active = 0
                    pumpObject['blue_alarm'] = 1;
                    pumpObject['time_retrieved'] = time_retrieved;
                    pumpObject['updateRed'] = true;
                    pumpsMapData.set(pumpError.pump_id, pumpObject);
                    const sqlUpdate = `UPDATE alarms SET alarm_description = 'Inactive unaccepted' ,blue_alarm = 1, time_retrieved ='${time_retrieved}',alarm_name ='${pumpObject.alarm_name}',alarm_date ='${pumpObject.alarm_date}',alarm_active =0,time_accepted=null,acknowledged=0
                    WHERE (pump_id='${pumpObject.pump_id}' &&  (archive = 0) );`;
                    mySqlConnection.query(sqlUpdate, function (err, result) {
                      if (err) throw err;
                     
                    });
                    console.log('Alarm is now Blue Alarm')
                  }
                }
                //Error trigerred again and it is already inserted.
                if (pumpObject.inserted === true && pumpObject.alarm_active===1 && pumpObject['updateRed'] === true && pumpObject['acknowledged']===0) {
                  let alarm_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                  pumpObject['alarm_date'] = alarm_date;
                  pumpObject['blue_alarm'] = 0;
                  pumpObject['time_retrieved'] = null;
                  pumpObject['alarm_active'] = 1;
                  pumpObject['updateRed'] = false;
                  pumpObject.updateBlue=true;
                  pumpsMapData.set(pumpError.pump_id, pumpObject);
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${pumpObject.alarm_description}' ,blue_alarm = 0, time_retrieved =null,alarm_name ='${pumpObject.alarm_name}',alarm_date ='${alarm_date}',alarm_active =1,time_accepted=null,acknowledged=0
                  WHERE (pump_id='${pumpObject.pump_id}' &&  (archive = 0) );`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                   
                  });
                  console.log('Alarm again...')
                 }
    
    
    
              }); // currentStatusList.forEach(pumpError        
              if (toInsertAlarms.length > 0) {
                savePumpStatusDB(toInsertAlarms);
              }
            } // Ends if not not first time
    
          }   // Ends of if  typeof firstTimeRun === "boolean" 
          
       
        
        } // If (typeof valveRunTimeData === "array" || valveRunTimeData instanceof Array)       
        
      }); // Ends on message  
     
       
    }// function startPumpsStatus()

    function savePumpStatusDB(alarms) {
      let arrayOfAlarms = [];  
      let pumpObject ={};      
      alarms.forEach(pumpRunTimeData=>{
        pumpObject =pumpsMapData.get(pumpRunTimeData.pump_id);
        pumpObject['inserted'] = true; 
        pumpsMapData.set(pumpObject['pump_id'],pumpObject);
        let alarmDataArray;
        alarmDataArray = Array.of(pumpRunTimeData.pump_id, pumpRunTimeData.pump_status,pumpRunTimeData['acknowledged'],pumpRunTimeData['alarm_date'],pumpRunTimeData['alarm_description'],pumpRunTimeData.alarm_name);
        
        arrayOfAlarms.push(alarmDataArray);
      });
      mySqlConnection.query('INSERT INTO alarms (pump_id,pump_status,acknowledged,alarm_date,alarm_description,alarm_name) VALUES ?', [arrayOfAlarms],
      function (err, result) {
        if (err) throw err;
        console.log("Number of pumpmps alarms inserted: " + result.affectedRows);
        firstTimeRun = false;
       
      });     
    }
    function makePumpAlarmAcknowledged (pump_id) { 
      let pumpObject ={};
      let time_accepted = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      pumpObject = pumpsMapData.get(pump_id);
      pumpObject.alarm_description ='Alarm accepted.';
      pumpObject.time_accepted = time_accepted;
      pumpObject.acknowledged=1;
      pumpsMapData.set(pump_id, pumpObject);
      const sqlUpdate = `UPDATE alarms SET alarm_description = 'Active accepted.' , time_retrieved =null,alarm_name ='${pumpObject.alarm_name}',time_accepted='${time_accepted}',acknowledged=1
                  WHERE (pump_id='${pumpObject.pump_id}' &&  (archive = 0) );`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                   
                  });
      //console.log(valveObject);
     }






  module.exports = {initializingPumps:initializingPumps,startPumpsStatus:startPumpsStatus,makePumpAlarmAcknowledged:makePumpAlarmAcknowledged }