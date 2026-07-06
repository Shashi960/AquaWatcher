const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCollection } = require('./db');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('./middleware/auth');

const router = express.Router();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  ward: user.ward,
  address: user.address,
  role: user.role
});

const createToken = (user) => jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: '7d' });

// Aadhaar-linked number check. Only records in the local verified registry can register.
router.post('/auth/verify-phone', async (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit Aadhaar-linked mobile number.' });
  }

  const resident = await getCollection('verifiedResidents').findOne({ phone });
  if (!resident) {
    return res.status(404).json({ message: 'This number is not present in the Aadhaar-verified ward register. Registration is not allowed.' });
  }

  const alreadyRegistered = await getCollection('users').findOne({ phone });
  if (alreadyRegistered) {
    return res.status(409).json({ message: 'This Aadhaar-linked mobile number is already registered. Please sign in.' });
  }

  res.json({ verified: true, resident: { name: resident.name, phone: resident.phone, ward: resident.ward, address: resident.address } });
});

router.post('/auth/register', async (req, res) => {
  const { phone, email, password } = req.body;
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (!normalizedPhone || !email || !password) {
    return res.status(400).json({ message: 'Phone number, email, and password are required.' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters.' });

  const residents = getCollection('verifiedResidents');
  const resident = await residents.findOne({ phone: normalizedPhone });
  if (!resident) return res.status(403).json({ message: 'Only Aadhaar-verified residents can register.' });

  const users = getCollection('users');
  if (await users.findOne({ phone: normalizedPhone })) return res.status(409).json({ message: 'This mobile number is already registered.' });
  if (await users.findOne({ email: String(email).toLowerCase() })) return res.status(409).json({ message: 'This email is already registered.' });

  const user = {
    name: resident.name,
    phone: normalizedPhone,
    ward: resident.ward,
    address: resident.address,
    email: String(email).toLowerCase(),
    password: await bcrypt.hash(password, 10),
    role: 'user',
    createdAt: new Date().toISOString()
  };
  const result = await users.insertOne(user);
  // Re-fetch the saved user so the returned token contains the real _id assigned by the DB
  const savedUser = await users.findOne({ _id: result.insertedId });
  res.status(201).json({ token: createToken(savedUser), user: publicUser(savedUser) });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getCollection('users').findOne({ email: String(email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(400).json({ message: 'Invalid email or password.' });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
});

router.post('/auth/reset-password', async (req, res) => {
  const { phone, email, newPassword } = req.body;
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (!normalizedPhone || !email || !newPassword) {
    return res.status(400).json({ message: 'Phone number, email, and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
  }

  const users = getCollection('users');
  const user = await users.findOne({ 
    phone: normalizedPhone, 
    email: String(email).toLowerCase() 
  });

  if (!user) {
    return res.status(404).json({ message: 'No registered account found with that email and Aadhaar-linked phone number.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await users.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

  res.json({ message: 'Password reset successful. Please sign in with your new password.' });
});

router.get('/auth/me', authenticateToken, async (req, res) => {
  const user = await getCollection('users').findOne({ _id: req.user.id });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(publicUser(user));
});

// Sources are maintained as ward data. There is intentionally no create/update source endpoint.
router.get('/sources', authenticateToken, async (req, res) => {
  const query = req.user.role === 'user' ? { ward: req.user.ward } : {};
  res.json(await getCollection('waterSources').find(query).toArray());
});

router.post('/complaints', authenticateToken, authorizeRoles('user'), async (req, res) => {
  const { waterSourceId, description, pH, tds, turbidity, testReportImage } = req.body;
  if (!waterSourceId || !description || pH === undefined || tds === undefined || turbidity === undefined || !testReportImage) {
    return res.status(400).json({ message: 'Water source, issue description, pH, TDS, turbidity, and test report image are required.' });
  }
  const source = await getCollection('waterSources').findOne({ _id: waterSourceId });
  if (!source || source.ward !== req.user.ward) {
    return res.status(403).json({ message: 'You can report only a predefined water source in your registered ward.' });
  }
  const complaints = getCollection('complaints');
  const existing = await complaints.find({ citizenId: req.user.id }).toArray();
  const lastComplaint = existing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  if (lastComplaint && Date.now() - new Date(lastComplaint.createdAt).getTime() < WEEK_MS) {
    const availableOn = new Date(new Date(lastComplaint.createdAt).getTime() + WEEK_MS).toLocaleString();
    return res.status(429).json({ message: `Only one issue can be filed in a 7-day period. You can file another after ${availableOn}.` });
  }
  const engineer = (await getCollection('users').find({ role: 'assistant_engineer' }).toArray()).find((item) => item.ward === req.user.ward);
  const now = new Date();

  // Generate unique transaction ID
  const transactionId = 'AQW-' + Math.floor(100000 + Math.random() * 900000);
  const computedTestResults = `pH: ${pH}, TDS: ${tds} ppm, Turbidity: ${turbidity ? 'High' : 'Normal'}`;

  const complaint = {
    citizenId: req.user.id,
    citizenName: req.user.name,
    ward: req.user.ward,
    waterSourceId: source._id,
    waterSourceName: source.name,
    description,
    pH: Number(pH),
    tds: Number(tds),
    turbidity: Boolean(turbidity),
    testResults: computedTestResults,
    testReportImage,
    transactionId,
    status: 'Submitted',
    assignedEngineerId: engineer?._id || null,
    assignedEngineerName: engineer?.name || 'Assistant Executive Engineer',
    legalNoticeEligibleAt: new Date(now.getTime() + WEEK_MS).toISOString(),
    createdAt: now.toISOString()
  };
  await complaints.insertOne(complaint);
  res.status(201).json({ message: `Water issue submitted and assigned to the Assistant Executive Engineer. Transaction ID: ${transactionId}`, complaint });
});

router.get('/complaints', authenticateToken, async (req, res) => {
  const query = req.user.role === 'user' ? { citizenId: req.user.id } : { ward: req.user.ward };
  const complaints = await getCollection('complaints').find(query).toArray();
  res.json(complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.post('/complaints/:id/status', authenticateToken, authorizeRoles('assistant_engineer'), async (req, res) => {
  const { status, remarks, resolvedImage } = req.body;
  if (!['In Progress', 'Resolved'].includes(status)) return res.status(400).json({ message: 'Status must be In Progress or Resolved.' });
  if (status === 'Resolved' && !resolvedImage) {
    return res.status(400).json({ message: 'An image of the resolved problem is required to mark the complaint as Resolved.' });
  }
  const complaints = getCollection('complaints');
  const complaint = await complaints.findOne({ _id: req.params.id });
  if (!complaint || complaint.ward !== req.user.ward) return res.status(404).json({ message: 'Complaint not found for your ward.' });
  await complaints.updateOne({ _id: complaint._id }, { $set: { status, engineerRemarks: remarks || '', resolvedImage: resolvedImage || null, resolvedAt: status === 'Resolved' ? new Date().toISOString() : null } });
  res.json({ message: 'Complaint status updated.' });
});

router.post('/complaints/:id/legal-notice', authenticateToken, authorizeRoles('user'), async (req, res) => {
  const complaints = getCollection('complaints');
  const complaint = await complaints.findOne({ _id: req.params.id });
  if (!complaint || complaint.citizenId !== req.user.id) return res.status(404).json({ message: 'Your complaint was not found.' });
  if (complaint.status === 'Resolved') return res.status(400).json({ message: 'A legal notice cannot be filed for a resolved complaint.' });
  
  // Verify it is filed after 7 days of complaint raise
  const elapsed = Date.now() - new Date(complaint.createdAt).getTime();
  if (elapsed < WEEK_MS) {
    return res.status(400).json({ message: 'A legal notice can only be filed after 7 days (1 week) of the complaint being raised.' });
  }

  await complaints.updateOne({ _id: complaint._id }, { $set: { legalNoticeFiledAt: new Date().toISOString(), status: 'Legal Notice Filed' } });
  res.json({ message: `Legal notice recorded against ${complaint.assignedEngineerName}.` });
});

// Public tracking endpoint - no login required
router.get('/complaints/track/:transactionId', async (req, res) => {
  const complaint = await getCollection('complaints').findOne({ transactionId: req.params.transactionId });
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint with this transaction ID was not found.' });
  }
  res.json({
    transactionId: complaint.transactionId,
    waterSourceName: complaint.waterSourceName,
    ward: complaint.ward,
    description: complaint.description,
    pH: complaint.pH,
    tds: complaint.tds,
    turbidity: complaint.turbidity,
    status: complaint.status,
    assignedEngineerName: complaint.assignedEngineerName,
    createdAt: complaint.createdAt,
    resolvedAt: complaint.resolvedAt,
    testReportImage: complaint.testReportImage,
    resolvedImage: complaint.resolvedImage,
    engineerRemarks: complaint.engineerRemarks,
    legalNoticeFiledAt: complaint.legalNoticeFiledAt
  });
});

module.exports = router;
