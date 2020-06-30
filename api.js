const express = require('express');
const dataFetchingCon = require('./dataBaseConnection')
const router = express.Router();
const webSocket = require('./valves_websocket');
const pumpWebSocket = require('./pumpsWebsocket');
const levelWebsocket = require('./level_master_webSocket');





//Get  a list of lateset 100 alarms from MySql.
router.get('/hundredAlarms', (req, res) => {
  const query = `SELECT al.alarm_id,al.alarm_name,al.alarm_active,al.acknowledged,al.alarm_date,al.alarm_description,al.archive,al.blue_alarm,al.pump_id,al.tank_id,al.time_accepted,
  al.time_retrieved,al.valve_id  FROM alarms al
    left join tanks t 
    using(tank_id)
    left join valves v
    using(valve_id) 
    left join pumps p
    using(pump_id) order by  alarm_active desc ,acknowledged asc ,archive asc ,  alarm_date desc LIMIT 100  ;`;
  let alarmList = [];
  dataFetchingCon.query(`show tables like "alarms";`, function (err, result) {
    if (err) throw err;
    // console.log(result)
    if (result.length > 0) {
      dataFetchingCon.query(query,
        (err, result, fields) => {
          alarmList = result;
          if (alarmList !== undefined) {
            alarmList.map(alarm => {
              if (alarm.archive == 1) {
                alarm['color'] = 4; // Grey Alarm
              }
              if (alarm.alarm_active === 1 && alarm.acknowledged === 0) {
                alarm['color'] = 1;// Red Alarm
              }
              if (alarm.alarm_active === 1 && alarm.acknowledged === 1) {
                alarm['color'] = 2; // Orange Alarm
              }
              if (alarm.blue_alarm === 1) {
                alarm['color'] = 3; // Blue Alarm
              }
              if (alarm.blue_alarm === 1) {
                alarm['alarm_description'] = 'Inactive unaccepted'
              }
              let stralarmDate = alarm.alarm_date.toISOString();
              let dayDateStr = stralarmDate.slice(0, 10)
              let timeDateStr = stralarmDate.slice(11, 19)
              let completeDate = dayDateStr + " " + timeDateStr;
              alarm.alarm_date = completeDate;
              if (alarm.time_accepted !== null) {
                let stralarmDateA = alarm.time_accepted.toISOString();
                let dayDateStrA = stralarmDateA.slice(0, 10)
                let timeDateStrA = stralarmDateA.slice(11, 19)
                let completeDateA = dayDateStrA + " " + timeDateStrA;
                alarm.time_accepted = completeDateA;
              }
              if (alarm.time_retrieved !== null) {
                let stralarmDateA = alarm.time_retrieved.toISOString();
                let dayDateStrA = stralarmDateA.slice(0, 10)
                let timeDateStrA = stralarmDateA.slice(11, 19)
                let completeDateA = dayDateStrA + " " + timeDateStrA;
                alarm.time_retrieved = completeDateA;
              }

            });
            //  alarmList.sort((a, b) => b.color - a.color);
            res.send(alarmList)

          } else {
            res.send("Data base not installed yet.")
          }

        }
      );

    } else {
      console.log('No data base shipMaster yet.')
    }
  });

});// Hundred Alarms ***********************************************************************************

// update Tanks Low limit and High limit ***** update Tanks Low limit and High limit
router.post('/updateTankLAHA', (req, res) => {
  /* {
        "tankId": 1 ,
         "low_alarm_limit":2,
         "high_alarm_limit":4
    }*/
    
    let tank_object =req.body;
    let low_alarm_limit = tank_object.low_alarm_limit;
    let high_alarm_limit = tank_object.high_alarm_limit;
    let tankId = tank_object.tankId;
  //   console.log(valve_id);
     if (typeof low_alarm_limit === 'number' && typeof tankId === 'number' && typeof high_alarm_limit === 'number') {
      webSocket.updateTankSettings(tank_object);          
        res.send('Settings updated.')
     }else{
     //  console.log(req.body); 
     tankId = parseInt(tankId);     
     low_alarm_limit = parseFloat(low_alarm_limit);
     high_alarm_limit = parseFloat(high_alarm_limit);
     tank_object.low_alarm_limit = low_alarm_limit;
     tank_object.high_alarm_limit = high_alarm_limit;
     tank_object.tankId = tankId;
       // console.log(valve_id);
       webSocket.updateTankSettings(tank_object);
       res.send('Density updated.')
     }    

});// update Tanks Low limit and High limit ***** update Tanks Low limit and High limit
// update Tanks Density ***** update Tanks Density ****************************************************
router.post('/updateTankDensity', (req, res) => {
  /* {
        "tankId": 1 ,
         "density":1.6
    }*/
    
     let tank_object =req.body;
    let density = tank_object.density;
    let tankId = tank_object.tankId;
  //   console.log(valve_id);
     if (typeof density === 'number' && typeof tankId === 'number') {
      webSocket.updateTankDensity(tank_object);          
        res.send('Density updated.')
     }else{
     //  console.log(req.body); 
     tankId = parseInt(tankId);
     density = parseFloat(density);
     tank_object.density = density;
     tank_object.tankId = tankId;
       // console.log(valve_id);
       webSocket.updateTankDensity(tank_object);
       res.send('Density updated.')
     }    
  
 });// update Tanks Density ***** update Tanks Density ****************************************************

