const WebSocket = require('ws');
let valvesMapData = new Map() // Containes all valves data ..
const mySqlConnection = require("./dataBaseConnection");
const moment = require('moment');
let valvesMapDescription = new Map();
let calculateEvery2Sec = true;
let charAt0;
let  dataInValvesDB = false; // Variable for tracking the state of valves table database checking every time the application runs...
var valven = [];
valven[0]="BAV01";
valven[1]="BAV02";
valven[2]="BAV03";
valven[3]="BAV04";
valven[4]="BAV05";
valven[5]="BAV06";
valven[6]="BAV07";
valven[7]="BAV08";
valven[8]="BAV09";
valven[9]="BAV10";
valven[10]="BAV11";
valven[11]="BAV12";
valven[12]="BAV13";
valven[13]="BAV14";
valven[14]="BAV15";
valven[15]="BAV16";
valven[16]="BAV17";
valven[17]="BAV18";
valven[18]="IAV04";
valven[19]="IAV06";
valven[20]="IAV22";
valven[21]="IAV16";
valven[22]="IAV24";
valven[23]="IAV26";
valven[24]="IAV02";
valven[25]="IAV08";
valven[26]="IAV28";
valven[27]="IAV30";
valven[28]="IAV18";
valven[29]="IAV20";
valven[30]="IAV10";
valven[31]="IAV12";
valven[32]="IAV14";
valven[33]="FTV06";
valven[34]="FTV07";
valven[35]="FTV08";
valven[36]="FTV09";
valven[37]="FTV11";
valven[38]="FTV12";
valven[39]="FTV13";
valven[40]="MTV05";
valven[41]="MTV07";
valven[42]="BMV15";
valven[43]="BMV01";
valven[44]="BMV02";
valven[45]="BMV03";
valven[46]="BMV05";
valven[47]="BMV07";
valven[48]="BMV09";
valven[49]="BMV10";
valven[50]="BMV11";
valven[51]="BMV12";
valven[52]="BMV13";
valven[53]="BMV16";
valven[54]="WMV01";
valven[55]="WMV02";
valven[56]="CSV01";
valven[57]="CSV04";
valven[58]="BMV18";
valven[59]="BOW THRUSTER ROOM";
valven[60]="PIPE TUNNEL FWD";
valven[61]="PIPE TUNNEL MID";
valven[62]="PIPE TUNNEL AFT";
valven[63]="CAR DECK FWD PS";
valven[64]="CAR DECK FWD STB";
valven[65]="CAR DECK MID PS";
valven[66]="CAR DECK MID STB";
valven[67]="CAR DECK AFT PS";
valven[68]="CAR DECK AFT  STB";
valven[69]="CHAIN LOCKER";
valven[70]="BOSUN LOCKER";
valven[71]="FGSS";
valven[72]="LNG TANK SPACE PS";
valven[73]="LNG TANK SPACE STB";
valven[74]="E/R FWD PS";
valven[75]="E/R FWD STB";
valven[76]="BENEATH M/E";
valven[77]="AFT";
valven[78]="VOID";
valven[79]="STEERING ROOM PS";
valven[80]="STEERING ROOM STB";
valven[81]="LOCAL/REMOTE BAV18";
valven[82]="UPS BAV18";
valven[83]="WBTS";
valven[84]="COMMON ALARM";
valven[85]="CABINET TEMP";
valven[86]="24VDC ALARM";
valven[87]="220VAC ALARM";
valven[88]="ANTI HEELING ALARM";
valven[89]="UPS VRC ACTIVE";
valven[90]="BMV33";
valven[91]="BMV35";
valven[92]="CSV01 LOCAL";
valven[93]="CSV04 LOCAL";
valven[94]="";
valven[95]="";
valven[96]="";
valven[97]="PLC1";
valven[98]="PLC2";

