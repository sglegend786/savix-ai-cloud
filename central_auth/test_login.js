(async () => {
  const res = await fetch('https://savix-auth-2aso.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'goelshivika9@gmail.com', password: 'password', otp: '217873' })
  });
  const data = await res.json();
  console.log(data);
})();
