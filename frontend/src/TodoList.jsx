import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faCheck, 
  faSignOutAlt,
  faBriefcase,
  faUser,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import "./TodoList.css";

function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [todo, setTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [label, setLabel] = useState("personal");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5001/api/items", {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Error fetching tasks: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!todo.trim()) {
      setError("Task description cannot be empty");
      return;
    }
    
    setError("");
    try {
      await axios.post(
        "http://localhost:5001/api/add",
        { 
          todo: todo.trim(), 
          due_date: dueDate || new Date().toISOString().slice(0, 16),
          label 
        },
        { withCredentials: true }
      );
      setTodo("");
      setDueDate("");
      await fetchTasks();
    } catch (err) {
      setError("Error adding task: " + (err.response?.data?.error || err.message));
    }
  };

  const deleteTask = async (id) => {
    if (!id) return;
    
    try {
      await axios.delete("http://localhost:5001/api/delete", {
        data: { id },
        withCredentials: true,
      });
      await fetchTasks();
    } catch (err) {
      setError("Error deleting task: " + (err.response?.data?.error || err.message));
    }
  };

  const markAsDone = async (id) => {
    if (!id) return;
    
    try {
      await axios.put(
        "http://localhost:5001/api/mark",
        { id },
        { withCredentials: true }
      );
      await fetchTasks();
    } catch (err) {
      setError("Error marking task: " + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/api/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (err) {
      setError("Logout error: " + (err.message || "Unknown error"));
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return "No due date";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getLabelInfo = (taskLabel) => {
    const label = taskLabel || "personal";
    return {
      text: label.charAt(0).toUpperCase() + label.slice(1),
      icon: label === "work" ? faBriefcase : faUser,
      className: label === "work" ? "label-work" : "label-personal"
    };
  };

  return (
    <div className="todo-container">
      <div className="todo-card">
        {/* Header */}
        <div className="todo-header">
          <h1 className="todo-title">My Todo List</h1>
          <button 
            onClick={handleLogout}
            className="btn btn-logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-error mb-4 text-center">
            <p>{error}</p>
          </div>
        )}

        {/* Add Task Form */}
        <form onSubmit={addTask} className="todo-form">
          <div className="flex-col md:flex-row gap-4">
            <div className="form-group">
              <label htmlFor="task" className="form-label">
                New Task
              </label>
              <input
                id="task"
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                Due Date
              </label>
              <div className="relative">
                <input
                  id="dueDate"
                  type="datetime-local"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <FontAwesomeIcon 
                  icon={faCalendarAlt} 
                  className="absolute right-3 top-3 text-gray-400"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="label" className="form-label">
                Label
              </label>
              <select
                id="label"
                className="form-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="btn btn-primary"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Task
              </button>
            </div>
          </div>
        </form>

        {/* Task List */}
        <div className="task-list">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Tasks</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found. Add your first task above!
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => {
                const labelInfo = getLabelInfo(task.label);
                return (
                  <li 
                    key={task.id}
                    className={`task-item ${task.status === "done" ? "task-completed" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex-row items-center mb-2">
                          <span className={`task-label ${labelInfo.className}`}>
                            <FontAwesomeIcon icon={labelInfo.icon} />
                            {labelInfo.text}
                          </span>
                          <span className="task-due">
                            Due: {formatDueDate(task.due_date)}
                          </span>
                        </div>
                        <p className="task-content">
                          {task.what_to_do}
                        </p>
                      </div>
                      
                      <div className="task-actions">
                        {task.status !== "done" && (
                          <button
                            onClick={() => markAsDone(task.id)}
                            className="action-btn complete-btn"
                            title="Mark as done"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="action-btn delete-btn"
                          title="Delete task"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoList;