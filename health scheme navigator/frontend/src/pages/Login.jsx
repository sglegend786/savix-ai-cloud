import React, { useEffect } from "react";

function Login() {
  useEffect(() => {
    // Redirect directly to Savix AI Main UI
    window.location.replace("http://127.0.0.1:8080/index.html");
  }, []);

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>Redirecting to Savix AI...</h2>
      <p>Authentication is centrally managed.</p>
    </div>
  );
}

export default Login;