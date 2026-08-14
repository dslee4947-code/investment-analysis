import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={() => setToken(localStorage.getItem("token"))} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
