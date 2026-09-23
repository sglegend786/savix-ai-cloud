import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function SSO() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectPath = searchParams.get("redirect");
    
    if (token) {
      localStorage.setItem("token", token);
      window.location.replace(redirectPath || "/");
    } else {
      window.location.replace("/login");
    }
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
      <h2>Authenticating via SSO...</h2>
    </div>
  );
}
