const WebSocket = require("ws");
const mySqlConnection = require("./dataBaseConnection");
let dataInTankssDB = false;
let tankMapData = new Map() // Containes all tanks data ..
const moment = require('moment');

//******************** Tanks Code websocket ******************/

function initializingTanksTable() {  


   
      mySqlConnection.query("SELECT * FROM tanks", function (err, result, fields) {

        if (err) throw err;
        dataInTankssDB = result.length > 0 ? true : false;

      }); 

  

  // Get density,volume,tankCode
  setTimeout(() => {

    //   console.log(tankMapData);

    let tankNamesWs = new WebSocket('ws://127.0.0.1:8089');
  // let tankNamesWs = new WebSocket('ws://192.168.190.232:8089');
    tankNamesWs.on('open', function open() {
      console.log('Connect tanks names websocket...........')

      if (tankNamesWs.readyState != 2 || ws.readyState != 3) {
        const msg = { "getKslTankData": { "vessel": 1 } };
        tankNamesWs.send(JSON.stringify(msg));
      } else {
        initializingTanksTable();
      }

    });
    tankNamesWs.onerror = function (evt) {
      console.log('websocket closed.....')
      tankNamesWs = null;
      initializingTanksTable();
    }

    tankNamesWs.on('message', (data) => {
      const received_msg = data;
      let tanksKslData = JSON.parse(received_msg);
      tanksKslData = tanksKslData.setKslTankData
      let tankDataArray = [];
      let arrayOfTanksKsl = [];
      let densityArr = [];
      let volumeArr = [];
     
      let idArr = [];
      if (typeof tanksKslData === "array" || tanksKslData instanceof Array) {

        if (typeof dataInTankssDB === "boolean" || dataInTankssDB instanceof Boolean) {

          //If ther are no data in tanks table in db insert tanks info ..              
          let tank_id = 1;

          tanksKslData.forEach(tankData => {         
            densityArr.push(tankData.Density);        
          
           
            volumeArr.push(tankData.Volume);
            idArr.push(tank_id)
            tankDataArray = Array.of(tankData.TankCode, tankData.Volume, tankData.Density, tank_id);
            tank_id += 1;
            arrayOfTanksKsl.push(tankDataArray);
          })

          let tankID = 1;
          tanksKslData.forEach(tankData => {
            let tankObject = {};
            tankObject['volume'] = tankData.Volume;
            tankObject['tank_id'] = tankID;
            tankObject['meanTemp'] = 0;
            tankObject['temperature_limit'] = 90;
            tankObject['update_Temperature_alarm'] = true;
            tankObject['update_Temperature_blue_alarm'] = true;
            tankObject['update_Temperature_archive'] = true;
            tankObject['temp_inserted'] = false;
            tankObject['temp_acknowledged'] = 0;
            tankObject['temp_alarm_active'] = 0;           
            tankObject['temp_blue_alarm'] = 0;
            tankObject['temp_archive'] = 0;
            tankObject['tepm_alarm_name'] = null;
            tankObject['tepm_alarm_description'] = null;            
            tankObject['tepm_alarm_date'] = null;
            tankObject['tepm_time_accepted'] = null;
            tankObject['tepm_time_retrieved'] = null;

            tankObject['density'] = tankData.Density;
            tankObject['code_name'] = tankData.TankCode;
            //   console.log(tankObject['code_name'])
            tankObject['archive'] = 0;
            tankObject['updateH'] = true;
            tankObject['updateHH'] = true;
            tankObject['updateL'] = true;
            tankObject['updateLL'] = true;
            tankObject['updateBlue'] = true;
            tankObject['inserted'] = false;
            tankObject['acknowledged'] = 0;
            tankObject['alarm_active'] = 0;
            tankObject['level_alarm'] = 0;
            tankObject['blue_alarm'] = 0;
            tankObject['alarm_name'] = null;
            tankObject['alarm_description'] = null;            
            tankObject['alarm_date'] = null;
            tankObject['time_accepted'] = null;
            tankObject['time_retrieved'] = null;

            tankMapData.set(tankID, tankObject);

            if (tankID == tanksKslData.length) {
              // console.log(tanksKslData.length)
              tankNamesWs.close();

            }
            tankID += 1;
          });

          setTimeout(() => {
            if (dataInTankssDB) {
              console.log('There are data in tanks table..');
            //console.log(volumeArr)
              // console.log(arr)
              const sqlUpdate = `UPDATE tanks SET  volume= ?,Density = ?  WHERE tank_id IN (?);`;
              mySqlConnection.query(sqlUpdate, volumeArr, densityArr, idArr, function (err, result) {
                if (err) throw err;
              });

            } else {
              console.log('No data in tanks table..')
             //  console.log(arrayOfTanksKsl)
              const sql = `USE ship_master;
              INSERT INTO tanks (code_name,volume,density,tank_id) VALUES ?;`;
              //If ther are no data in tanks table in db insert pumps data set up..
              mySqlConnection.query(sql, [arrayOfTanksKsl], function (err, result) {
                if (err) throw err;
                 console.log("Number of records inserted: " + result.affectedRows);

              });
             
            }
          }, 1500);

        }

      }   // if (typeof tanksKslData === "array" || tanksKslData instanceof Array) {      

    });// tankNamesWs.on('message', (data)

    tankNamesWs.on('close', function () {
      tankNamesWs = null;
      console.log('Tanks names websocket disconnected...................');
      setTimeout(() => {
        getTanksSettings();
      }, 3000);

      //  console.log(tankMapData);
    });

  }, 2000);


} // End of initialize method

//*********************************** End Of initializing *************************** */

//******************** Get tanks settings ******************/

function getTanksSettings() {

  let tanksSettingsWs = new WebSocket('ws://127.0.0.1:8089');
 // let tanksSettingsWs = new WebSocket('ws://192.168.190.232:8089');
  tanksSettingsWs.on('open', function open() {
    console.log('Connect tanks settings websocket...........')
    if (tanksSettingsWs.readyState != 2 || ws.readyState != 3) {
      for (let [key, value] of tankMapData) {

        const msg = { "getTankSettingsData": { "tankId": key } };
        tanksSettingsWs.send(JSON.stringify(msg));
        // console.log(tankMapData.size)
        if (key === tankMapData.size) {
          tanksSettingsWs.close();
        }
      }

    } else {
      getTanksSettings();
    }
  });
  tanksSettingsWs.onerror = function (evt) {
    console.log('websocket closed.....')
    tanksSettingsWs = null;
    getTanksSettings();
  }

  tanksSettingsWs.on('message', (data) => {
    const received_msg = data;
    let tankSettings = JSON.parse(received_msg);
    // console.log(tankSettings)
    tankSettings = tankSettings.setTankSettingsData

    if (typeof tankSettings === "object" && tankSettings !== undefined) {
      let tankObject = {};

     // console.log(tankSettings)     

      let tankId = tankSettings['tankId'];
      tankObject = tankMapData.get(tankId);
      tankObject['max_volume'] = tankSettings['maxVolume'];
      let tankHighLevel = tankSettings['highLevel'];
      let tankLowLevel = tankSettings['lowLevel'];
      let tankLowLowLevel = tankSettings['lowLowLevel'];
      let highHighLevel = tankSettings['highHighLevel'];
      if (tankObject !== undefined) {
        if (tankHighLevel > highHighLevel) {
          // console.log(highHighLevel)
          let tankHighLevelTemp = tankHighLevel;
          tankHighLevel = highHighLevel;
          highHighLevel = tankHighLevelTemp;

          tankObject['tankHighLevel'] = tankHighLevel;
          tankObject['tankLowLevel'] = tankLowLevel;
          tankObject['tankLowLowLevel'] = tankLowLowLevel;
          tankObject['highHighLevel'] = highHighLevel;

        } else {
          tankObject['tankHighLevel'] = tankHighLevel;
          tankObject['tankLowLevel'] = tankLowLevel;
          tankObject['tankLowLowLevel'] = tankLowLowLevel;
          tankObject['highHighLevel'] = highHighLevel;
        }
        if ((tankLowLevel < tankLowLowLevel) && (tankLowLevel !== -10)) {
          let tankLowLevelTemp = tankLowLevel;
          tankLowLevel = tankLowLowLevel;
          tankLowLowLevel = tankLowLevelTemp;
          tankObject['tankLowLevel'] = tankLowLevel;
          tankObject['tankLowLowLevel'] = tankLowLowLevel;
        }
      }// if (tankObject!==undefined)


      tankMapData.set(tankId, tankObject);
      let maxVolume = tankSettings['maxVolume'];
      //console.log(tankLowLevel)
      const sqlUpdate = `UPDATE tanks SET low_alarm_limit = '${tankLowLevel}' ,low_low_alarm_limit = '${tankLowLowLevel}' , high_alarm_limit = '${tankHighLevel.toFixed(2)}', high_high_alarm_limit = '${highHighLevel.toFixed(2)}',max_volume='${maxVolume}' WHERE (tank_id='${tankId}');`;
      mySqlConnection.query(sqlUpdate, function (err, result) {
        if (err) throw err;
       //  console.log(result)
      });

    }//if (typeof tankSettings === "object" && tankSettings !== undefined)


  });// On Message

  tanksSettingsWs.on('close', function () {
    setTimeout(() => {
      startsTanksLiveData();
    }, 4000);

    tanksSettingsWs = null;
    console.log('Tanks settings websocket disconnected...................');
    //  console.log(tankMapData);
  });

} // Ends getTanksSettings function

