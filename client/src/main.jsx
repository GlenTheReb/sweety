import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./lib.js";
import Auth from "./components/Auth.jsx";
import Dashboard from "./components/Dashboard.jsx";
import "./style.css";
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/auth/me")
      .then((body) => setUser(body.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="boot">Opening your journal…</div>;
  return user ? (
    <Dashboard
      user={user}
      onLogout={async () => {
        try {
          await api("/auth/logout", { method: "POST" });
          setUser(null);
        } catch (err) {
          window.alert(err.message);
        }
      }}
    />
  ) : (
    <Auth onLogin={setUser} />
  );
}
createRoot(document.getElementById("root")).render(<App />);
