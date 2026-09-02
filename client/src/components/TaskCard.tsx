import { DragEvent } from "react";
import { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, task: Task) => void;
}

const priorityColors: Record<Task["priority"], string> = {
  low: "#4b9",
  medium: "#e6a23c",
  high: "#e05263",
};

export const TaskCard = ({ task, onEdit, onDelete, onDragStart }: TaskCardProps) => {
  const isOverdue =
    task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();

  return (
    <div
      className="task-card"
      draggable
      style={{ borderLeftColor: priorityColors[task.priority] }}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onEdit(task)}
    >
      <div className="task-card-top">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {task.priority}
        </span>
        <button
          className="icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          aria-label="Delete task"
        >
          ✕
        </button>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-card-bottom">
        {task.assignee && <span className="assignee-chip">{task.assignee}</span>}
        {task.dueDate && (
          <span className={`due-date ${isOverdue ? "overdue" : ""}`}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
