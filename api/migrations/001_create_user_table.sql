IF NOT EXISTS (
SELECT 1
FROM sys.tables
WHERE name = 'users' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.[users]
    (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        fullName NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        phone NVARCHAR(20) NULL,
        address NVARCHAR(255) NULL,
        isActive BIT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO
