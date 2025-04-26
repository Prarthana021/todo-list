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
  faCalendarAlt,
  faEdit,
  faTimes,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import "./TodoList.css";

function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [todo, setTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [label, setLabel] = useState("personal");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editLabel, setEditLabel] = useState("personal");
  const [editStatus, setEditStatus] = useState("pending");
  const [reminders, setReminders] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showReminders, setShowReminders] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    
    // Request notification permission when component mounts
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
    
    // Check for upcoming tasks every minute
    const checkInterval = setInterval(checkUpcomingTasks, 60000);
    
    // Initial check
    checkUpcomingTasks();
    
    return () => clearInterval(checkInterval);
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

  const checkUpcomingTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/upcoming-tasks", {
        withCredentials: true
      });
      
      const upcomingTasks = res.data;
      setReminders(upcomingTasks);
      
      // Show notifications if permission is granted
      if (notificationPermission === 'granted') {
        upcomingTasks.forEach(task => {
          if (task.minutes_left <= 60) {
            let message;
            if (task.minutes_left <= 0) {
              message = `"${task.task}" is overdue!`;
            } else if (task.minutes_left <= 15) {
              message = `"${task.task}" is due in ${task.minutes_left} minutes!`;
            } else if (task.minutes_left <= 30) {
              message = `"${task.task}" is due in 30 minutes!`;
            } else if (task.minutes_left <= 45) {
              message = `"${task.task}" is due in 45 minutes!`;
            } else {
              message = `"${task.task}" is due in 1 hour!`;
            }
            
            new Notification("Task Reminder", {
              body: message,
              icon: "/favicon.ico"
            });
          }
        });
      }
    } catch (err) {
      console.error("Error checking upcoming tasks:", err);
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
      await checkUpcomingTasks();
    } catch (err) {
      setError("Error adding task: " + (err.response?.data?.error || err.message));
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditText(task.what_to_do);
    setEditDueDate(task.due_date.slice(0, 16));
    setEditLabel(task.label || "personal");
    setEditStatus(task.status || "pending");
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditText("");
    setEditDueDate("");
    setEditLabel("personal");
    setEditStatus("pending");
  };

  const saveEditedTask = async () => {
    try {
      await axios.put(
        "http://localhost:5001/api/update",
        {
          id: editingTaskId,
          what_to_do: editText,
          due_date: editDueDate,
          label: editLabel,
          status: editStatus
        },
        { withCredentials: true }
      );
      await fetchTasks();
      await checkUpcomingTasks();
      cancelEditing();
    } catch (err) {
      setError("Error updating task: " + (err.response?.data?.error || err.message));
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
      await checkUpcomingTasks();
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
      await checkUpcomingTasks();
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

  const getTaskColor = (index) => {
    const pastelColors = [
      "#F8D5F0", // Pastel pink
      "#D4F1F9", // Pastel blue
      "#E2F9D4", // Pastel green
      "#F9EBD4", // Pastel orange
      "#E8D5F8", // Pastel purple
      "#D4F9F1", // Pastel teal
      "#F9D4D4", // Pastel red
      "#F0F8D5"  // Pastel yellow
    ];
    return pastelColors[index % pastelColors.length];
  };

  return (
    <div className="todo-container">
      <div className="todo-card">
        <div className="todo-header">
          <h1 className="todo-title">My TODO List</h1>
          <div className="header-actions">
            <button 
              onClick={() => setShowReminders(!showReminders)}
              className="btn btn-notification"
            >
              <FontAwesomeIcon icon={faBell} />
              {reminders.length > 0 && (
                <span className="notification-badge">{reminders.length}</span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="text-error mb-4 text-center">
            <p>{error}</p>
          </div>
        )}

        {showReminders && reminders.length > 0 && (
          <div className="reminders-panel">
            <h3>Upcoming Tasks</h3>
            <ul>
              {reminders.map((reminder, index) => (
                <li key={index}>
                  {reminder.task} - Due in {reminder.minutes_left} minutes
                </li>
              ))}
            </ul>
          </div>
        )}

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
            <ul className="space-y-3 list-none">
              {tasks.map((task, index) => {
                if (editingTaskId === task.id) {
                  return (
                    <li key={task.id} className="task-item editing">
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          className="form-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          required
                        />
                        <div className="flex gap-3">
                          <input
                            type="datetime-local"
                            className="form-input flex-1"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                          <select
                            className="form-input"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                          >
                            <option value="personal">Personal</option>
                            <option value="work">Work</option>
                          </select>
                          <select
                            className="form-input"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={saveEditedTask}
                          className="btn btn-save"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="btn btn-cancel"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    </li>
                  );
                }

                const { text, icon, className } = getLabelInfo(task.label);

                return (
                  <li 
                    key={task.id} 
                    className={`task-item ${className}`}
                    style={{ backgroundColor: getTaskColor(index) }}
                  >
                    <div className="task-content">
                      <div className="task-header">
                        <div className="task-label">
                          <FontAwesomeIcon icon={icon} />
                          <span className="label-text">{text}</span>
                        </div>
                        <div className="task-status">
                          <span className={`status ${task.status}`}>
                            {task.status === "done" ? (
                              <FontAwesomeIcon icon={faCheck} />
                            ) : (
                              "Pending"
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="task-text">{task.what_to_do}</p>
                      <p className="task-due-date">{formatDueDate(task.due_date)}</p>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => markAsDone(task.id)}
                        className="btn btn-done"
                      >
                        Mark as Done
                      </button>
                      <button
                        onClick={() => startEditing(task)}
                        className="btn btn-edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="btn btn-delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
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