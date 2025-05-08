import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register({ setUserId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://backend:5001/api/register", 
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (res.status === 201) {
        setSuccess(true);
        // Auto-login after registration
        const loginRes = await axios.post(
          "http://backend:5001/api/login",
          { username, password },
          { withCredentials: true }
        );
        setUserId(loginRes.data.user_id);
        navigate("/todolist");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Registration successful! You've been logged in.</p>}
      <form onSubmit={handleRegister}>
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
          Register
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Already have an account?{" "}
        <button 
          onClick={() => navigate("/login")}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'blue', 
            cursor: 'pointer' 
          }}
        >
          Login
        </button>
      </p>
    </div>
  );
}

export default Register;