import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { COLUMNS, Task, TaskStatus } from "../types/task";
import { TaskColumn } from "./TaskColumn";
import { TaskModal } from "./TaskModal";
import { Header } from "./Header";

interface TaskBoardProps {
  userName: string;
}

export const TaskBoard = ({ userName }: TaskBoardProps) => {
  const { tasks, loading, error, createTask, updateTask, deleteTask, moveTask } = useTasks();
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined); // undefined = closed

  const openCreate = () => setModalTask(null);
  const openEdit = (task: Task) => setModalTask(task);
  const closeModal = () => setModalTask(undefined);

  const handleSave = async (input: Parameters<typeof createTask>[0]) => {
    if (modalTask) {
      await updateTask(modalTask._id, input);
    } else {
      await createTask(input);
    }
  };

  const handleDrop = (taskId: string, status: TaskStatus, order: number) => {
    moveTask(taskId, status, order);
  };

  return (
    <div className="app-shell">
      <Header userName={userName} onAddTask={openCreate} />

      {error && <div className="banner banner-error">{error}</div>}
      {loading ? (
        <div className="loading-state">Loading tasks…</div>
      ) : (
        <div className="board">
          {COLUMNS.map((col) => (
            <TaskColumn
              key={col.key}
              status={col.key}
              label={col.label}
              tasks={tasks.filter((t) => t.status === col.key)}
              onEdit={openEdit}
              onDelete={deleteTask}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {modalTask !== undefined && (
        <TaskModal task={modalTask} userName={userName} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
};
