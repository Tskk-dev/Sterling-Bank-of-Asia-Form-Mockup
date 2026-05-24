-- Loan Application Schema
-- Final 3NF Design — Revised
-- Generated for MySQL Workbench

CREATE DATABASE IF NOT EXISTS LoanDB;
USE LoanDB;

-- --------------------------------------------------------
-- APPLICATION TABLE
-- --------------------------------------------------------
CREATE TABLE Application (
    ApplicationID           VARCHAR(15)     NOT NULL,
    DateApplication         DATE            NOT NULL,
    ApplicationType         VARCHAR(10)     NOT NULL,
    LoanAmount              DECIMAL(15,2)   NOT NULL,
    LoanTerm                VARCHAR(20)     NOT NULL,
    FullName                VARCHAR(50)     NOT NULL,
    BirthDate               DATE            NOT NULL,
    Age                     INT             DEFAULT NULL,
    Citizenship             VARCHAR(15)     NOT NULL,
    Gender                  CHAR(1)         NOT NULL,
    TIN                     VARCHAR(15)     NOT NULL,
    SSS_GSIS                VARCHAR(15)     NOT NULL,
    MobileNo                VARCHAR(15)     NOT NULL,
    EmailAddress            VARCHAR(50)     NOT NULL,
    EmployerBusinessName    VARCHAR(100)    NOT NULL,
    EmployerBusinessAdd     VARCHAR(255)    NOT NULL,
    EmploymentStatus        VARCHAR(50)     NOT NULL,
    EmploymentYearsStay     INT(2)          NOT NULL,
    PositionTitle           VARCHAR(100)    NOT NULL,
    Country                 VARCHAR(50)     NOT NULL,
    ZipCode                 VARCHAR(10)     NOT NULL,
    BusinessPhoneNo         VARCHAR(15)     NOT NULL,
    PRIMARY KEY (ApplicationID),
    CONSTRAINT chk_gender CHECK (Gender IN ('M', 'F'))
);

