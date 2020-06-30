 CREATE TABLE IF NOT EXISTS valves (
  valve_id int NOT NULL ,
  valve_name varchar(50),
  valve_type int  DEFAULT 0,
  valve_subtype int DEFAULT 0,
  errorTimeout int DEFAULT 0,  
  PRIMARY KEY (valve_id));
  
  CREATE TABLE IF NOT EXISTS pumps (
  pump_id int NOT NULL ,
  pump_type int  DEFAULT 0,
  pump_subtype int DEFAULT 0,
  errorTimeout int DEFAULT 0,  
  PRIMARY KEY (pump_id));
  
  CREATE TABLE IF NOT EXISTS tanks (
    tank_id int(11) NOT NULL ,
    code_name varchar(100) DEFAULT NULL, 
    alarm_name varchar(25) DEFAULT NULL,  
    temp_alarm_name varchar(25) DEFAULT NULL, 
    tank_level float DEFAULT NULL,
    tank_temperature float DEFAULT 0.0,
    volume float DEFAULT NULL,
    max_volume float DEFAULT NULL,
    volume_percent float DEFAULT NULL,
    weight float DEFAULT NULL,
    density float DEFAULT NULL,
    low_alarm_limit float DEFAULT NULL,
    low_low_alarm_limit float DEFAULT NULL,
    high_alarm_limit float DEFAULT NULL,
    high_high_alarm_limit float DEFAULT NULL,
    PRIMARY KEY (Tank_id)
  );
  
  CREATE TABLE IF NOT EXISTS alarms (
  alarm_id int(11) NOT NULL AUTO_INCREMENT,
  alarm_name varchar(70) DEFAULT NULL,
  temp_alarm tinyint(1) DEFAULT NULL,
  tank_id int(11) DEFAULT NULL,
  valve_id int(11) DEFAULT NULL,
  pump_id int(11) DEFAULT NULL,
  alarm_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged tinyint(1) DEFAULT NULL,
  alarm_description varchar(255) DEFAULT NULL,
  alarm_active boolean default true,
  level_alarm int(11) DEFAULT NULL,
  time_accepted timestamp  DEFAULT null,
  time_retrieved timestamp  DEFAULT null,
  blue_alarm boolean default false,
  valve_status int DEFAULT NULL,
  pump_status int DEFAULT NULL,
  PRIMARY KEY (alarm_id),  
  KEY tank_id (tank_id), 
  KEY valve_id (valve_id),
  KEY pump_id (valve_id),
  archive tinyint(1) DEFAULT 0,
  FOREIGN KEY (tank_id) REFERENCES tanks (tank_id) ON DELETE CASCADE,
  FOREIGN KEY (valve_id) REFERENCES valves (valve_id) ON DELETE CASCADE,
  FOREIGN KEY (pump_id) REFERENCES pumps (pump_id) ON DELETE CASCADE
);











