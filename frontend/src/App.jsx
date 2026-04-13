import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const PRIORITIES = ["low", "medium", "high"];

const priorityConfig = {
  low:    { label: "Low",    color: "#4ade80" },
  medium: { label: "Medium", color: "#facc15" },
  high:   { label: "High",   color: "#f87171" },
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      setTasks(await res.json());
      setError(null);
    } catch (e) {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title cannot be empty"); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create task");
      setForm({ title: "", description: "", priority: "medium" });
      await fetchTasks();
    } catch (e) {
      setFormError("Failed to create task. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      await fetchTasks();
    } catch (e) {
      alert("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      await fetchTasks();
    } catch (e) {
      alert("Failed to delete task");
    }
  };

  const filtered = tasks.filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "done")   return  t.completed;
    return true;
  });

  const stats = {
    total:  tasks.length,
    active: tasks.filter(t => !t.completed).length,
    done:   tasks.filter(t =>  t.completed).length,
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">TASKFLOW</span>
          </div>
          <div className="stats-bar">
            <div className="stat"><span className="stat-num">{stats.total}</span><span className="stat-label">Total</span></div>
            <div className="stat"><span className="stat-num accent-yellow">{stats.active}</span><span className="stat-label">Active</span></div>
            <div className="stat"><span className="stat-num accent-green">{stats.done}</span><span className="stat-label">Done</span></div>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="form-section">
          <h2 className="section-title">New Task</h2>
          <form className="task-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                className="input input-title"
                type="text"
                placeholder="Task title..."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <div className="priority-group">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn ${form.priority === p ? "active" : ""}`}
                    style={{ "--p-color": priorityConfig[p].color }}
                    onClick={() => setForm({ ...form, priority: p })}
                  >
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <textarea
                className="input input-desc"
                placeholder="Description (optional)..."
                value={form.description}
                rows={2}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <button className="btn-add" type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "+ Add Task"}
              </button>
            </div>
            {formError && <p className="form-error">{formError}</p>}
          </form>
        </section>

        <div className="filter-tabs">
          {["all", "active", "done"].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <section className="task-list">
          {loading && <div className="state-msg">Loading tasks…</div>}
          {error   && <div className="state-msg error">{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="state-msg">No tasks here. Add one above!</div>
          )}
          {filtered.map(task => (
            <div key={task.id} className={`task-card ${task.completed ? "done" : ""}`}>
              <div className="task-left">
                <button
                  className={`checkbox ${task.completed ? "checked" : ""}`}
                  onClick={() => toggleComplete(task)}
                  aria-label="Toggle complete"
                >
                  {task.completed && <span>✓</span>}
                </button>
                <div className="task-body">
                  <span className="task-title">{task.title}</span>
                  {task.description && <span className="task-desc">{task.description}</span>}
                  <div className="task-meta">
                    <span
                      className="priority-badge"
                      style={{ "--p-color": priorityConfig[task.priority]?.color || "#888" }}
                    >
                      {priorityConfig[task.priority]?.label || task.priority}
                    </span>
                    <span className="task-date">
                      {new Date(task.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn-delete"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                ✕
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