function initializingValves(){ 
  let arrayOfValves = [];   

   
     
      // Check if there are data exist in valves table in DB
       mySqlConnection.query("SELECT * FROM valves", function (err, result, fields) {
        if (err) throw err;
      dataInValvesDB = result.length > 0 ? true : false;     
       if (dataInValvesDB) {
       
       result.forEach(row=>{
        
        let valveObject ={};
        // console.log(row)
          valveObject['valve_id'] = row.valve_id;
          valveObject['valve_name'] = valven[row.valve_id-1]
          valveObject['valve_type'] = row.valve_type;
          valveObject['subType'] = row.valve_subtype;
         //  console.log(tankObject['tank_id'])
          valveObject['errorTimeout'] = row.errorTimeout;  
               //   console.log(tankObject['code_name'])
          valveObject['alarm_date'] = null;
          valveObject['time_accepted'] = null;
          valveObject['time_retrieved'] = null;
          valveObject['archive'] = 0;
          valveObject['alarm_description'] = null;
          valveObject['valve_status'] = 0;
          valveObject['acknowledged'] = 0;
          valveObject['blue_alarm'] = 0;
          valveObject['alarm_name']=null;
          valveObject['alarm_active'] = 0;
          valveObject['inserted'] = false; 
          valveObject['updateBlue'] = true;
          valveObject['updateRed'] = true;

          valvesMapData.set(row.valve_id,valveObject);

       });             
       
       }
      });    
    

  setTimeout(() => {
    if (!dataInValvesDB) {
      console.log('No data in valves table');
      let valveSetUpDataSocket = new WebSocket('ws://127.0.0.1:8089')
     //   let valveSetUpDataSocket = new WebSocket('ws://192.168.190.232:8089')
      valveSetUpDataSocket.on('open', function open() {
        console.log('Connect valve set up data websocket...........')
        const msg = { "getSmAllValvesSetupData": { "vessel": 1 } };

        valveSetUpDataSocket.send(JSON.stringify(msg));

      });

      valveSetUpDataSocket.on('message', (data)=> {
        const received_msg = data;   
        let valveSetUpDataS = [];
          valveSetUpDataS = JSON.parse(received_msg);   
         valveSetUpDataS = valveSetUpDataS.setSmAllValvesSetupData
         // console.log(valveSetUpDataS)
         if (typeof valveSetUpDataS === "array" || valveSetUpDataS instanceof Array) {
          let counter = 1;
          let valvesSettingsLength  = valveSetUpDataS.length;
        //  console.log(valvesSettingsLength)
           valveSetUpDataS.forEach(valveData => {
            let valveObject ={};
            
              let valveDataArrayAtt;
           //   console.log(valveData)
            
             if (valveData.subType !==99) {
            
              valveDataArrayAtt = Array.of(valveData.id,valven[valveData.id-1], valveData.type, valveData.subType, valveData.errorTimeout);
              arrayOfValves.push(valveDataArrayAtt);  
              valveObject['valve_id'] = valveData.id;
              valveObject['valve_name'] = valven[valveData.id-1]
              valveObject['valve_type'] = valveData.type; 
              valveObject['subType'] = valveData.subType;  
              valveObject['errorTimeout'] = valveData.errorTimeout;               
              valveObject['alarm_date'] = null;
              valveObject['time_accepted'] = null;
              valveObject['time_retrieved'] = null;
              valveObject['alarm_active'] = 0;
               valveObject['alarm_description'] = null;
               valveObject['valve_status'] = 0;
               valveObject['acknowledged'] = 0;
               valveObject['blue_alarm'] = 0;
               valveObject['alarm_name'] = null;
               valveObject['archive'] = 0;
               valveObject['inserted'] = false;
               valveObject['updateBlue'] = true;
               valveObject['updateRed'] = true;
               valvesMapData.set(valveData.id, valveObject);
               
             //  console.log(counter)
               if ( counter === valvesSettingsLength-1) {
                // console.log(counter)
                valveSetUpDataSocket.close();
               }
              
             }
             counter = counter + 1;
           });  // Iteration of valve setup list
    
         
         const sql = "INSERT INTO valves (valve_id,valve_name,valve_type,valve_subType,errorTimeout) VALUES ?";
        // console.log(arrayOfValves);
          mySqlConnection.query(sql, [arrayOfValves] , function (err, result) {
              if (err) throw err;
              console.log("Number of records inserted: " + result.affectedRows);
             }); 
        
        }
      }); // Ends of on message..

      valveSetUpDataSocket.onerror = function (evt) {
        console.log('websocket closed.....')
        valveSetUpDataSocket = null;
        initializingValves();
      }
     
      valveSetUpDataSocket.on('close', function () {

        valveSetUpDataSocket = null;
        console.log('Valve set up data websocket disconnected...................'); 
       setTimeout(() => {
       //  console.log(notIncludedId)
       startValvesStatus();
       }, 2000);
      });     
      

    }else{
    
      startValvesStatus();
    }// Ends if data in valveDB   
    
  }, 3000);// ends of getting valves setup  
  
} // function initializingValves()
//*********************************** End Of initializing *************************** */

let firstTimeRun = true; // Variable for finding out whether the websocket received data before or not...

function startValvesStatus() {
  //console.log(valvesMapData);

   let valveStatusSocket = new WebSocket('ws://127.0.0.1:8089');
 // let valveStatusSocket = new WebSocket('ws://192.168.190.232:8089');

  valveStatusSocket.on('open', function open() {
    console.log('Connect valve websocket...........')
    const msg = { "setSmValveSubscriptionOn": { "id": 0 } };

    valveStatusSocket.send(JSON.stringify(msg));   // Subscribe to valve runtime data..

  });

  valveStatusSocket.onerror = function (evt) {
    console.log('Websocket disconnected connect to websocket ...')
    valveStatusSocket = null;

  }

  valveStatusSocket.on('close', function () {
    valveStatusSocket = null;
    console.log('Websocket closed connect to websocket again .........');
    startValvesStatus();
  });

  valveStatusSocket.on('message', (data) => { 
      
    
  //  console.log('Valves Server is running..')
    let currentStatusList = [];
    // console.log(firstTimeRun);
    const received_msg = data;
    let valveRunTimeData = JSON.parse(received_msg);
    valveRunTimeData = valveRunTimeData.setSmValveSubscriptionData
    if ((typeof valveRunTimeData === "array" || valveRunTimeData instanceof Array) ) {      //  console.log(valveRunTimeData)        

      valveRunTimeData.forEach(valve => {
         
        if (valvesMapData.has(valve.id)) {
          let valveObject = {};
          valveObject = valvesMapData.get(valve.id);
          let valveId = valve.id;
          let valve_name = valveObject['valve_name'];
          let valveStatus = valve.status;
          let valveBinaryString = valveStatus.toString(2);
          let statusDescription = null;
          let statusLength = valveBinaryString.length;
           charAt0 = (statusLength === 5) ? valveBinaryString.charAt(0) : null;
          if ((valveStatus>=16)) {
           // console.log('id:'+valve.id +' status: '+valveStatus)
          }
          //Create status description from status values of valve live data websocket
          switch (valve.status) {
            case 1:
              statusDescription = 'OPEND';

              // console.log(statusDescription)
              break;
            case 2:
              statusDescription = 'CLOSED';
              //  console.log(statusDescription)

              break;
            case 4:
              statusDescription = 'Moving to OPENED pos';

              //  console.log(statusDescription)
              break;
            case 8:
              statusDescription = 'Moving to CLOSED pos';

              // console.log(statusDescription)
              break;
            case 16:
              //  valveObject['alarm_description'] = null

              //  console.log(statusDescription)
              break;

            case 32:
              statusDescription = 'Manual mode, valve is controled by somebody eles';
              // console.log(statusDescription)
              break;
            case 33:
              statusDescription = 'Valve is open but is not controled by us';
              // console.log(statusDescription)
              break;
            case 34:
              statusDescription = 'Valve is closed but is not controled by us';
              //   console.log(statusDescription)
              break;
            case 36:
              statusDescription = 'Valve is moving to open position but is not controled by us';
              //   console.log(statusDescription)
              break;
            case 40:
              statusDescription = 'Valve is moving to open position but is not controled by us';
              //   console.log(statusDescription)
              break;
            case 48:
              statusDescription = 'Error but is not controled by us';
              //   console.log(statusDescription)
              break;

            default:
              statusDescription = 'No status'

          }
          if (statusDescription !== null) {
            valvesMapDescription.set(valve.id, statusDescription);
          }

          if (valveObject !== undefined) {

            valveObject['valve_status'] = valveStatus;

            
            if ((valveStatus>=16) || ((valveObject['subType']  === 100 && valveStatus === 1)) || ((valveObject.valve_type === 4 && valveStatus === 0))) {
            //  console.log('id:'+valve.id +' status: '+valveStatus)
              valveObject['alarm_description'] = null;
              if (firstTimeRun) {
                valveObject['alarm_description'] = 'Active unaccepted error during moving';
                valveObject['alarm_name'] = valve_name;
                if (valve.id === 98 || valve.id ===99) {
                  valveObject['alarm_name'] = "Offline plc";
                  valveObject['alarm_description'] = 'Offline plc';
                }
              } else {
                if (valvesMapDescription.get(valve.id) !== undefined && valveObject.subType !== 100) {
                  valveObject['alarm_description'] = 'Active unaccepted ' + valvesMapDescription.get(valve.id) + ' ' + valveObject.errorTimeout + ' seconds';
                  valveObject['alarm_name'] = valve_name + valvesMapDescription.get(valve.id);
                  if (valve.id === 98 || valve.id ===99) {
                    valveObject['alarm_name'] = "Offline plc";
                    valveObject['alarm_description'] = 'Offline plc';
                  }
                } else {
                  valveObject['alarm_description'] = 'Active unaccepted during moving';
                  if (valve.id === 98 || valve.id ===99) {
                    valveObject['alarm_name'] = "Offline plc";
                    valveObject['alarm_description'] = 'Offline plc';
                  }
                }

              }
              // console.log(valveObject)         

              if (valveObject['alarm_date'] === undefined || valveObject['alarm_date'] === null) {
                let alarm_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                valveObject['alarm_date'] = alarm_date;
              }
              valveObject['time_retrieved'] = null;
              valveObject['alarm_active'] = 1;
              valveObject['valve_status'] = valve.status;

              valveObject['alarm_name'] = valve_name;
              valveObject['archive'] = 0;
              if (valveObject.valve_type === 4 && valve.status === 0) {
                valveObject['alarm_description'] = 'Active unaccepted error';
                valveObject['alarm_name'] = valve_name;
                valveObject['valve_status'] = 0;
                // console.log(valveObject);
              }
              // valveObject['blue_alarm'] = 0;
              valvesMapData.set(valveId, valveObject);

            }  // If (valve.status===16 ||valve.status===48 )   
            if (valveObject.valve_id <= 99) {
              currentStatusList.push(valveObject);
            }
          }
          
          valvesMapData.set(valveId, valveObject);

        }

      }); // Ends for each valve runtime data

     // console.log(valvesMapData.get(1));              

      // Save alarms for first run...
      if (typeof firstTimeRun === "boolean") {

        if (firstTimeRun) {
         // console.log('first Time..')
          let valveObject ={};          
          //Convert array of objects into array of arrays to save in db            
          let toInsertAlarms = [];
        // Initializing database (valve_statues) table this code runs when the program starts .
          currentStatusList.forEach(valveRunTimeData => {
         //  console.log(valveRunTimeData)
            if (valveRunTimeData['alarm_active'] === 1) {             
              valveObject =valvesMapData.get(valveRunTimeData.valve_id);
              valveObject['inserted'] = true; 
              valvesMapData.set(valveRunTimeData.valve_id,valveObject);
             // console.log(valveObject)
            
              toInsertAlarms.push(valveObject)
            }

          });
          
          if (toInsertAlarms.length>0) {
            saveValveStatusDB(toInsertAlarms);
          }        

        }else{
          let toInsertAlarms = [];
        //  console.log("Not first time...")
          currentStatusList.forEach(valveError=>{
            // Insert the alarm if it is not inserted..
            let valveObject = {};
            valveObject = valvesMapData.get(valveError.valve_id);
            if (valveObject['inserted'] === false && valveObject.alarm_active === 1) {
              toInsertAlarms.push(valveObject)
            }
            // Alarm becomes archive
            if (((valveObject['valve_status'] < 16 && valveObject.valve_type!==4 && valveObject.subType !== 100) && valveObject.acknowledged === 1) || ((valveObject['valve_status'] === 0 && valveObject.subType === 100) && valveObject.acknowledged === 1) || ((valveObject['valve_status'] !== 0 && valveObject.valve_type===4)&& valveObject.acknowledged === 1) ) {
              if (valveObject['time_retrieved'] === undefined || valveObject['time_retrieved'] === null) {
                let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                valveObject['time_retrieved'] = time_retrieved;
              }
              
              valveObject['archive'] = 0;
              valveObject['inserted'] = false;
              valveObject['alarm_active'] = 0;
              valveObject['blue_alarm'] = 0;
              valveObject.acknowledged = 0;
              valveObject['time_accepted'] = null;
              valveObject['alarm_description'] = null;
              valveObject['alarm_date'] = null;
              valveObject['updateRed'] = true;
              valveObject['alarm_name'] = null;

              const sqlUpdate = `UPDATE alarms SET alarm_description = 'Archived Alarm' ,blue_alarm = 0, time_retrieved ='${valveObject['time_retrieved']}',alarm_active =0,archive=1,valve_status='${valveObject.valve_status}'
              WHERE (valve_id='${valveObject.valve_id}' && (alarm_active = 1 || blue_alarm = 1));`;
              mySqlConnection.query(sqlUpdate, function (err, result) {
                if (err) throw err;

              });
             // console.log(valveObject)
              valveObject['time_retrieved'] = null;
              valveObject['valve_status'] = valveError.valve_status;
              valvesMapData.set(valveError.valve_id, valveObject);
            }
            //Blue Alarm
            if ((valveObject.valve_status < 16 && valveObject.valve_type ===1 && valveObject.subType !== 100 &&valveObject.valve_status !==48) && (valveObject.acknowledged===0 && valveObject.updateBlue===true && valveObject.alarm_active===1 ) ) {
            if (valveObject.inserted === true) {              
           console.log(valveObject);
                valveObject.updateBlue = false;
                let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                valveObject.alarm_active = 0
                valveObject['blue_alarm'] = 1;
                valveObject['time_retrieved'] = time_retrieved;
                valveObject['updateRed'] = true;
                valvesMapData.set(valveError.valve_id, valveObject);
                const sqlUpdate = `UPDATE alarms SET alarm_description = 'Inactive unaccepted' ,blue_alarm = 1, time_retrieved ='${time_retrieved}',alarm_name ='${valveObject.alarm_name}',alarm_date ='${valveObject.alarm_date}',alarm_active =0,time_accepted=null,acknowledged=0
                WHERE (valve_id='${valveObject.valve_id}' &&  (archive = 0) );`;
                mySqlConnection.query(sqlUpdate, function (err, result) {
                  if (err) throw err;
                 
                });
                console.log('Alarm is now Blue Alarm')
              }
            }

            //Blue Alarm Type 4
            if ((valveObject.valve_status !== 0 && valveObject.valve_type === 4 ) && (valveObject.acknowledged === 0 && valveObject.updateBlue === true && valveObject.alarm_active === 1)) {
              if (valveObject.inserted === true) {

                valveObject.updateBlue = false;
                let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                valveObject.alarm_active = 0
                valveObject['blue_alarm'] = 1;
                valveObject['time_retrieved'] = time_retrieved;
                valveObject['updateRed'] = true;
                valvesMapData.set(valveError.valve_id, valveObject);
                const sqlUpdate = `UPDATE alarms SET alarm_description = 'Inactive unaccepted' ,blue_alarm = 1, time_retrieved ='${time_retrieved}',alarm_name ='${valveObject.alarm_name}',alarm_date ='${valveObject.alarm_date}',alarm_active =0,time_accepted=null,acknowledged=0
                 WHERE (valve_id='${valveObject.valve_id}' &&  (archive = 0) );`;
                mySqlConnection.query(sqlUpdate, function (err, result) {
                  if (err) throw err;

                });
                console.log('Alarm is now Blue Alarm')
              }
            } //Blue Alarm Type 4

            //Blue Alarm SubType 100
            if ((valveObject.subType === 100 && valveObject.valve_status === 0 ) && (valveObject.acknowledged === 0 && valveObject.updateBlue === true && valveObject.alarm_active === 1)) {
              if (valveObject.inserted === true) {

                valveObject.updateBlue = false;
                let time_retrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                valveObject.alarm_active = 0
                valveObject['blue_alarm'] = 1;
                valveObject['time_retrieved'] = time_retrieved;
                valveObject['updateRed'] = true;
                valvesMapData.set(valveError.valve_id, valveObject);
                const sqlUpdate = `UPDATE alarms SET alarm_description = 'Inactive unaccepted' ,blue_alarm = 1, time_retrieved ='${time_retrieved}',alarm_name ='${valveObject.alarm_name}',alarm_date ='${valveObject.alarm_date}',alarm_active =0,time_accepted=null,acknowledged=0
                 WHERE (valve_id='${valveObject.valve_id}' &&  (archive = 0) );`;
                mySqlConnection.query(sqlUpdate, function (err, result) {
                  if (err) throw err;

                });
                console.log('Alarm is now Blue Alarm')
              }
            }//Blue Alarm SubType 100


            //Error trigerred again and it is already inserted.
            if (valveObject.inserted === true && valveObject.alarm_active===1 && valveObject['updateRed'] === true) {
              let alarm_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
              valveObject['alarm_date'] = alarm_date;
              valveObject['blue_alarm'] = 0;
              valveObject['time_retrieved'] = null;
              valveObject['alarm_active'] = 1;
              valveObject['updateRed'] = false;
              valveObject.updateBlue=true;
              valvesMapData.set(valveError.valve_id, valveObject);
              const sqlUpdate = `UPDATE alarms SET alarm_description = '${valveObject.alarm_description}' ,blue_alarm = 0, time_retrieved =null,alarm_name ='${valveObject.alarm_name}',alarm_date ='${alarm_date}',alarm_active =1,time_accepted=null,acknowledged=0
              WHERE (valve_id='${valveObject.valve_id}' &&  (archive = 0) );`;
              mySqlConnection.query(sqlUpdate, function (err, result) {
                if (err) throw err;
               
              });
              console.log('Alarm again...')
             }

             

          }); // currentStatusList.forEach(valveError        
          if (toInsertAlarms.length > 0) {
            saveValveStatusDB(toInsertAlarms);
          }
        } // Ends if not not first time

      }   // Ends of if  typeof firstTimeRun === "boolean"       
   
    
    } // If (typeof valveRunTimeData === "array" || valveRunTimeData instanceof Array)   
   
  }); // Ends on message   
   
}// function startValvesStatus()

