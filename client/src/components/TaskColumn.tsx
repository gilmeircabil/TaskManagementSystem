import { DragEvent, useState } from "react";
import { Task, TaskStatus } from "../types/task";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDrop: (taskId: string, status: TaskStatus, order: number) => void;
}

export const TaskColumn = ({ status, label, tasks, onEdit, onDelete, onDrop }: TaskColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number | null = null) => {
    e.preventDefault();
    setIsDragOver(true);
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const targetIndex = dragOverIndex !== null ? dragOverIndex : tasks.length;
    setIsDragOver(false);
    setDragOverIndex(null);
    onDrop(taskId, status, targetIndex);
  };

  return (
    <div
      className={`task-column ${isDragOver ? "drag-over" : ""}`}
      onDragOver={(e) => handleDragOver(e)}
      onDragLeave={() => {
        setIsDragOver(false);
        setDragOverIndex(null);
      }}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h2>{label}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-body">
        {tasks
          .sort((a, b) => a.order - b.order)
          .map((task, index) => (
            <div key={task._id} onDragOver={(e) => handleDragOver(e, index)}>
              <TaskCard
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onDragStart={handleDragStart}
              />
            </div>
          ))}
        {tasks.length === 0 && <div className="empty-column">Drop tasks here</div>}
      </div>
    </div>
  );
};
