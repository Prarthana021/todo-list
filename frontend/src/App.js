import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import TodoList from "./TodoList";

function App() {
  const [userId, setUserId] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route 
          path="/login" 
          element={<Login setUserId={setUserId} />} 
        />
        <Route 
          path="/register" 
          element={<Register setUserId={setUserId} />} 
        />
        <Route 
          path="/todolist" 
          element={userId ? <TodoList /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;