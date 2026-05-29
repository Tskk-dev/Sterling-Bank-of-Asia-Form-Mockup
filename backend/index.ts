import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'LoanDB',
  waitForConnections: true,
  connectionLimit: 10,
});

function isBlank(value: any) {
  return value === undefined || value === null || String(value).trim() === '';
}

function missingFields(obj: any, fields: string[]) {
  return fields.filter((field) => isBlank(obj?.[field]));
}

function isValidNumber(value: any) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getAuth(req: express.Request) {
  const roleHeader = String(req.headers['x-user-role'] ?? '').toLowerCase();
  const idHeader = String(req.headers['x-user-id'] ?? '').trim();
  const userID = idHeader ? Number(idHeader) : null;
  return {
    role: roleHeader || null,
    userID: Number.isFinite(userID) ? userID : null,
  };
}

// ── Health ───────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── Auth ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password are required.' });
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM Users WHERE Username = ? AND Password = ?',
      [username, password]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Incorrect username or password.' });
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

// ── Stats ─────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const auth = getAuth(req);
  if (auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  try {
    const [rows]: any = await pool.query(`
      SELECT
        COUNT(*)                     AS total,
        SUM(LoanAmount)              AS totalLoan,
        SUM(ApplicationType = 'New') AS newApps,
        SUM(ApplicationType = 'Old') AS oldApps
      FROM Application
    `);
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET all applications ──────────────────────────────────────────────
app.get('/api/applications', async (req, res) => {
  const auth = getAuth(req);
  if (auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  try {
    const [rows] = await pool.query('SELECT * FROM Application ORDER BY DateApplication DESC');
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── GET single application (all related data) ─────────────────────────
app.get('/api/applications/:id', async (req, res) => {
  const auth = getAuth(req);
  const id = Number(req.params.id);
  if (!auth.role) return res.status(401).json({ message: 'Not authenticated.' });
  try {
    if (auth.role !== 'admin') {
      if (!auth.userID) return res.status(403).json({ message: 'User access required.' });
      const [users]: any = await pool.query('SELECT ApplicationID FROM Users WHERE UserID = ?', [auth.userID]);
      if (!users[0] || Number(users[0].ApplicationID) !== id) {
        return res.status(403).json({ message: 'You can only access your own application.' });
      }
    }
    const [apps]: any      = await pool.query('SELECT * FROM Application WHERE ApplicationID = ?', [id]);
    if (!apps[0]) return res.status(404).json({ message: 'Application not found' });

    const [idNumbers]: any  = await pool.query('SELECT * FROM IDNumbers   WHERE ApplicationID = ?', [id]);
    const [employees]: any  = await pool.query('SELECT * FROM Employee    WHERE ApplicationID = ?', [id]);
    const [references]: any = await pool.query('SELECT * FROM `Reference` WHERE ApplicationID = ?', [id]);
    const [dependents]: any = await pool.query('SELECT * FROM Dependent   WHERE ApplicationID = ?', [id]);

    res.json({
      ...apps[0],
      idNumbers,
      employee:   employees[0] ?? null,
      references,
      dependents,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── POST create application ───────────────────────────────────────────
app.post('/api/applications', async (req, res) => {
  const auth = getAuth(req);
  if (!auth.role) return res.status(401).json({ message: 'Not authenticated.' });
  const { application, idNumbers, employee, references, dependents, userID } = req.body;
  if (auth.role !== 'admin') {
    if (!auth.userID || Number(userID) !== auth.userID) {
      return res.status(403).json({ message: 'You can only submit your own application.' });
    }
  }
  const requiredApplicationFields = [
    'DateApplication', 'ApplicationType', 'LoanAmount', 'LoanTerm',
    'FullName', 'BirthDate', 'Citizenship', 'Gender', 'TIN', 'SSS_GSIS',
    'MobileNo', 'EmailAddress', 'EmployerBusinessName', 'EmployerBusinessAdd',
    'EmploymentStatus', 'EmploymentYearsStay', 'PositionTitle', 'Country',
    'ZipCode', 'BusinessPhoneNo',
  ];
  const missing = missingFields(application, requiredApplicationFields);
  if (missing.length) {
    return res.status(400).json({ message: `Missing required application fields: ${missing.join(', ')}` });
  }
  if (!isValidNumber(application.LoanAmount) || application.LoanAmount <= 0) {
    return res.status(400).json({ message: 'LoanAmount must be a valid number.' });
  }
  if (!Array.isArray(idNumbers) || idNumbers.filter((n: any) => !isBlank(n?.IDNumber)).length === 0) {
    return res.status(400).json({ message: 'At least one ID number is required.' });
  }
  if (!employee) {
    return res.status(400).json({ message: 'Employee payroll details are required.' });
  }
  const missingEmployee = missingFields(employee, [
    'DateHired', 'DateRegularized', 'BasicIncome', 'FixedAllowances',
    'LessDeductions', 'NetPay', 'AveOTCommissions', 'NetTakeHomePay',
  ]);
  if (missingEmployee.length) {
    return res.status(400).json({ message: `Missing required payroll fields: ${missingEmployee.join(', ')}` });
  }
  if (!Array.isArray(references) || references.length < 3) {
    return res.status(400).json({ message: 'At least three references are required.' });
  }
  if (references.some((ref: any) => missingFields(ref, ['ReferenceFullName', 'ReferencesRS', 'ReferencePhoneNo', 'ReferenceEmail']).length)) {
    return res.status(400).json({ message: 'Each reference must include full name, relationship, phone, and email.' });
  }
  if (!Array.isArray(dependents) || dependents.filter((d: any) => !isBlank(d?.DependentsName)).length === 0) {
    return res.status(400).json({ message: 'At least one dependent is required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (userID) {
      const [users]: any = await conn.query('SELECT ApplicationID FROM Users WHERE UserID = ?', [userID]);
      if (!users[0]) {
        await conn.rollback();
        return res.status(400).json({ message: 'User account not found for this application.' });
      }
      if (application.ApplicationType === 'New' && users[0].ApplicationID) {
        await conn.rollback();
        return res.status(409).json({ message: 'Borrower has an existing unpaid loan and cannot apply for a new one.' });
      }
    }

    // Insert application — let DB generate the ID
    const [result]: any = await conn.query(`
      INSERT INTO Application
        (DateApplication, ApplicationType, LoanAmount, LoanTerm,
         FullName, BirthDate, Age, Citizenship, Gender, TIN, SSS_GSIS,
         MobileNo, EmailAddress, EmployerBusinessName, EmployerBusinessAdd,
         EmploymentStatus, EmploymentYearsStay, PositionTitle, Country, ZipCode, BusinessPhoneNo)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        application.DateApplication, application.ApplicationType,
        application.LoanAmount,      application.LoanTerm,
        application.FullName,        application.BirthDate,
        application.Age ?? null,     application.Citizenship,
        application.Gender,          application.TIN,
        application.SSS_GSIS,        application.MobileNo,
        application.EmailAddress,    application.EmployerBusinessName,
        application.EmployerBusinessAdd, application.EmploymentStatus,
        application.EmploymentYearsStay, application.PositionTitle,
        application.Country,         application.ZipCode,
        application.BusinessPhoneNo,
      ]
    );

    const newID = result.insertId;

    for (const id of idNumbers ?? []) {
      await conn.query('INSERT INTO IDNumbers (ApplicationID, IDNumber) VALUES (?,?)', [newID, id.IDNumber]);
    }

    if (employee) {
      await conn.query(`
        INSERT INTO Employee
          (ApplicationID, DateHired, DateRegularized, BasicIncome,
           FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [newID, employee.DateHired, employee.DateRegularized,
         employee.BasicIncome, employee.FixedAllowances, employee.LessDeductions,
         employee.NetPay, employee.AveOTCommissions, employee.NetTakeHomePay]
      );
    }

    for (const ref of references ?? []) {
      await conn.query(`
        INSERT INTO \`Reference\`
          (ApplicationID, ReferenceFullName, ReferencesRS, ReferencePhoneNo, ReferenceEmail)
        VALUES (?,?,?,?,?)`,
        [newID, ref.ReferenceFullName, ref.ReferencesRS, ref.ReferencePhoneNo, ref.ReferenceEmail]
      );
    }

    for (const dep of dependents ?? []) {
      await conn.query(`
        INSERT INTO Dependent (ApplicationID, DependentsName, TotalNoDependents)
        VALUES (?,?,?)`,
        [newID, dep.DependentsName, dep.TotalNoDependents]
      );
    }

    if (userID) {
      await conn.query('UPDATE Users SET ApplicationID=? WHERE UserID=?', [newID, userID]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Application created', id: newID });
  } catch (e: any) {
    await conn.rollback();
    console.error('Create error:', e);
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ── PUT update application ────────────────────────────────────────────
app.put('/api/applications/:id', async (req, res) => {
  const auth = getAuth(req);
  if (auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const id = Number(req.params.id);
  const { application, idNumbers, employee, references, dependents } = req.body;
  const requiredApplicationFields = [
    'DateApplication', 'ApplicationType', 'LoanAmount', 'LoanTerm',
    'FullName', 'BirthDate', 'Citizenship', 'Gender', 'TIN', 'SSS_GSIS',
    'MobileNo', 'EmailAddress', 'EmployerBusinessName', 'EmployerBusinessAdd',
    'EmploymentStatus', 'EmploymentYearsStay', 'PositionTitle', 'Country',
    'ZipCode', 'BusinessPhoneNo',
  ];
  const missing = missingFields(application, requiredApplicationFields);
  if (missing.length) {
    return res.status(400).json({ message: `Missing required application fields: ${missing.join(', ')}` });
  }
  if (!isValidNumber(application.LoanAmount) || application.LoanAmount <= 0) {
    return res.status(400).json({ message: 'LoanAmount must be a valid number.' });
  }
  if (!Array.isArray(idNumbers) || idNumbers.filter((n: any) => !isBlank(n?.IDNumber)).length === 0) {
    return res.status(400).json({ message: 'At least one ID number is required.' });
  }
  if (!employee) {
    return res.status(400).json({ message: 'Employee payroll details are required.' });
  }
  const missingEmployee = missingFields(employee, [
    'DateHired', 'DateRegularized', 'BasicIncome', 'FixedAllowances',
    'LessDeductions', 'NetPay', 'AveOTCommissions', 'NetTakeHomePay',
  ]);
  if (missingEmployee.length) {
    return res.status(400).json({ message: `Missing required payroll fields: ${missingEmployee.join(', ')}` });
  }
  if (!Array.isArray(references) || references.length < 3) {
    return res.status(400).json({ message: 'At least three references are required.' });
  }
  if (references.some((ref: any) => missingFields(ref, ['ReferenceFullName', 'ReferencesRS', 'ReferencePhoneNo', 'ReferenceEmail']).length)) {
    return res.status(400).json({ message: 'Each reference must include full name, relationship, phone, and email.' });
  }
  if (!Array.isArray(dependents) || dependents.filter((d: any) => !isBlank(d?.DependentsName)).length === 0) {
    return res.status(400).json({ message: 'At least one dependent is required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      UPDATE Application SET
        DateApplication=?, ApplicationType=?, LoanAmount=?, LoanTerm=?,
        FullName=?, BirthDate=?, Age=?, Citizenship=?, Gender=?, TIN=?, SSS_GSIS=?,
        MobileNo=?, EmailAddress=?, EmployerBusinessName=?, EmployerBusinessAdd=?,
        EmploymentStatus=?, EmploymentYearsStay=?, PositionTitle=?, Country=?,
        ZipCode=?, BusinessPhoneNo=?
      WHERE ApplicationID=?`,
      [
        application.DateApplication, application.ApplicationType,
        application.LoanAmount,      application.LoanTerm,
        application.FullName,        application.BirthDate,
        application.Age ?? null,     application.Citizenship,
        application.Gender,          application.TIN,
        application.SSS_GSIS,        application.MobileNo,
        application.EmailAddress,    application.EmployerBusinessName,
        application.EmployerBusinessAdd, application.EmploymentStatus,
        application.EmploymentYearsStay, application.PositionTitle,
        application.Country,         application.ZipCode,
        application.BusinessPhoneNo, id,
      ]
    );

    // Replace ID numbers
    await conn.query('DELETE FROM IDNumbers WHERE ApplicationID=?', [id]);
    for (const n of idNumbers ?? []) {
      await conn.query('INSERT INTO IDNumbers (ApplicationID, IDNumber) VALUES (?,?)', [id, n.IDNumber]);
    }

    // Upsert employee
    if (employee) {
      const [existing]: any = await conn.query('SELECT EmployeeID FROM Employee WHERE ApplicationID=?', [id]);
      if (existing[0]) {
        await conn.query(`
          UPDATE Employee SET
            DateHired=?, DateRegularized=?, BasicIncome=?, FixedAllowances=?,
            LessDeductions=?, NetPay=?, AveOTCommissions=?, NetTakeHomePay=?
          WHERE ApplicationID=?`,
          [employee.DateHired, employee.DateRegularized, employee.BasicIncome,
           employee.FixedAllowances, employee.LessDeductions, employee.NetPay,
           employee.AveOTCommissions, employee.NetTakeHomePay, id]
        );
      } else {
        await conn.query(`
          INSERT INTO Employee
            (ApplicationID, DateHired, DateRegularized, BasicIncome,
             FixedAllowances, LessDeductions, NetPay, AveOTCommissions, NetTakeHomePay)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [id, employee.DateHired, employee.DateRegularized, employee.BasicIncome,
           employee.FixedAllowances, employee.LessDeductions, employee.NetPay,
           employee.AveOTCommissions, employee.NetTakeHomePay]
        );
      }
    }

    // Replace references
    await conn.query('DELETE FROM `Reference` WHERE ApplicationID=?', [id]);
    for (const ref of references ?? []) {
      await conn.query(`
        INSERT INTO \`Reference\`
          (ApplicationID, ReferenceFullName, ReferencesRS, ReferencePhoneNo, ReferenceEmail)
        VALUES (?,?,?,?,?)`,
        [id, ref.ReferenceFullName, ref.ReferencesRS, ref.ReferencePhoneNo, ref.ReferenceEmail]
      );
    }

    // Replace dependents
    await conn.query('DELETE FROM Dependent WHERE ApplicationID=?', [id]);
    for (const dep of dependents ?? []) {
      await conn.query(`
        INSERT INTO Dependent (ApplicationID, DependentsName, TotalNoDependents)
        VALUES (?,?,?)`,
        [id, dep.DependentsName, dep.TotalNoDependents]
      );
    }

    await conn.commit();
    res.json({ message: 'Application updated' });
  } catch (e: any) {
    await conn.rollback();
    console.error('Update error:', e);
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// ── DELETE application ────────────────────────────────────────────────
app.delete('/api/applications/:id', async (req, res) => {
  const auth = getAuth(req);
  if (auth.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const id = Number(req.params.id);
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

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