//******************** get live data websocket ******************/
function startsTanksLiveData() {
  let firstTimeRun = true; // Variable for finding out whether the websocket tanks live data received data before or not...
 
  //console.log(tankMapData);   

  // Subscribe to tanksLive data
 // let wsTankLiveData = new WebSocket("ws://127.0.0.1:8089");
  let wsTankLiveData = new WebSocket("ws://192.168.190.232:8089");
  wsTankLiveData.onopen = function (evt) {

    var msg = { "setTankSubscriptionOn": { "tankId": 0 } };

    const msgJson = JSON.stringify(msg);
    setTimeout(() => {
      wsTankLiveData.send(msgJson);
    }, 2000);

  };
  wsTankLiveData.onerror = function (evt) {
    console.log('Websocket server disconnected please start websocket server.')
    wsTankLiveData = null;
    // startsTanksLiveData();
  }
  wsTankLiveData.onclose = function () {
    console.log("Tanks live data Websocket is closed.....");
    wsTankLiveData = null;
    startsTanksLiveData();
  };
  wsTankLiveData.onmessage = function (evt) {
    let currentAlarms = [];
    let noAlarmList = [];
    //console.log("Server working now.");
    let listOfTanksData = [];
    let received_msg = evt.data;
    let tanksLiveData = JSON.parse(received_msg);
    listOfTanksData = tanksLiveData.setTankSubscriptionData;

    if (typeof listOfTanksData === "array" || listOfTanksData instanceof Array) {

      listOfTanksData.forEach((tankInfo) => {
        let mapObject = {};
        let tankId = tankInfo.tankId;
        mapObject = tankMapData.get(tankId);
       if (tankInfo.tankId ===32) {
        console.log("Socket meanTemp "+tankInfo.meanTemp)
       // console.log(mapObject);
        console.log('Object:'+mapObject['temperature_limit'] + " Alarm Active " + mapObject.temp_alarm_active +" Temp Acknow "+mapObject['temp_acknowledged'])
       }
        
        
        let tankLevel = tankInfo.level;
        let levelAlarm = tankInfo.levelAlarm;
        mapObject['tank_level'] = tankLevel;
        mapObject['level_alarm'] = tankInfo.levelAlarm;
        mapObject['volume'] = tankInfo.volume;

 // Check for temperature alarm ************************************** Check for temperature alarm ****************************
 if (tankInfo.meanTemp > mapObject['temperature_limit']) {
          
  if (mapObject ['update_Temperature_alarm'] === true) {
   // console.log(mapObject ['update_Temperature_alarm'])
        mapObject ['update_Temperature_alarm'] = false;
        let temp_alarm_name = mapObject['code_name'] + ' High Temp Alarm';
        mapObject['temp_alarm_active'] = 1;
        let alarmDateTriggered = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        mapObject['temp_time_retrieved'] = null;
        mapObject['temp_alarm_date'] = alarmDateTriggered;
        mapObject['temp_alarm_name'] = temp_alarm_name;
        mapObject['temp_time_accepted'] = null;
        mapObject['temp_blue_alarm'] = 0;
        
        mapObject.temp_alarm_active = 1;
        mapObject['temp_acknowledged'] = 0;
        mapObject ['update_Temperature_blue_alarm'] = true;
        mapObject['temp_alarm_description'] = 'Active unaccepted High Temp Alarm triggered';                 
        tankMapData.set(tankId, mapObject);
       
        if (mapObject['temp_inserted'] === true) {
         const sqlUpdate = `UPDATE alarms SET alarm_name = '${temp_alarm_name}', alarm_description = '${mapObject.temp_alarm_description}' ,blue_alarm = 0, time_retrieved =null,alarm_name ='${mapObject.temp_alarm_name}',alarm_date ='${mapObject.temp_alarm_date}',alarm_active =1,time_accepted=null,acknowledged=0
                    WHERE (tank_id='${tankId}' &&  (archive = 0) && (temp_alarm = 1));`;

         mySqlConnection.query(sqlUpdate, function (err, result) {
           if (err) throw err;
           console.log('Alarm became ' + temp_alarm_name);

           const sqlUpdateAlarmName = `UPDATE tanks SET temp_alarm_name ='${temp_alarm_name}' WHERE (tank_id='${tankId}' );`;
           mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
             if (err) throw err;
           });
         });
     }else{
      const sql = `INSERT INTO alarms (alarm_name,tank_id,acknowledged,alarm_description,archive,alarm_date,alarm_active,blue_alarm,temp_alarm) VALUES
       ('${temp_alarm_name}','${tankId}',0,'${mapObject['temp_alarm_description']}',0,'${alarmDateTriggered}',1,0,1);`;
       mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        mapObject['temp_inserted'] = true;
        const sqlUpdateAlarmName = `UPDATE tanks SET temp_alarm_name ='${temp_alarm_name}' WHERE (tank_id='${tankId}' );`;
           mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
             if (err) throw err;
           });
      });                
     // tankMapData.set(tankId, mapObject);
      console.log(mapObject)
  }

} // (mapObject ['update_Temperature_alarm'] === true) 


} // if (tankInfo.meanTemp > mapObject['temperature_limit'])        
 // Check for temperature alarm ******************************************* Check for temperature alarm *******************************

 // Check for Blue Temperature alarm ****************************************************
if (tankInfo.meanTemp < mapObject['temperature_limit'] && mapObject.temp_alarm_active === 1 && mapObject.temp_acknowledged=== 0) {
          
  if (mapObject ['update_Temperature_blue_alarm'] === true) {
   // console.log(mapObject ['update_Temperature_alarm'])
        mapObject ['update_Temperature_blue_alarm'] = false;
        mapObject ['update_Temperature_alarm'] = true;
        
        mapObject['temp_alarm_active'] = 0;
        let timeRetrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');       
        mapObject['tepm_time_retrieved'] = timeRetrieved;          
        mapObject['temp_blue_alarm'] = 1;
       // mapObject['temp_acknowledged'] = 0;
        mapObject['temp_alarm_description'] = 'Inactive unaccepted Temp Alarm';                 
        tankMapData.set(tankId, mapObject);
       
        if (mapObject['temp_inserted'] === true) {
         
         const sqlUpdate = `UPDATE alarms SET  alarm_description = '${mapObject['temp_alarm_description']}' ,blue_alarm = 1, time_retrieved ='${timeRetrieved}',alarm_active =0
                    WHERE (tank_id='${tankId}' && (archive = 0) && (temp_alarm = 1) );`;
                  
                    mySqlConnection.query(sqlUpdate, function (err, result) {
                      if (err) throw err;
                      console.log('Alarm became ' + "Inactive unaccepted Temp Alarm");
                    });
                    
         
     }

} // (mapObject ['update_Temperature_alarm'] === true) 


} // if (tankInfo.meanTemp > mapObject['temperature_limit'])        
 // Check for Blue Temperature alarm ****************************************************

