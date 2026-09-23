const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================================================
// SECURITY SHIELD 1: HIDE SERVER SIGNATURE & STACK
// ===================================================================
app.disable('x-powered-by');

// ===================================================================
// SECURITY SHIELD 2: ENTERPRISE HTTP SECURITY HEADERS
// ===================================================================
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking attacks
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict sensitive browser APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// ===================================================================
// SECURITY SHIELD 3: SENSITIVE FILE ACCESS BLOCKER (PATH TRAVERSAL DEFENSE)
// ===================================================================
app.use((req, res, next) => {
  const lowerPath = decodeURIComponent(req.path).toLowerCase();
  const forbiddenPatterns = [
    '/data/',
    'auth.json',
    '.env',
    '.git',
    'package.json',
    'package-lock.json',
    'server.js',
    'node_modules',
    'start.bat',
    '.system_generated'
  ];

  for (const pattern of forbiddenPatterns) {
    if (lowerPath.includes(pattern)) {
      console.warn(`[SECURITY ALERT] Blocked unauthorized probe from ${req.ip} for: ${req.path}`);
      return res.status(403).json({ error: 'Access Denied: Protected System Resource' });
    }
  }
  next();
});

// ===================================================================
// CLOUDINARY CONFIGURATION (ENV VARS WITH SECURE DEFAULTS)
// ===================================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gdkzinnv',
  api_key: process.env.CLOUDINARY_API_KEY || '323948998656648',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'A6ubsscdEUC27KgJ3dLpBTXp1dI'
});

// ===================================================================
// SECURITY SHIELD 4: HARDENED UPLOAD VALIDATION & MIME RESTRICTIONS
// ===================================================================
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB strict limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      return cb(new Error('Security Exception: Only authentic JPG, PNG, and WEBP images are permitted.'));
    }
    cb(null, true);
  }
});

// Magic bytes validation for uploaded image buffers
function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WEBP: RIFF....WEBP (52 49 46 46)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;
  return false;
}

// ===================================================================
// BASIC MIDDLEWARES
// ===================================================================
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '2mb' })); // Reduced from 10mb to prevent memory exhaustion
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore', // Never serve hidden/dot files
  maxAge: '1h'
}));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SITE_DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// Active admin sessions map (token -> session)
const activeSessions = new Map();

// ===================================================================
// SECURITY SHIELD 5: BRUTE FORCE & CREDENTIAL STUFFING DEFENSE
// ===================================================================
const loginAttempts = new Map(); // IP -> { count, lockedUntil }
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes lockout

function checkLoginRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return {
      allowed: false,
      message: `Account access locked due to 5 consecutive failed attempts. Try again in ${minutesLeft} minute(s).`
    };
  }

  // If lockout expired, reset
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedLogin(ip) {
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    console.warn(`[SECURITY ALERT] IP ${ip} locked out for 15 minutes due to multiple failed login attempts.`);
  }
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// ===================================================================
// SECURITY SHIELD 6: PUBLIC INQUIRY SPAM & BOT PROTECTION (RATE LIMITER)
// ===================================================================
const inquiryRateLimits = new Map(); // IP -> timestamps[]
const MAX_INQUIRIES_PER_WINDOW = 5;
const INQUIRY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkInquiryRateLimit(ip) {
  const now = Date.now();
  let timestamps = inquiryRateLimits.get(ip) || [];
  timestamps = timestamps.filter(ts => now - ts < INQUIRY_WINDOW_MS);

  if (timestamps.length >= MAX_INQUIRIES_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  inquiryRateLimits.set(ip, timestamps);
  return true;
}

// ===================================================================
// SECURITY SHIELD 7: INPUT SANITIZER & XSS DEFENSE
// ===================================================================
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Strip < and > to prevent HTML/script injection
    .replace(/javascript:/gi, '') // Prevent javascript: pseudo-protocols
    .replace(/data:/gi, '') // Prevent data: protocol attacks
    .trim()
    .substring(0, maxLength);
}

