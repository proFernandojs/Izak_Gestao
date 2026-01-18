(async () => {
  const base = 'http://127.0.0.1:3000';
  const headers = { 'Content-Type': 'application/json' };

  try {
    console.log('== Registering test user ==');
    const regRes = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'Password123!', recoveryQuestion: 'pet', recoveryAnswer: 'Rex' })
    });
    const regText = await regRes.text();
    try { console.log('Register status:', regRes.status, JSON.parse(regText)); } catch { console.log('Register status:', regRes.status, regText); }

    console.log('\n== Logging in test user ==');
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ usernameOrEmail: 'testuser', password: 'Password123!' })
    });
    const loginText = await loginRes.text();
    try { console.log('Login status:', loginRes.status, JSON.parse(loginText)); } catch { console.log('Login status:', loginRes.status, loginText); }

    console.log('\n== Fetch recovery question ==');
    const qRes = await fetch(base + '/api/auth/recovery-question?usernameOrEmail=testuser');
    const qText = await qRes.text();
    try { console.log('Question status:', qRes.status, JSON.parse(qText)); } catch { console.log('Question status:', qRes.status, qText); }

  } catch (err) {
    console.error('Error in test script:', err);
  }
})();
