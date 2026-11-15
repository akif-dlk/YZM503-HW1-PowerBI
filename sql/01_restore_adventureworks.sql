-- AdventureWorksDW2019 yedeğini SQL Server 2019 (varsayılan örnek) üzerine geri yükler.
-- Yedek dosyası: https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorksDW2019.bak
-- Çalıştırma: sqlcmd -S localhost -E -C -i 01_restore_adventureworks.sql

RESTORE DATABASE AdventureWorksDW2019
FROM DISK = 'C:\AWBackup\AdventureWorksDW2019.bak'
WITH MOVE 'AdventureWorksDW2019'     TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\AdventureWorksDW2019.mdf',
     MOVE 'AdventureWorksDW2019_log' TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\AdventureWorksDW2019_log.ldf',
     REPLACE, STATS = 25;
GO
