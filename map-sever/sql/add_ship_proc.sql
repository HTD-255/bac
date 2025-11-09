-- SQL script: create Ships table (if missing) and stored procedure AddShip
-- Adjust schema/table names as needed for your database.

IF OBJECT_ID('dbo.Ships', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ships (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Ten_Chu_Tau NVARCHAR(200) NULL,
        Ten_Thuyen_Truong NVARCHAR(200) NULL,
        So_Dang_Ki_Tau NVARCHAR(100) NULL,
        Chieu_Dai_Tau NVARCHAR(100) NULL,
        Tong_Cong_Suat NVARCHAR(100) NULL,
        So_Giay_Phep NVARCHAR(100) NULL,
        Thoi_Han NVARCHAR(100) NULL,
        Cang_Di NVARCHAR(100) NULL,
        Cang_Ve NVARCHAR(100) NULL,
        Vao_So NVARCHAR(100) NULL,
        CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Drop proc if exists (safe for iterative development)
IF OBJECT_ID('dbo.AddShip', 'P') IS NOT NULL
    DROP PROCEDURE dbo.AddShip;
GO

CREATE PROCEDURE dbo.AddShip
    @ten_chu_tau NVARCHAR(200) = NULL,
    @ten_thuyen_truong NVARCHAR(200) = NULL,
    @so_dang_ki_tau NVARCHAR(100) = NULL,
    @chieu_dai_tau NVARCHAR(100) = NULL,
    @tong_cong_suat NVARCHAR(100) = NULL,
    @so_giay_phep NVARCHAR(100) = NULL,
    @thoi_han NVARCHAR(100) = NULL,
    @cang_di NVARCHAR(100) = NULL,
    @cang_ve NVARCHAR(100) = NULL,
    @vao_so NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Ships (
        Ten_Chu_Tau, Ten_Thuyen_Truong, So_Dang_Ki_Tau,
        Chieu_Dai_Tau, Tong_Cong_Suat, So_Giay_Phep,
        Thoi_Han, Cang_Di, Cang_Ve, Vao_So
    )
    VALUES (
        @ten_chu_tau, @ten_thuyen_truong, @so_dang_ki_tau,
        @chieu_dai_tau, @tong_cong_suat, @so_giay_phep,
        @thoi_han, @cang_di, @cang_ve, @vao_so
    );

    -- Return the new ID as a single-row resultset
    SELECT SCOPE_IDENTITY() AS NewShipId;
END
GO
