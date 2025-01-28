import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState();
  const emailRef = useRef<HTMLInputElement>(null);

  const login = async () => {
    const loginCreds = {
      email: emailRef.current?.value,
      credential: "test",
    };
    const response = await fetch("http://localhost:5000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginCreds),
    });
    const result = await response.json();
    console.log(result);
  };
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <label>Email:</label>
        <input ref={emailRef} type="email" name="email" />
        <button onClick={login}>Login</button>
      </div>
    </>
  );
}

export default App;
