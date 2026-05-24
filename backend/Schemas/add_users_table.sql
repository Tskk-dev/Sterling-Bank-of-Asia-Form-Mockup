-- --------------------------------------------------------
-- ADD TO YOUR EXISTING loan_schema.sql
-- Run this after your existing schema is already imported
-- --------------------------------------------------------

USE LoanDB;

-- --------------------------------------------------------
-- USERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
    UserID          INT             NOT NULL AUTO_INCREMENT,
    Username        VARCHAR(50)     NOT NULL UNIQUE,
    Password        VARCHAR(100)    NOT NULL,
    Role            ENUM('admin','user') NOT NULL DEFAULT 'user',
    ApplicationID   VARCHAR(15)     NULL,   -- linked app for 'user' role (NULL for admins)
    CreatedAt       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID),
    CONSTRAINT fk_user_application
        FOREIGN KEY (ApplicationID) REFERENCES Application(ApplicationID)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- --------------------------------------------------------
-- SAMPLE ACCOUNTS
-- admin can see everything / do everything
-- users are each linked to one of the sample applications
-- --------------------------------------------------------
INSERT INTO Users (Username, Password, Role, ApplicationID) VALUES
('admin',    'admin123',   'admin', NULL),
('ryanlang', 'ryan123',    'user',  'APP-001'),
('marklee',  'mark123',    'user',  'APP-002'),
('kimmingyu','kim123',     'user',  'APP-003');