function saveValveStatusDB(alarms) {
  let arrayOfAlarms = [];  
  let valveObject ={};
  
  alarms.forEach(valveRunTimeData=>{
    valveObject =valvesMapData.get(valveRunTimeData.valve_id);
    valveObject['inserted'] = true; 
    valvesMapData.set(valveObject['valve_id'],valveObject);
    let alarmDataArray;
    alarmDataArray = Array.of(valveRunTimeData.valve_id, valveRunTimeData.valve_status,valveRunTimeData['acknowledged'],valveRunTimeData['alarm_date'],valveRunTimeData['alarm_description'],valveRunTimeData.alarm_name)
    
    arrayOfAlarms.push(alarmDataArray);
  });
  mySqlConnection.query('INSERT INTO alarms (valve_id,valve_status,acknowledged,alarm_date,alarm_description,alarm_name) VALUES ?', [arrayOfAlarms],
  function (err, result) {
    if (err) throw err;
    console.log("Number of records inserted: " + result.affectedRows);
    firstTimeRun = false;
   
  });
 
}
function makeAlarmAcknowledged (valve_id) { 
  let valveObject = valvesMapData.get(valve_id);
  if ( valveObject['subType'] ===100) {
 //   let acceptSensor = new WebSocket('ws://192.168.190.232:8089');
    let acceptSensor = new WebSocket('ws://127.0.0.1:8089');
  acceptSensor.on('open', function open() {
    console.log('Messagge sent to web socket server.')
    const msg = {"setAcceptLevelSensors":{}};

    acceptSensor.send(JSON.stringify(msg));
    acceptSensor.on('message', function incoming(data) {
      console.log(data);
    });
     setTimeout(() => {
     acceptSensor.close();
     }, 1000);

  });
  acceptSensor.on('close', function close() {

    acceptSensor = null;
    console.log('acceptSensor disconnected....'); 
   
  });
  acceptSensor.on('error', function close() {

    acceptSensor = null;
    console.log('Websocket server disconnected please start websocket server...'); 
   
  });
  } 

  
  let time_accepted = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  
  valveObject.alarm_description ='Alarm accepted.';
  valveObject.time_accepted = time_accepted;
  valveObject.acknowledged=1;
  valvesMapData.set(valve_id, valveObject);
  const sqlUpdate = `UPDATE alarms SET alarm_description = 'Active accepted' , time_retrieved =null,alarm_name ='${valveObject.alarm_name}',time_accepted='${time_accepted}',acknowledged=1
              WHERE (valve_id='${valveObject.valve_id}' &&  (archive = 0) );`;
              mySqlConnection.query(sqlUpdate, function (err, result) {
                if (err) throw err;
               
              });
 // console.log(valveObject);
 }

module.exports = { startValvesStatus: startValvesStatus, initializingValves:initializingValves,makeAlarmAcknowledged:makeAlarmAcknowledged }