(async () => {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'goelshivika9@gmail.com', password: 'password', otp: '217873' })
  });
  const data = await res.json();
  console.log(data);
})();
