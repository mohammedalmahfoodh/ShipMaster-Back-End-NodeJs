@ECHO OFF
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --protocol=tcp --host=localhost --user=root --password=tyfon --port=3306 --default-character-set=utf8 --comments   < "C:\Users\malm\Desktop\ShipMaster-Back-End\db\Create DataBaseShipMaster.sql"
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --protocol=tcp --host=localhost --user=root --password=tyfon --port=3306 --default-character-set=utf8 --comments --database=ship_master  < "C:\Users\malm\Desktop\ShipMaster-Back-End\db\Create Tables.sql"




echo.
echo.
ECHO Database Wash Master has been initialized...
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.
echo.

PAUSE