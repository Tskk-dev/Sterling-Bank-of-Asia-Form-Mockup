import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Connection Pool ──────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3000,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'LoanDB',
  waitForConnections: true,
  connectionLimit: 10,
});

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── AUTH ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM Users WHERE Username = ? AND Password = ?',
      [username, password]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }
    res.json({
      userID:        user.UserID,
      username:      user.Username,
      role:          user.Role,
      applicationID: user.ApplicationID ?? null,
    });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ message: e.message || 'Database error' });
  }
});

// ── Stats ────────────────────────────────────────────────────────────
app.get('/api/stats', async (_, res) => {
  try {
    const [[row]]: any = await pool.query(`
      SELECT
        COUNT(*)                     AS total,
        SUM(LoanAmount)              AS totalLoan,
        SUM(ApplicationType = 'New') AS newApps,
        SUM(ApplicationType = 'Old') AS oldApps
      FROM Application
    `);
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET all applications ─────────────────────────────────────────────
app.get('/api/applications', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Application ORDER BY DateApplication DESC');
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET single application (with all related data) ───────────────────
app.get('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[app]]: any      = await pool.query('SELECT * FROM Application WHERE ApplicationID = ?', [id]);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const [idNumbers]: any  = await pool.query('SELECT * FROM IDNumbers   WHERE ApplicationID = ?', [id]);
    const [[employee]]: any = await pool.query('SELECT * FROM Employee    WHERE ApplicationID = ?', [id]);
    const [references]: any = await pool.query('SELECT * FROM `Reference` WHERE ApplicationID = ?', [id]);
    const [dependents]: any = await pool.query('SELECT * FROM Dependent   WHERE ApplicationID = ?', [id]);

    res.json({ ...app, idNumbers, employee: employee ?? null, references, dependents });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST create application ──────────────────────────────────────────
app.post('/api/applications', async (req, res) => {
  const { application, idNumbers, employee, references, dependents } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      INSERT INTO Application
        (ApplicationID, DateApplication, ApplicationType, LoanAmount, LoanTerm,
         FullName, BirthDate, Citizenship, Gender, TIN, SSS_GSIS,
         MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd,
         EmploymentStatus, EmploymentYearsStay, PositionTitle, Country, ZipCode, BusinessPhoneNo)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        application.ApplicationID, application.DateApplication, application.ApplicationType,
        application.LoanAmount,    application.LoanTerm,        application.FullName,
        application.BirthDate,     application.Citizenship,     application.Gender,
        application.TIN,           application.SSS_GSIS,        application.MobileNo,
        application.EmailAddress,  application.EmployerBusinessName, application.EmployerBusinessAdd,
        application.EmploymentStatus, application.EmploymentYearsStay, application.PositionTitle,
        application.Country, application.ZipCode, application.BusinessPhoneNo,
      ]
    );

    for (const id of idNumbers ?? []) {
      await conn.query('INSERT INTO IDNumbers (ApplicationID, IDNumber) VALUES (?,?)',
        [application.ApplicationID, id.IDNumber]);
    }

    if (employee?.EmployeeID) {
      await conn.query(`
        INSERT INTO Employee
          (EmployeeID, ApplicationID, DateHired, DateRegularized, BasicIncome,
           FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [employee.EmployeeID, application.ApplicationID, employee.DateHired,
         employee.DateRegularized, employee.BasicIncome, employee.FixedAllowances,
         employee.LessDeductions, employee.NetPay, employee.AveOTCommissions, employee.NetTakeHomePay]
      );
    }

    for (const ref of references ?? []) {
      await conn.query(`
        INSERT INTO \`Reference\`
          (ReferenceID, ApplicationID, ReferenceFullName, ReferencesRS, ReferencePhoneNo, ReferenceEmail)
        VALUES (?,?,?,?,?,?)`,
        [ref.ReferenceID, application.ApplicationID, ref.ReferenceFullName,
         ref.ReferencesRS, ref.ReferencePhoneNo, ref.ReferenceEmail]
      );
    }

    for (const dep of dependents ?? []) {
      await conn.query(`
        INSERT INTO Dependent (DependentID, ApplicationID, DependentsName, TotalNoDependents)
        VALUES (?,?,?,?)`,
        [dep.DependentID, application.ApplicationID, dep.DependentsName, dep.TotalNoDependents]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Application created', id: application.ApplicationID });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ── PUT update application ───────────────────────────────────────────
app.put('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { application, idNumbers, employee, references, dependents } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      UPDATE Application SET
        DateApplication=?, ApplicationType=?, LoanAmount=?, LoanTerm=?,
        FullName=?, BirthDate=?, Citizenship=?, Gender=?, TIN=?, SSS_GSIS=?,
        MobileNo=?, EmailAddress=?, EmployerBusinessName=?, EmployerBusinessAdd=?,
        EmploymentStatus=?, EmploymentYearsStay=?, PositionTitle=?, Country=?,
        ZipCode=?, BusinessPhoneNo=?
      WHERE ApplicationID=?`,
      [
        application.DateApplication, application.ApplicationType, application.LoanAmount,
        application.LoanTerm,        application.FullName,        application.BirthDate,
        application.Citizenship,     application.Gender,          application.TIN,
        application.SSS_GSIS,        application.MobileNo,        application.EmailAddress,
        application.EmployerBusinessName, application.EmployerBusinessAdd,
        application.EmploymentStatus, application.EmploymentYearsStay, application.PositionTitle,
        application.Country, application.ZipCode, application.BusinessPhoneNo, id,
      ]
    );

    await conn.query('DELETE FROM IDNumbers WHERE ApplicationID=?', [id]);
    for (const n of idNumbers ?? []) {
      await conn.query('INSERT INTO IDNumbers (ApplicationID, IDNumber) VALUES (?,?)', [id, n.IDNumber]);
    }

    if (employee?.EmployeeID) {
      await conn.query(`
        INSERT INTO Employee
          (EmployeeID, ApplicationID, DateHired, DateRegularized, BasicIncome,
           FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          DateHired=VALUES(DateHired), DateRegularized=VALUES(DateRegularized),
          BasicIncome=VALUES(BasicIncome), FixedAllowances=VALUES(FixedAllowances),
          LessDeductions=VALUES(LessDeductions), NetPay=VALUES(NetPay),
          AveOTCommissions=VALUES(AveOTCommissions), NetTakeHomePay=VALUES(NetTakeHomePay)`,
        [employee.EmployeeID, id, employee.DateHired, employee.DateRegularized,
         employee.BasicIncome, employee.FixedAllowances, employee.LessDeductions,
         employee.NetPay, employee.AveOTCommissions, employee.NetTakeHomePay]
      );
    }

    await conn.query('DELETE FROM `Reference` WHERE ApplicationID=?', [id]);
    for (const ref of references ?? []) {
      await conn.query(`
        INSERT INTO \`Reference\`
          (ReferenceID, ApplicationID, ReferenceFullName, ReferencesRS, ReferencePhoneNo, ReferenceEmail)
        VALUES (?,?,?,?,?,?)`,
        [ref.ReferenceID, id, ref.ReferenceFullName, ref.ReferencesRS, ref.ReferencePhoneNo, ref.ReferenceEmail]
      );
    }

    await conn.query('DELETE FROM Dependent WHERE ApplicationID=?', [id]);
    for (const dep of dependents ?? []) {
      await conn.query(`
        INSERT INTO Dependent (DependentID, ApplicationID, DependentsName, TotalNoDependents)
        VALUES (?,?,?,?)`,
        [dep.DependentID, id, dep.DependentsName, dep.TotalNoDependents]
      );
    }

    await conn.commit();
    res.json({ message: 'Application updated' });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ── DELETE application ───────────────────────────────────────────────
app.delete('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM Dependent   WHERE ApplicationID=?', [id]);
    await conn.query('DELETE FROM `Reference` WHERE ApplicationID=?', [id]);
    await conn.query('DELETE FROM Employee    WHERE ApplicationID=?', [id]);
    await conn.query('DELETE FROM IDNumbers   WHERE ApplicationID=?', [id]);
    await conn.query('DELETE FROM Application WHERE ApplicationID=?', [id]);
    await conn.commit();
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ── Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