// Check for Archive Temperature alarm ****************************************************
if (tankInfo.meanTemp < mapObject['temperature_limit'] && mapObject['temp_acknowledged'] === 1) {
  
  // console.log(mapObject ['update_Temperature_alarm'])
  mapObject['update_Temperature_blue_alarm'] = true;
  mapObject['update_Temperature_alarm'] = true;
  
  let timeRetrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  mapObject['tepm_time_retrieved'] = mapObject['tepm_time_retrieved'] === (undefined || null)? timeRetrieved : mapObject['tepm_time_retrieved'];
  mapObject['tepm_time_accepted'] = mapObject['tepm_time_accepted'] === null ? timeRetrieved : mapObject['tepm_time_accepted'];          
  mapObject['temp_blue_alarm'] = 0;
  mapObject['tepm_alarm_name'] = null;
  mapObject['temp_alarm_description'] = null;

  if (mapObject['temp_inserted'] === true) {
    const sqlUpdate = `UPDATE alarms SET  alarm_description = 'Archived Temp Alarm' ,blue_alarm = 0, time_retrieved ='${mapObject['tepm_time_retrieved']}',alarm_active =0,time_accepted='${mapObject['tepm_time_accepted']}',archive = true
            WHERE (tank_id='${tankId}' );`;
            mySqlConnection.query(sqlUpdate, function (err, result) {
              if (err) throw err;
              console.log('Alarm became ' + "Archived Temp Alarm");
            });
  

  }
  mapObject['tepm_alarm_date'] = null;
  mapObject['tepm_time_retrieved'] = null;
  mapObject['tepm_time_accepted'] = null;
  mapObject['temp_alarm_active'] = 0;
  mapObject['temp_archive'] = 0;
  mapObject['temp_inserted'] = false;
  mapObject['temp_acknowledged'] = 0;

  tankMapData.set(tankId, mapObject);

} // if (tankInfo.meanTemp > mapObject['temperature_limit'])        
// Check for Archive Temperature alarm ****************************************************



        if (tankInfo.levelAlarm > 0) {
          let tankCode = mapObject['code_name'];
          if (mapObject['alarm_date'] === undefined || mapObject['alarm_date'] === null) {
            let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
            mapObject['alarm_date'] = alarmTimeStamp;
          }

          // Check if tank leve will reach beyond limits (High ,high high , low and low low) ********************************
          let tankHighLevel = mapObject['tankHighLevel'];
          let tankLowLevel = mapObject['tankLowLevel'];
          let tankLowLowLevel = mapObject['tankLowLowLevel'];
          let highHighLevel = mapObject['highHighLevel'];
          //  console.log("Tank name: "+mapObject.code_name+" Tank level : " +mapObject.tank_level.toFixed(2)+" High level is: "+tankHighLevel.toFixed(2)+' High High: '+highHighLevel.toFixed(2)+" Low level : "+tankLowLevel.toFixed(2)+" Low Low level : "+tankLowLowLevel.toFixed(2));
          // Check for low and low low levels          
          if (tankLowLowLevel !== -10 && tankLowLevel !== -10) {

            if ((tankLevel < tankLowLevel) && (tankLevel > tankLowLowLevel)) {
              let alarmName = tankCode + ' LevelAlarm L';

              if (mapObject['updateL'] === true) {
                mapObject['alarm_active'] = 1;
                let alarmDateTriggered = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['time_retrieved'] = null;
                mapObject['alarm_date'] = alarmDateTriggered;
                mapObject['alarm_name'] = alarmName;
                mapObject['time_accepted'] = null;
                mapObject['acknowledged'] = 0;
                mapObject['alarm_description'] = 'Active unaccepted Low Alarm triggered';
                mapObject['updateL'] = false;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = true;
                mapObject['updateBlue'] = true;
                mapObject['blue_alarm'] = 0;
                tankMapData.set(tankId, mapObject)
                
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active =1,time_accepted=null,acknowledged=0
                             WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;

                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_name);

                    const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}' );`;
                    mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                      if (err) throw err;
                    });
                  });
                }
              }

            }// ((tankLevel < tankLowLevel) && (tankLevel > tankLowLowLevel))

            if ((tankLevel < tankLowLowLevel)) {
              let alarmName = tankCode + ' LevelAlarm LL';

              //   console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel + " Low level is: " + tankLowLevel + " Low Low level is: " + tankLowLowLevel);

              if (mapObject['updateLL'] === true) {
                mapObject['alarm_active'] = 1;
                let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['time_retrieved'] = null;
                mapObject['alarm_date'] = alarmTimeStamp;
                mapObject['alarm_name'] = alarmName;
                mapObject['time_accepted'] = null;
                mapObject['acknowledged'] = 0;
                mapObject['alarm_description'] = 'Active unaccepted Low Low Alarm triggered';
                mapObject['updateL'] = true;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = false;
                mapObject['updateBlue'] = true;
                mapObject['blue_alarm'] = 0;
                tankMapData.set(tankId, mapObject);
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}', alarm_active =1,time_accepted=null,acknowledged=0
                               WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_description)
                    const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}');`;
                    mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                      if (err) throw err;
                    });
                  });
                }

              }
            }
          }// If tankLowLowLevel !== -10 && tankLowLevel !== -10

          if (tankLowLowLevel !== -10 && tankLowLevel === -10) {
            if ((tankLevel < tankLowLowLevel)) {
              let alarmName = tankCode + ' LevelAlarm LL';
              //  console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel + " Low level is: " + tankLowLevel + " Low Low level is: " + tankLowLowLevel);
              if (mapObject['updateLL'] === true) {
                let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['time_retrieved'] = null;
                mapObject['alarm_active'] = 1;
                mapObject['time_accepted'] = null;
                mapObject['acknowledged'] = 0;
                mapObject['alarm_date'] = alarmTimeStamp;
                mapObject['alarm_name'] = alarmName;
                mapObject['alarm_description'] = 'Active unaccepted Low Low Alarm triggered';
                mapObject['updateL'] = true;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = false;
                mapObject['updateBlue'] = true;
                mapObject['blue_alarm'] = 0;
                tankMapData.set(tankId, mapObject)
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active =1,time_accepted=null,acknowledged=0
                         WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_description)
                    const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}');`;
                    mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                      if (err) throw err;
                    });
                  });
                }
              }

            }
          }

          if (tankLowLevel !== -10 && tankLowLowLevel === -10) {
            if (tankLevel < tankLowLevel) {
              let alarmName = tankCode + ' LevelAlarm L';


              if (mapObject['updateL'] === true) {
                let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['alarm_active'] = 1;
                mapObject['time_retrieved'] = null;
                mapObject['time_accepted'] = null;
                mapObject['acknowledged'] = 0;
                mapObject['alarm_date'] = alarmTimeStamp;
                mapObject['alarm_name'] = alarmName;
                mapObject['alarm_description'] = 'Active unaccepted Low Alarm triggered';
                mapObject['updateL'] = false;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = true;
                mapObject['updateBlue'] = true;
                mapObject['blue_alarm'] = 0;
                tankMapData.set(tankId, mapObject)
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}', alarm_active =1,alarm_active =1,time_accepted=null,acknowledged=0
                               WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_description)
                    const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}');`;
                    mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                      if (err) throw err;
                    });
                  });
                }
              }
            }
          }
          // Check for high and high high tank level 

          if ((tankLevel > tankHighLevel) && (tankLevel < highHighLevel)) {

            let alarmName = tankCode + ' LevelAlarm H';
            if (mapObject['updateH'] === true) {
              let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
              mapObject['time_retrieved'] = null;
              mapObject['alarm_active'] = 1;
              mapObject['time_accepted'] = null;
              mapObject['acknowledged'] = 0;
              mapObject['alarm_date'] = alarmTimeStamp;
              mapObject['alarm_name'] = alarmName;
              mapObject['alarm_description'] = 'Active unaccepted High Alarm triggered';
              mapObject['updateL'] = true;
              mapObject['updateH'] = false;
              mapObject['updateHH'] = true;
              mapObject['updateLL'] = true;
              mapObject['updateBlue'] = true;
              mapObject['blue_alarm'] = 0;
              tankMapData.set(tankId, mapObject)
              if (mapObject['inserted'] === true) {
                const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}', alarm_active =1,alarm_active =1,time_accepted=null,acknowledged=0
                           WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                mySqlConnection.query(sqlUpdate, function (err, result) {
                  if (err) throw err;
                  console.log('Alarm became ' + mapObject.alarm_description)
                  const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}');`;
                  mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                    if (err) throw err;
                  });
                });
              }
            }

            // console.log(element)
            //    console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel + " High level is: " + tankHighLevel + " Low level is: " + tankLowLevel);
          }
          if ((tankLevel > highHighLevel)) {
            let alarmName = tankCode + ' LevelAlarm HH';

            if (mapObject['updateHH'] === true) {
              let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
              mapObject['alarm_active'] = 1;
              mapObject['time_retrieved'] = null;
              mapObject['alarm_date'] = alarmTimeStamp;
              mapObject['alarm_name'] = alarmName;
              mapObject['time_accepted'] = null;
              mapObject['acknowledged'] = 0;
              mapObject['blue_alarm'] = 0;
              mapObject['alarm_description'] = 'Active unaccepted High High Alarm triggered';
              mapObject['updateL'] = true;
              mapObject['updateH'] = true;
              mapObject['updateHH'] = false;
              mapObject['updateLL'] = true;
              mapObject['updateBlue'] = true;
              tankMapData.set(tankId, mapObject)
              if (mapObject['inserted'] === true) {
                const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved =null,alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}', alarm_active =1,alarm_active =1,time_accepted=null,acknowledged=0
                         WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                mySqlConnection.query(sqlUpdate, function (err, result) {
                  if (err) throw err;
                  console.log('Alarm became ' + mapObject.alarm_description)
                  const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name ='${mapObject.alarm_name}' WHERE (tank_id='${mapObject.tank_id}');`;
                  mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
                    if (err) throw err;
                  });
                });
              }
            }

            // console.log(element)
            //  console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel + " High level is: " + tankHighLevel + " Low level is: " + tankLowLevel + ' High High: ' + highHighLevel);
          }

          // Check if alarm comes from alarm state to normal state without being accepted...
          if ((tankLevel > tankLowLevel && tankLevel < tankHighLevel) && (mapObject['acknowledged'] === 0)) {
            if (tankLowLevel !== -10 && tankLowLowLevel !== -10) {

              if (tankLowLevel !== 0) {
                mapObject['updateL'] = true;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = true;

                if (mapObject['updateBlue'] === true) {
                  mapObject['blue_alarm'] = 1;
                  mapObject['alarm_active'] = 0;
                  mapObject['updateBlue'] = false;
                  let alarmTimeStampN = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                  mapObject['time_retrieved'] = alarmTimeStampN;
                  mapObject['alarm_description'] = 'Inactive unaccepted';
                  tankMapData.set(tankId, mapObject)

                  if (mapObject['inserted'] === true) {
                    const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved ='${mapObject.time_retrieved}',alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active=0 
                         WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                    mySqlConnection.query(sqlUpdate, function (err, result) {
                      if (err) throw err;
                      console.log('Alarm became ' + mapObject.alarm_description)

                    });
                  }
                } // Ends if updateBlue

              }// If tankLowLevel !==0

              if (tankLowLevel === 0 && tankLevel > tankLowLowLevel) {
                mapObject['updateL'] = true;
                mapObject['updateH'] = true;
                mapObject['updateHH'] = true;
                mapObject['updateLL'] = true;
                if (mapObject['updateBlue'] === true) {
                  mapObject['blue_alarm'] = 1;
                  mapObject['alarm_active'] = 0;
                  mapObject['updateBlue'] = false;
                  let alarmTimeStampN = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                  mapObject['time_retrieved'] = alarmTimeStampN;
                  mapObject['alarm_description'] = 'Inactive unaccepted';
                  tankMapData.set(tankId, mapObject)
                  if (mapObject['inserted'] === true) {
                    const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved ='${mapObject.time_retrieved}',alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active=0 
                         WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                    mySqlConnection.query(sqlUpdate, function (err, result) {
                      if (err) throw err;
                      console.log('Alarm became ' + mapObject.alarm_description)
                    });
                  }
                } // Ends if updateBlue      

              } // If tankLowLevel === 0 && element.tankLevel > tankLowLowLevel

            }//(tankLowLevel !==-10 && tankLowLowLevel !==-10 )

            if (tankLowLevel === -10 && tankLevel > tankLowLowLevel) {
              mapObject['updateL'] = true;
              mapObject['updateH'] = true;
              mapObject['updateHH'] = true;
              mapObject['updateLL'] = true;
              if (mapObject['updateBlue'] === true) {
                mapObject['blue_alarm'] = 1;
                mapObject['alarm_active'] = 0;
                mapObject['updateBlue'] = false;
                let alarmTimeStampN = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['time_retrieved'] = alarmTimeStampN;
                mapObject['alarm_description'] = 'Inactive unaccepted';
                tankMapData.set(tankId, mapObject)
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved ='${mapObject.time_retrieved}',alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active=0 
                       WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_description)
                  });
                }
              } // Ends if updateBlue  

            }//if (tankLowLevel ===-10 && tankLevel > tankLowLowLevel)
            if (tankLowLowLevel === -10 && tankLevel > tankLowLevel) {
              mapObject['updateL'] = true;
              mapObject['updateH'] = true;
              mapObject['updateHH'] = true;
              mapObject['updateLL'] = true;
              if (mapObject['updateBlue'] === true) {
                mapObject['blue_alarm'] = 1;
                mapObject['alarm_active'] = 0;
                mapObject['updateBlue'] = false;
                let alarmTimeStampN = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                mapObject['time_retrieved'] = alarmTimeStampN;
                mapObject['alarm_description'] = 'Inactive unaccepted';
                tankMapData.set(tankId, mapObject)
                if (mapObject['inserted'] === true) {
                  const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,blue_alarm = '${mapObject.blue_alarm}', time_retrieved ='${mapObject.time_retrieved}',alarm_name ='${mapObject.alarm_name}',alarm_date ='${mapObject.alarm_date}',alarm_active=0 
                       WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
                  mySqlConnection.query(sqlUpdate, function (err, result) {
                    if (err) throw err;
                    console.log('Alarm became ' + mapObject.alarm_description)
                  });
                }
              } // Ends if updateBlue 

            }// if (tankLowLowLevel ===-10 && tankLevel > tankLowLevel)
            // console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel + " High level : " + tankHighLevel + " Low level: " + tankLowLevel + ' Low low : ' + tankLowLowLevel);
          }//if ((tankLevel > tankLowLevel && tankLevel < tankHighLevel) && (mapObject['acknowledged'] === 0))
         
          if (levelAlarm % 2 == 1) {
            mapObject['acknowledged'] = 0

          } else {
            mapObject['acknowledged'] = 1;
            // mapObject['blue_alarm'] = 0;
            let time_accepted = mapObject['time_accepted'];
            mapObject['acknowledged'] = 1;
            if ((time_accepted === undefined || time_accepted === null) && mapObject['inserted'] === true) {
              let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
              mapObject['time_accepted'] = alarmTimeStamp;
              mapObject['alarm_description'] = 'Active accepted'
              const sqlUpdate = `UPDATE alarms SET alarm_description = '${mapObject.alarm_description}' ,alarm_name ='${mapObject.alarm_name}',time_accepted='${alarmTimeStamp}',acknowledged=1
                       WHERE (tank_id='${mapObject.tank_id}' &&  (archive = 0) && (temp_alarm = 0));`;
              mySqlConnection.query(sqlUpdate, function (err, result) {
                if (err) throw err;
                console.log('Alarm became ' + mapObject.alarm_description)
              });
            }
          }
          currentAlarms.push(mapObject);
          tankMapData.set(tankId, mapObject);
          //  console.log("Tank name is: " + tankCode + " Tank level is: " + tankLevel +" Low level is: " + tankLowLevel+' Low Low level: '+tankLowLowLevel+ " High level is: " + tankHighLevel + ' High High: ' + highHighLevel);

          //if (tankInfo.levelAlarm > 0)
        } else { // If tanklevelAlarm ===0 check for alarms retrieved.

          noAlarmList.push(tankInfo);
        }
        // console.log(tankInfo);

        //Update tanks table with tank level, tank_temperature , volume , volume percent and weight.
        let max_volume = mapObject['max_volume'];
        let tank_temperature = (tankInfo.meanTemp !== 0.0 )? tankInfo.meanTemp : 0.0 ;
        let density = mapObject['density'];
        let volume = mapObject['volume'];
        let volume_percent = (max_volume > 0)? (volume / max_volume) * 100 : 0;
        let weight = volume * density;
        const sqlUpdate = `UPDATE tanks SET tank_temperature = '${tank_temperature}', tank_level = '${tankInfo.level.toFixed(2)}',weight='${weight.toFixed(2)}',volume_percent='${volume_percent.toFixed(2)}', volume = '${tankInfo.volume.toFixed(2)}', high_alarm_limit = '${mapObject.tankHighLevel.toFixed(2)}', low_alarm_limit = '${mapObject.tankLowLevel.toFixed(2)}', density = '${density.toFixed(3)}'  WHERE (tank_id='${tankInfo.tankId}');`;
        mySqlConnection.query(sqlUpdate, function (err, result) {
          if (err) throw err;

        }); //mySqlConnection.query(sqlUpdate, function (err, result) {
        //Update tanks table with tank level, tank_temperature , volume , volume percent and weight.
        
         



 

      });// ends listOfTanksData.forEach((tankInfo)                  


    }// Ends of (typeof listOfTanksData === "array" || listOfTanksData instanceof Array)    

    if (firstTimeRun) {
      //  console.log(tankMapData);       

      let listToSave = [];
      if (currentAlarms.length > 0) {
        firstTimeRun = false;
        currentAlarms.forEach(alarm => {

          let mapObject = tankMapData.get(alarm.tank_id);
          let tankCode = mapObject['code_name'];
          // console.log(alarm)
          switch (alarm.level_alarm) {
            case 31:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' HH';
              break;
            case 29:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' HH';
              break;
            case 17: case 16: case 25: case 24: case 27:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' HH';
              break;
            case 15: case 13: case 11:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' H';
              break;
            case 9: case 8:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' H';
              break;
            case 7: case 6:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' LL';
              break;
            case 5: case 4:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' L';
              break;
            case 3: case 2:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' LL';
              break;
            default:
              mapObject['alarm_name'] = tankCode + ' LevelAlarm' + ' H'
          }
          listToSave.push(mapObject);

        });
        
        // console.log('First time....')
        saveAlarmsIntoDB(listToSave);

        currentAlarms.forEach(alarm => {
          //  console.log(alarm);
          let mapObject = tankMapData.get(alarm.tank_id);
          // console.log(mapObject)
          mapObject['inserted'] = true;
          //  mapObject['updated']=true
          tankMapData.set(alarm.tank_id, mapObject);
          // console.log(mapObject)
        });
      }//if (currentAlarms.length > 0)

      //if (firstTimeRun)
    } else {
      //  console.log('NOt First time....')     
      let toInsertAlarms = [];
      if (currentAlarms.length > 0) {
        currentAlarms.forEach(alarm => {
          let mapObject = tankMapData.get(alarm.tank_id);

          if (mapObject['inserted'] === false && mapObject['alarm_active'] === 1) {

            mapObject['inserted'] = true;
            tankMapData.set(alarm.tank_id, mapObject);

            toInsertAlarms.push(mapObject);
          }

        });

        if (toInsertAlarms.length > 0) {

          saveAlarmsIntoDB(toInsertAlarms);
        }
      }

    }  // Not first time.   

    // Check if alarm not exists any more.
    noAlarmList.forEach(al => {
      let tankObject = {};
      tankObject = tankMapData.get(al.tankId);
      if (tankObject !== undefined) {
        let timeRetrieved = tankObject.time_retrieved;
        if (timeRetrieved === null || timeRetrieved === undefined) {
          timeRetrieved = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        }

        if ((al.tankId === tankObject.tank_id) && (tankObject.alarm_active === 1 || tankObject.blue_alarm === 1)) {
          if ((tankObject['time_accepted'] === undefined || tankObject['time_accepted'] === null)) {
            let alarmTimeStamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
            tankObject['time_accepted'] = alarmTimeStamp;
            tankObject['alarm_description'] = 'Archived Alarm'
            tankObject['acknowledged'] = 1;
          }
          const sqlUpdate = `UPDATE alarms SET blue_alarm = 0 , alarm_active = false,alarm_description='Archived Alarm' ,time_retrieved='${timeRetrieved}',time_accepted='${tankObject.time_accepted}',acknowledged='${tankObject.acknowledged}'
      ,archive = true WHERE (tank_id='${tankObject.tank_id}' && (alarm_active = 1 || blue_alarm = 1) && (temp_alarm = 0));`;
          mySqlConnection.query(sqlUpdate, function (err, result) {
            if (err) throw err;
            const sqlUpdateAlarmName = `UPDATE tanks SET alarm_name = null WHERE (tank_id='${tankObject.tank_id}' );`;
            mySqlConnection.query(sqlUpdateAlarmName, function (err, result) {
              if (err) throw err;
            });
          });

          tankObject['archive'] = 0;
          tankObject['updateH'] = true;
          tankObject['updateHH'] = true;
          tankObject['updateL'] = true;
          tankObject['updateLL'] = true;
          tankObject['updateBlue'] = true;
          tankObject['inserted'] = false;
          tankObject['acknowledged'] = 0;
          tankObject['alarm_active'] = false;
          tankObject['level_alarm'] = 0;
          tankObject['alarm_name'] = null;
          tankObject['alarm_description'] = null;
          tankObject['blue_alarm'] = 0;
          tankObject['alarm_date'] = null;
          tankObject['time_accepted'] = null;
          tankObject['time_retrieved'] = null;

          tankMapData.set(al.tankId, tankObject);
          // console.log(tankObject)

        }//((al.tankId ===tankObject.tank_id)&&(tankObject.alarm_active===1 || tankObject.blue_alarm===1))  
      }
    })
  }// Ends of onmessage event function

}//Ends of function startsTanksLiveData().

function saveAlarmsIntoDB(alarms) {
  let arrayOfAlarms = [];

  let tanksToUpdate = [];
  const sql = "INSERT INTO alarms (alarm_name,tank_id,acknowledged,alarm_description,level_alarm,archive,alarm_date,time_accepted,alarm_active,blue_alarm,time_retrieved) VALUES ?";
  alarms.forEach(alarmData => {
    let tankData = {};
    let alarmDataArray;
    tankData['tank_id'] = alarmData.tank_id;
    tankData['alarm_name'] = alarmData.alarm_name;
    tanksToUpdate.push(tankData);
    alarmDataArray = Array.of(alarmData.alarm_name, alarmData.tank_id, alarmData.acknowledged,
      alarmData.alarm_description, alarmData.level_alarm, alarmData.archive, alarmData.alarm_date, alarmData.time_accepted, alarmData.alarm_active,
      alarmData.blue_alarm, alarmData.time_retrieved);
    arrayOfAlarms.push(alarmDataArray);
    // console.log(alarmDataArray);    
  })
  setTimeout(() => {
    updateTanksAlarmN(tanksToUpdate)
  }, 1000);
  //  console.log(arrayOfAlarms)      
  //If ther are no data in alarms table in db insert alarms ..
  mySqlConnection.query(sql, [arrayOfAlarms], function (err, result) {
    if (err) throw err;
    console.log("Number of incoming alarms: " + result.affectedRows);
    firstTimeRun = false;
  });
}
function updateTanksAlarmN(tanksToUpdate) {
  tanksToUpdate.forEach(tank => {
    //  console.log(tank)
    const sqlUpdate = `UPDATE tanks SET alarm_name='${tank.alarm_name}' WHERE tank_id='${tank.tank_id}' ;`;
    mySqlConnection.query(sqlUpdate, function (err, result) {
      if (err) throw err;
    });
  });
}
// Update tanks Density Volume.
function updateTankDensity(tankObject) {
  let myTankObject = {};

  myTankObject = tankMapData.get(tankObject.tankId);
  myTankObject.density = tankObject.density;
  tankMapData.set(myTankObject.tankId, myTankObject);
  console.log(myTankObject);


}//function updateTanksData()

function updateTankSettings(tankObject) {

  let tankId = tankObject.tankId;
  let myTankObject = {};

  myTankObject = tankMapData.get(tankId);
  myTankObject.tankHighLevel = tankObject.high_alarm_limit;
  myTankObject.tankLowLevel = tankObject.low_alarm_limit;
  console.log(myTankObject)
  tankMapData.set(tankId, myTankObject);

} // function updateTankSettings(tankId)

//Make temp alarm Acknowledged ******************** Make temp alarm Acknowledged ****************************************************
function makeTempAlarmAcknowledged(tank_id) {

  return new Promise(function (resolve, reject) {
    let tankObject = {};
    tankObject = tankMapData.get(tank_id);
   // console.log(tankObject['temp_alarm_active'])
    if (tankObject['temp_alarm_active'] === 1) {
      let temp_time_accepted = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      tankObject.temp_alarm_description = 'Temp Alarm Active accepted';
      tankObject['temp_acknowledged'] =1;
      tankObject.temp_time_accepted = temp_time_accepted;
      tankObject.temp_acknowledged = 1;
      tankMapData.set(tank_id, tankObject);
      const sqlUpdate = `UPDATE alarms SET alarm_description = 'Temp Alarm Active accepted' , time_retrieved =null,time_accepted='${temp_time_accepted}',acknowledged=1
                  WHERE (tank_id='${tank_id}' &&  (archive = 0) && (temp_alarm = 1));`;
      mySqlConnection.query(sqlUpdate, function (err, result) {
        if (err) throw err;

      });

      resolve('Temp Alarm Accepted');

    } else {
      resolve('There is no temp alarm with tank id:'+tank_id);
    }

  }); // End of promise.

} //Make temp alarm Acknowledged ******************** Make temp alarm Acknowledged ****************************************************

//Set temperature limit for a tink  ******************** Set temperature limit for a tink ****************************************************
function setTemperatureLimitForTank(tank_id, temp_limit) {

  return new Promise(function (resolve, reject) {
    let tankObject = {};
    tankObject = tankMapData.get(tank_id);
    // console.log(tankObject['temp_alarm_active'])
    tankObject['temperature_limit'] = temp_limit;
    tankMapData.set(tank_id, tankObject);
    resolve('Temp limit has been changed');
  }); // End of promise.

} //Set temperature limit for a tink  ******************** Set temperature limit for a tink ****************************************************

module.exports = {
  initializingTanksTable: initializingTanksTable, getTanksSettings: getTanksSettings, startsTanksLiveData: startsTanksLiveData, makeTempAlarmAcknowledged: makeTempAlarmAcknowledged,
   updateTankDensity: updateTankDensity, updateTankSettings: updateTankSettings,setTemperatureLimitForTank:setTemperatureLimitForTank
}