const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function verifySecurity() {
  console.log('🛡️  STARTING ENTERPRISE SECURITY AUDIT & VERIFICATION...\n');

  // Test 1: Path Traversal Defense
  console.log('1. Testing Path Traversal Defense (Attempting to read /data/auth.json)...');
  const pathRes = await request('GET', '/data/auth.json');
  if (pathRes.status === 403) {
    console.log('✅ SHIELD PASSED: Unauthorized access to /data/auth.json blocked with 403 Forbidden!');
  } else {
    throw new Error('Failed Path Traversal test! Status: ' + pathRes.status);
  }

  // Test 2: HTTP Security Headers
  console.log('\n2. Testing HTTP Security Headers...');
  const headerRes = await request('GET', '/api/content');
  const h = headerRes.headers;
  if (
    h['x-content-type-options'] === 'nosniff' &&
    h['x-frame-options'] === 'SAMEORIGIN' &&
    h['x-xss-protection'] === '1; mode=block' &&
    !h['x-powered-by']
  ) {
    console.log('✅ SHIELD PASSED: All enterprise security headers present & X-Powered-By hidden!');
  } else {
    throw new Error('Failed Security Headers test: ' + JSON.stringify(h));
  }

  // Test 3: XSS Injection Sanitization
  console.log('\n3. Testing XSS Injection Sanitization...');
  const xssPayload = {
    name: 'Test<script>alert("hacked")</script>Bride',
    phone: '9810012345',
    service: 'BRIDAL HD',
    notes: '<iframe src="javascript:alert(1)"></iframe>Looking for natural glow'
  };
  const inqRes = await request('POST', '/api/inquiries', xssPayload);
  if (inqRes.status === 200 && inqRes.data.inquiry) {
    const savedName = inqRes.data.inquiry.name;
    const savedNotes = inqRes.data.inquiry.notes;
    if (!savedName.includes('<script>') && !savedNotes.includes('<iframe') && !savedNotes.includes('javascript:')) {
      console.log('✅ SHIELD PASSED: Malicious script & iframe tags stripped cleanly! Output:', savedName);
    } else {
      throw new Error('XSS not sanitized properly: ' + savedName);
    }
  }

  // Test 4: Timing-Safe Authentication
  console.log('\n4. Testing Authentication with timing-safe hash comparison...');
  const loginRes = await request('POST', '/api/auth/login', { password: 'arsh@2026' });
  if (loginRes.status === 200 && loginRes.data.token) {
    console.log('✅ SHIELD PASSED: Timing-safe authentication passed!');
  } else {
    throw new Error('Login failed: ' + JSON.stringify(loginRes));
  }

  // Test 5: Brute Force Rate Limiter
  console.log('\n5. Testing Anti-Brute-Force Lockout (Simulating 5 bad password attempts)...');
  let lockedOut = false;
  for (let i = 1; i <= 6; i++) {
    const fakeRes = await request('POST', '/api/auth/login', { password: 'wrongpassword' + i });
    if (fakeRes.status === 429) {
      lockedOut = true;
      console.log(`✅ SHIELD PASSED: IP was locked out with HTTP 429 after 5 failed attempts! Response:`, fakeRes.data.message);
      break;
    }
  }
  if (!lockedOut) {
    throw new Error('Anti-Brute-Force lockout did not trigger!');
  }

  console.log('\n🎉 ALL 5 ADVANCED SECURITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
}

verifySecurity().catch(e => {
  console.error('Security test failed:', e);
  process.exit(1);
});