-- --------------------------------------------------------
-- ID NUMBERS TABLE (multi-valued — extracted)
-- --------------------------------------------------------
CREATE TABLE IDNumbers (
    IDNumberID      INT             NOT NULL AUTO_INCREMENT,
    ApplicationID   VARCHAR(15)     NOT NULL,
    IDNumber        VARCHAR(30)     NOT NULL,
    PRIMARY KEY (IDNumberID),
    CONSTRAINT fk_idnumber_application
        FOREIGN KEY (ApplicationID) REFERENCES Application(ApplicationID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --------------------------------------------------------
-- EMPLOYEE TABLE
-- --------------------------------------------------------
CREATE TABLE Employee (
    EmployeeID          VARCHAR(15)     NOT NULL,
    ApplicationID       VARCHAR(15)     NOT NULL,
    DateHired           DATE            NOT NULL,
    DateRegularized     DATE            NOT NULL,
    BasicIncome         DECIMAL(15,2)   NOT NULL,
    FixedAllowances     DECIMAL(15,2)   NOT NULL,
    LessDeductions      DECIMAL(15,2)   NOT NULL,
    NetPay              DECIMAL(15,2)   NOT NULL,
    AveOTCommissions    DECIMAL(15,2)   NOT NULL,
    NetTakeHomePay      DECIMAL(15,2)   NOT NULL,
    PRIMARY KEY (EmployeeID),
    CONSTRAINT fk_employee_application
        FOREIGN KEY (ApplicationID) REFERENCES Application(ApplicationID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --------------------------------------------------------
-- REFERENCE TABLE
-- --------------------------------------------------------
CREATE TABLE `Reference` (
    ReferenceID         VARCHAR(20)     NOT NULL,
    ApplicationID       VARCHAR(15)     NOT NULL,
    ReferenceFullName   VARCHAR(100)    NOT NULL,
    ReferencesRS        VARCHAR(50)     NOT NULL,
    ReferencePhoneNo    VARCHAR(15)     NOT NULL,
    ReferenceEmail      VARCHAR(50)     NOT NULL,
    PRIMARY KEY (ReferenceID),
    CONSTRAINT fk_reference_application
        FOREIGN KEY (ApplicationID) REFERENCES Application(ApplicationID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --------------------------------------------------------
-- DEPENDENT TABLE
-- --------------------------------------------------------
CREATE TABLE Dependent (
    DependentID         VARCHAR(20)     NOT NULL,
    ApplicationID       VARCHAR(15)     NOT NULL,
    DependentsName      VARCHAR(100)    NOT NULL,
    TotalNoDependents   INT             NOT NULL,
    PRIMARY KEY (DependentID),
    CONSTRAINT fk_dependent_application
        FOREIGN KEY (ApplicationID) REFERENCES Application(ApplicationID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- --------------------------------------------------------
-- SAMPLE DATA
-- --------------------------------------------------------

INSERT INTO Application (ApplicationID, DateApplication, ApplicationType, LoanAmount, LoanTerm, FullName, BirthDate, Citizenship, Gender, TIN, SSS_GSIS, MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd, EmploymentStatus, EmploymentYearsStay, PositionTitle, Country, ZipCode, BusinessPhoneNo) VALUES
('APP-001', '2026-04-13', 'New',  50000.00, '5', 'Ryan Lang',  '2000-02-19', 'Filipino', 'M', '10239142',    '4129851234',  '09675540209', 'six7@gmail.com',        'Krusty Krab', 'Bikini Bottom',  'Regular', 5, 'Chef',    'Philippines', '1167', '09826751231'),
('APP-002', '2018-02-14', 'New',  75000.00, '3', 'Mark Lee',   '1999-06-12', 'Filipino', 'M', '13084258',    '4580284025',  '09123456789', 'leemarklee@gmail.com',  'SM',          'New York, Cubao', 'Regular', 1, 'Manager', 'Philippines', '1116', '09772221234'),
('APP-003', '2007-04-20', 'Old', 100000.00, '6', 'Kim Mingyu', '1997-04-06', 'Filipino', 'M', '141248109402','41980248123', '09920568432', 'minwon@gmail.com',      'Hybe',        'Hybe QC',         'Regular', 1, 'Rapper',  'Philippines', '1717', '09124156767');

INSERT INTO IDNumbers (ApplicationID, IDNumber) VALUES
('APP-001', '123124'),
('APP-002', '458732'),
('APP-003', '141581');

INSERT INTO Employee (EmployeeID, ApplicationID, DateHired, DateRegularized, BasicIncome, FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay) VALUES
('1421841', 'APP-001', '2021-05-16', '2024-01-01', 25000.00, 10000.00, 5000.00, 15000.00,  4000.00, 120000.00),
('2308141', 'APP-002', '2025-03-14', '2025-05-09', 35000.00, 20000.00, 7000.00, 14000.00,  9000.00,  80000.00),
('512534',  'APP-003', '2015-06-01', '2018-10-05', 50000.00, 36000.00, 9000.00, 20000.00, 16000.00, 100000.00);

INSERT INTO `Reference` (ReferenceID, ApplicationID, ReferenceFullName, ReferencesRS, ReferencePhoneNo, ReferenceEmail) VALUES
('REF001-1', 'APP-001', 'Mister Krabs', 'Boss',      '09566794322', 'Krabsgotabs@gmail.com'),
('REF001-2', 'APP-001', 'Squidward',    'Colleague', '09556235001', 'squiddlyward@gmail.com'),
('REF001-3', 'APP-001', 'Patrick',      'Friend',    '09875428897', 'patrickstar@gmail.com'),
('REF002-1', 'APP-002', 'Park Jisung',  'Sibling',   '09275312085', 'parkjisong@gmail.com'),
('REF002-2', 'APP-002', 'Lee Dino',     'Sibling',   '09124124577', 'dinothedinosaur@gmail.com'),
('REF002-3', 'APP-002', 'Ji Changmin',  'Friend',    '09218548127', 'jijijujuonthatbeat@gmail.com'),
('REF003-1', 'APP-003', 'S.Coups',      'Colleague', '09441639085', 'jeongcheolforevs@gmail.com'),
('REF003-2', 'APP-003', 'Xu Minghao',   'Colleague', '09558972202', 'nihaoxuminghao@gmail.com'),
('REF003-3', 'APP-003', 'Vernon Chwe',  'Sibling',   '09885675244', 'vernonimnida@gmail.com');

INSERT INTO Dependent (DependentID, ApplicationID, DependentsName, TotalNoDependents) VALUES
('DEP001-1', 'APP-001', 'Kim Minjeong',  2),
('DEP001-2', 'APP-001', 'Yoo Jimin',     2),
('DEP002-1', 'APP-002', 'Kim Sunwoo',    2),
('DEP002-2', 'APP-002', 'Lee Haechan',   2),
('DEP003-1', 'APP-003', 'Jeon Wonwoo',   2),
('DEP003-2', 'APP-003', 'Yoon Jeonghan', 2);