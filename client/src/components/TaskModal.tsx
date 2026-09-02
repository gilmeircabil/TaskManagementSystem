import { FormEvent, useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { SOCKET_EVENTS, Task, TaskInput, TaskPriority, TaskStatus } from "../types/task";

interface TaskModalProps {
  task: Task | null; // null = creating a new task
  userName: string;
  onSave: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

const emptyForm: TaskInput = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignee: "",
  dueDate: "",
};

export const TaskModal = ({ task, userName, onSave, onClose }: TaskModalProps) => {
  const { socket } = useSocket();
  const [form, setForm] = useState<TaskInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignee: task.assignee || "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [task]);

  // Show "X is typing…" when someone else edits the same task
  useEffect(() => {
    if (!socket || !task) return;

    const onTyping = (payload: { taskId: string; name: string }) => {
      if (payload.taskId !== task._id || payload.name === userName) return;
      setTypingUser(payload.name);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
    };

    socket.on(SOCKET_EVENTS.USER_TYPING, onTyping);
    return () => {
      socket.off(SOCKET_EVENTS.USER_TYPING, onTyping);
    };
  }, [socket, task, userName]);

  const emitTyping = () => {
    if (socket && task) {
      socket.emit(SOCKET_EVENTS.USER_TYPING, { taskId: task._id, name: userName });
    }
  };

  const handleChange = (field: keyof TaskInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    emitTyping();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, dueDate: form.dueDate || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? "Edit Task" : "New Task"}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {typingUser && <div className="typing-indicator">{typingUser} is editing…</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <label>
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Add more detail (optional)"
              rows={3}
            />
          </label>

          <div className="form-row">
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value as TaskStatus)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Assignee
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => handleChange("assignee", e.target.value)}
                placeholder="Who's on it?"
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                value={form.dueDate ?? ""}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
