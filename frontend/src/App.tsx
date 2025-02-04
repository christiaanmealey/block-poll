import { useState, useRef, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function App() {
  const [localUser, setLocalUser] = useState();
  const emailRef = useRef<HTMLInputElement>(null);
  const { user, token, isAuthenticated, login, logout, register } = useAuth();

  useEffect(() => {
    console.log(token);
  }, [token]);

  const loginUser = async () => {
    const email = emailRef.current?.value || undefined;
    login(email);
  };

  const registerUser = async () => {
    const email = emailRef.current?.value || undefined;
    register(email);
  };
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <label>Email:</label>
        <input ref={emailRef} type="email" name="email" />
        <button onClick={loginUser}>Login</button>
        <button onClick={registerUser}>Register</button>
      </div>
    </>
  );
}

export default App;