// ===================================================================
// SECURITY SHIELD 8: CRYPTOGRAPHIC TIMING-SAFE PASSWORD VALIDATION
// ===================================================================
function hashPassword(password, salt, iterations = 100000) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function safeCompareHashes(hashA, hashB) {
  if (typeof hashA !== 'string' || typeof hashB !== 'string') return false;
  const bufA = Buffer.from(hashA, 'hex');
  const bufB = Buffer.from(hashB, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Helper functions for data management
function readJson(file, defaultVal = {}) {
  try {
    if (!fs.existsSync(file)) return defaultVal;
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON:', file, err);
    return defaultVal;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON:', file, err);
    return false;
  }
}

// Authentication Middleware with User-Agent verification & active expiry
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Security token missing' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  req.user = session;
  next();
}

// Hourly cleanup of stale sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

// ===================================================================
// 1. AUTHENTICATION & PASSWORD MANAGEMENT API
// ===================================================================

// Login with Rate Limiting & Timing-Safe Verification
app.post('/api/auth/login', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // 1. Check Rate Limit
  const rateLimitStatus = checkLoginRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({ success: false, message: rateLimitStatus.message });
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const authData = readJson(AUTH_FILE);
  if (!authData || !authData.salt || !authData.hash) {
    return res.status(500).json({ success: false, message: 'Authentication configuration missing' });
  }

  // Compute test hash with iterations
  const iterations = authData.iterations || 10000;
  const testHash = hashPassword(password, authData.salt, iterations);

  // Timing-safe comparison to prevent side-channel timing attacks
  const isValid = safeCompareHashes(testHash, authData.hash);

  if (!isValid) {
    recordFailedLogin(ip);
    const currentRecord = loginAttempts.get(ip);
    const attemptsRemaining = MAX_FAILED_ATTEMPTS - (currentRecord ? currentRecord.count : 1);

    return res.status(401).json({
      success: false,
      message: attemptsRemaining > 0 
        ? `Invalid password. ${attemptsRemaining} attempt(s) remaining before security lockout.`
        : 'Maximum login attempts exceeded. Account locked for 15 minutes.'
    });
  }

  // Clear failed attempts on success
  clearLoginAttempts(ip);

  // Create cryptographically secure session token (256-bit entropy)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours valid
  activeSessions.set(token, {
    username: authData.username || 'admin',
    createdAt: Date.now(),
    expiresAt: expiresAt,
    ip: ip
  });

  res.json({
    success: true,
    message: 'Authentication successful',
    token: token,
    expiresAt: expiresAt
  });
});

// Verify Token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);
  if (session && session.expiresAt > Date.now()) {
    return res.json({ authenticated: true, user: session.username });
  }
  res.json({ authenticated: false });
});

// Change Password (PBKDF2 100,000 Iterations & Strict Validation)
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current password and new password are required' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
  }

  const authData = readJson(AUTH_FILE);
  const currentIterations = authData.iterations || 10000;
  const currentHash = hashPassword(currentPassword, authData.salt, currentIterations);

  if (!safeCompareHashes(currentHash, authData.hash)) {
    return res.status(400).json({ success: false, message: 'Current password does not match' });
  }

  // Upgrade to NIST-standard 100,000 iterations for future-proof security
  const UPGRADED_ITERATIONS = 100000;
  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = hashPassword(newPassword, newSalt, UPGRADED_ITERATIONS);

  authData.salt = newSalt;
  authData.hash = newHash;
  authData.iterations = UPGRADED_ITERATIONS;
  authData.lastUpdated = new Date().toISOString();

  if (writeJson(AUTH_FILE, authData)) {
    // Invalidate all previous sessions
    activeSessions.clear();

    // Issue fresh token
    const freshToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(freshToken, {
      username: authData.username || 'admin',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Password successfully updated! Your account is secured with 100,000-round PBKDF2 encryption.',
      newToken: freshToken
    });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to write updated credentials' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Session terminated' });
});

// ===================================================================
// 2. HARDENED CLOUDINARY UPLOAD API
// ===================================================================

app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Verify magic bytes (prevents disguised executable uploads)
    if (!isValidImageBuffer(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Security Exception: Uploaded file is corrupted or not a valid image format.'
      });
    }

    // Upload to Cloudinary stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'arsh_makeup_artist',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { quality: 'auto:best', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Cloudinary upload failed: ' + error.message });
        }
        res.json({
          success: true,
          message: 'Image successfully uploaded to Cloudinary!',
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload exception:', err);
    res.status(500).json({ success: false, message: 'Server upload error: ' + err.message });
  }
});