// Accept Temp Alarms *********************************  Accept Temp Alarms   ******************************************************
router.post('/acceptTempAlarm', (req, res) => {
  /* {
       "tank_id": 10    
   }*/
  //  console.log(req.body); 
  let tank_object = req.body;
  tank_id = tank_object.tank_id;
  //   console.log(tank_id)
  if (typeof tank_id === 'number') {
    levelWebsocket.makeTempAlarmAcknowledged(tank_id).then((result) => {
      if (result === 'Temp Alarm Accepted') {
        res.send(result);
      } else {
        res.send(result);
      }
    });

  } else {

    tank_id = parseInt(tank_id);
    levelWebsocket.makeTempAlarmAcknowledged(tank_id).then((result) => {
      if (result === 'Temp Alarm Accepted') {
        res.send(result);
      } else {
        res.send(result);
      }
    });
  }

});
// Accept Temp Alarms *********************************  Accept Temp Alarms   ******************************************************


// Set Temp limit for a tank *********************************  Set Temp limit fro a tank   ******************************************************
router.post('/setLimitTemp', (req, res) => {
  /* {
       "tank_id": 10 ,
       ""temp_limit"" : 80   
   }*/
  //  console.log(req.body); 
  let tank_object = req.body;
  tank_id = tank_object.tank_id;
  temp_limit = tank_object.temp_limit;

  if (isNaN(tank_id) || isNaN(temp_limit)) {
    res.send('Please send valid data');
  } else {
    tank_id = typeof tank_id === 'number' ? tank_id : parseInt(tank_id);
    temp_limit = typeof temp_limit === 'number' ? temp_limit : parseInt(temp_limit);
    levelWebsocket.setTemperatureLimitForTank(tank_id, temp_limit).then((result) => {
      res.send(result);
    })

  }

});// Set Temp limit for a tank *********************************  Set Temp limit fro a tank   ******************************************************


// Accept Valve alarms **************************
router.post('/acceptValve', (req, res) => {
  /* {
       "valve_id": 10    
   }*/
  //  console.log(req.body); 
  let valve_object = req.body;
  valve_id = valve_object.valve_id;
  //   console.log(valve_id);
  if (typeof valve_id === 'number') {
    webSocket.makeAlarmAcknowledged(valve_id);
    res.send('Alarm Acknowledged..')
  } else {
    console.log(req.body);
    valve_id = parseInt(valve_id);
    // console.log(valve_id);
    webSocket.makeAlarmAcknowledged(valve_id);
    res.send('Alarm Acknowledged..')
  }


});
router.post('/acceptPump', (req, res) => {
  /* {
       "valve_id": 10    
   }*/
  //  console.log(req.body); 
  let pump_object = req.body;
  let pump_id = pump_object.pump_id;
  console.log(pump_id);
  if (typeof pump_id === 'number') {
    pumpWebSocket.makePumpAlarmAcknowledged(pump_id);
    res.send('Alarm Acknowledged..')
  } else {
    console.log(req.body);
    pump_id = parseInt(pump_id);
    // console.log(valve_id);
    pumpWebSocket.makePumpAlarmAcknowledged(pump_id);
    res.send('Alarm Acknowledged..')
  }

});


//Get tanks table
router.get('/tanksTable', (req, res) => {
  let tanksList = [];
  dataFetchingCon.query(
    `select t.tank_id,t.code_name,t.tank_level,t.volume,t.volume_percent,t.weight,t.density,t.low_alarm_limit,t.high_alarm_limit,
    t.low_low_alarm_limit,t.high_high_alarm_limit,t.alarm_name,t.temp_alarm_name
    from   tanks t `,   
     
    (err, result, fields) => {
      tanksList =result;
     
      res.send(tanksList)
    }
  );

});

module.exports = router;