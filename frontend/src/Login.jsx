import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ setUserId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5001/api/login",
        { username, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (res.status === 200) {
        setUserId(res.data.user_id);
        navigate("/todolist");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Login error:", err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <input
            style={{ width: '100%', padding: '8px' }}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            style={{ width: '100%', padding: '8px' }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none' 
          }}
        >
          Login
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Don't have an account?{" "}
        <button 
          onClick={() => navigate("/register")}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'blue', 
            cursor: 'pointer' 
          }}
        >
          Register
        </button>
      </p>
    </div>
  );
}

export default Login;