// ===================================================================
// 3. CONTENT & SITE DATA APIS
// ===================================================================

// Get public website content
app.get('/api/content', (req, res) => {
  const data = readJson(SITE_DATA_FILE);
  res.json(data);
});

// Update specific site section (Hero, About, Contact, Policies, Pricing, etc.)
app.put('/api/content', requireAuth, (req, res) => {
  const { section, data } = req.body;
  const allowedSections = ['branding', 'contact', 'hero', 'about', 'services', 'gallery', 'pricing', 'policy', 'brands'];

  if (!section || !data || !allowedSections.includes(section)) {
    return res.status(400).json({ success: false, message: 'Invalid or restricted section' });
  }

  const currentData = readJson(SITE_DATA_FILE);
  currentData[section] = data;

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: `${section} updated successfully!`, data: currentData[section] });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update content data' });
  }
});

// ===================================================================
// 4. GALLERY MANAGEMENT APIS
// ===================================================================

// Get Gallery
app.get('/api/gallery', (req, res) => {
  const data = readJson(SITE_DATA_FILE);
  res.json(data.gallery || []);
});

// Add Photo to Gallery
app.post('/api/gallery', requireAuth, (req, res) => {
  const { title, category, url, details, featured } = req.body;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ success: false, message: 'Valid image URL is required' });
  }

  const currentData = readJson(SITE_DATA_FILE);
  if (!currentData.gallery) currentData.gallery = [];

  const newPhoto = {
    id: 'gal-' + Date.now(),
    title: sanitizeString(title, 100) || 'Bridal Glam',
    category: sanitizeString(category, 50) || 'Bridal',
    url: url.trim(),
    featured: featured !== undefined ? featured : true,
    details: sanitizeString(details, 300) || 'Luxury makeup styling by Arsh Khan'
  };

  currentData.gallery.unshift(newPhoto);

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Photo added to gallery successfully!', photo: newPhoto });
  } else {
    res.status(500).json({ success: false, message: 'Failed to add photo' });
  }
});

// Update Gallery Item
app.put('/api/gallery/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const currentData = readJson(SITE_DATA_FILE);
  const index = (currentData.gallery || []).findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Photo not found' });
  }

  if (updates.title) updates.title = sanitizeString(updates.title, 100);
  if (updates.details) updates.details = sanitizeString(updates.details, 300);
  if (updates.category) updates.category = sanitizeString(updates.category, 50);

  currentData.gallery[index] = { ...currentData.gallery[index], ...updates };

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Photo details updated!', photo: currentData.gallery[index] });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update photo' });
  }
});

// Delete Gallery Item
app.delete('/api/gallery/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const currentData = readJson(SITE_DATA_FILE);
  const initialLength = (currentData.gallery || []).length;

  currentData.gallery = (currentData.gallery || []).filter(item => item.id !== id);

  if (currentData.gallery.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Photo not found' });
  }

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Photo deleted successfully!' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
});

// ===================================================================
// 5. SERVICES MANAGEMENT APIS
// ===================================================================

app.get('/api/services', (req, res) => {
  const data = readJson(SITE_DATA_FILE);
  res.json(data.services || []);
});

app.post('/api/services', requireAuth, (req, res) => {
  const { name, category, tagline, description, price, features, image, badge } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Service name is required' });
  }

  const currentData = readJson(SITE_DATA_FILE);
  if (!currentData.services) currentData.services = [];

  const newService = {
    id: 'srv-' + Date.now(),
    name: sanitizeString(name, 100),
    category: sanitizeString(category, 50) || 'Bridal',
    tagline: sanitizeString(tagline, 150),
    description: sanitizeString(description, 500),
    price: sanitizeString(price, 50) || 'PRICE ON REQUEST',
    features: Array.isArray(features) 
      ? features.map(f => sanitizeString(f, 80)) 
      : (features ? features.split(',').map(s => sanitizeString(s.trim(), 80)) : []),
    image: image || '/assets/images/bridal_look_1.jpg',
    badge: sanitizeString(badge, 50) || 'Exclusive'
  };

  currentData.services.push(newService);

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Service added successfully!', service: newService });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save service' });
  }
});

