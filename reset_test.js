(async () => {
  const base = 'http://127.0.0.1:3000';
  try {
    console.log('== Resetting password for testuser ==');
    const res = await fetch(base + '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'testuser', recoveryAnswer: 'Rex', newPassword: 'Password123!' })
    });
    const text = await res.text();
    try { console.log('Status:', res.status, JSON.parse(text)); } catch { console.log('Status:', res.status, text); }
  } catch (err) {
    console.error('Error:', err);
  }
})();