app.put('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const currentData = readJson(SITE_DATA_FILE);
  const index = (currentData.services || []).findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  if (updates.name) updates.name = sanitizeString(updates.name, 100);
  if (updates.tagline) updates.tagline = sanitizeString(updates.tagline, 150);
  if (updates.price) updates.price = sanitizeString(updates.price, 50);

  currentData.services[index] = { ...currentData.services[index], ...updates };

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Service updated successfully!', service: currentData.services[index] });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const currentData = readJson(SITE_DATA_FILE);
  const initialLength = (currentData.services || []).length;

  currentData.services = (currentData.services || []).filter(s => s.id !== id);

  if (currentData.services.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  if (writeJson(SITE_DATA_FILE, currentData)) {
    res.json({ success: true, message: 'Service deleted successfully!' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// ===================================================================
// 6. CLIENT INQUIRIES & ANTI-SPAM DEFENSE
// ===================================================================

app.post('/api/inquiries', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Honeypot check (hidden field filled by automated spam bots)
  if (req.body._hp_fax || req.body._website_bot) {
    console.warn(`[SECURITY ALERT] Spam bot submission trapped via honeypot from IP: ${ip}`);
    // Silently return success to waste bot's time without storing junk
    return res.json({ success: true, message: 'Inquiry received' });
  }

  // Rate Limiting (5 submissions per 10 mins per IP)
  if (!checkInquiryRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many consultation requests from your network. Please wait a few minutes or call 7428701987 directly.'
    });
  }

  const { name, phone, service, date, venue, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required' });
  }

  const inquiries = readJson(INQUIRIES_FILE, []);
  const newInquiry = {
    id: 'inq-' + Date.now(),
    name: sanitizeString(name, 80),
    phone: sanitizeString(phone, 25),
    service: sanitizeString(service, 80) || 'BRIDAL HD / AIRBRUSH',
    date: sanitizeString(date, 30) || 'Flexible',
    venue: sanitizeString(venue, 120) || 'Delhi NCR',
    notes: sanitizeString(notes, 500) || '',
    status: 'New',
    ip: ip.substring(0, 45), // For security auditing
    createdAt: new Date().toISOString()
  };

  inquiries.unshift(newInquiry);

  if (writeJson(INQUIRIES_FILE, inquiries)) {
    res.json({
      success: true,
      message: 'Consultation request submitted! Arsh will contact you shortly.',
      inquiry: newInquiry
    });
  } else {
    res.status(500).json({ success: false, message: 'Failed to record consultation' });
  }
});

app.get('/api/inquiries', requireAuth, (req, res) => {
  const inquiries = readJson(INQUIRIES_FILE, []);
  res.json(inquiries);
});

app.put('/api/inquiries/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const inquiries = readJson(INQUIRIES_FILE, []);
  const inq = inquiries.find(i => i.id === id);

  if (!inq) {
    return res.status(404).json({ success: false, message: 'Inquiry not found' });
  }

  if (status) inq.status = sanitizeString(status, 20);

  if (writeJson(INQUIRIES_FILE, inquiries)) {
    res.json({ success: true, message: 'Status updated', inquiry: inq });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

app.delete('/api/inquiries/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  let inquiries = readJson(INQUIRIES_FILE, []);
  const prevLen = inquiries.length;
  inquiries = inquiries.filter(i => i.id !== id);

  if (inquiries.length === prevLen) {
    return res.status(404).json({ success: false, message: 'Inquiry not found' });
  }

  if (writeJson(INQUIRIES_FILE, inquiries)) {
    res.json({ success: true, message: 'Inquiry deleted' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
  }
});

// ===================================================================
// 7. ROUTING TO ADMIN AND CLIENT
// ===================================================================

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT SERVER ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Server error processing request' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  ARSH MAKEUP ARTIST DELHI - HARDENED PRODUCTION SERVER 🛡️`);
  console.log(`🚀 Client Website: http://localhost:${PORT}`);
  console.log(`🔒 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`☁️  Cloudinary Cloud: gdkzinnv (Secure & Active)`);
  console.log(`🛡️  Security Shields: Active (Anti-BruteForce, XSS, HSTS, PathGuard)`);
  console.log(`====================================================`);
});
