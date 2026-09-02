import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { taskApi } from "../api/taskApi";
import { SOCKET_EVENTS, Task, TaskInput } from "../types/task";

export const useTasks = () => {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await taskApi.getAll();
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (!cancelled) setError("Failed to load tasks. Is the API server running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime sync: merge server-pushed changes into local state
  useEffect(() => {
    if (!socket) return;

    const onCreated = (task: Task) => {
      setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]));
    };

    const onUpdated = (task: Task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const onDeleted = ({ _id }: { _id: string }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
    };

    const onReordered = (allTasks: Task[]) => {
      setTasks(allTasks);
    };

    socket.on(SOCKET_EVENTS.TASK_CREATED, onCreated);
    socket.on(SOCKET_EVENTS.TASK_UPDATED, onUpdated);
    socket.on(SOCKET_EVENTS.TASK_DELETED, onDeleted);
    socket.on(SOCKET_EVENTS.TASK_REORDERED, onReordered);

    return () => {
      socket.off(SOCKET_EVENTS.TASK_CREATED, onCreated);
      socket.off(SOCKET_EVENTS.TASK_UPDATED, onUpdated);
      socket.off(SOCKET_EVENTS.TASK_DELETED, onDeleted);
      socket.off(SOCKET_EVENTS.TASK_REORDERED, onReordered);
    };
  }, [socket]);

  const createTask = useCallback(async (input: TaskInput) => {
    // server broadcasts the created task back to us over the socket,
    // so we don't need to optimistically insert it here.
    await taskApi.create(input);
  }, []);

  const updateTask = useCallback(async (id: string, input: Partial<TaskInput>) => {
    await taskApi.update(id, input);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    // optimistic removal for a snappier feel; socket event will confirm it
    setTasks((prev) => prev.filter((t) => t._id !== id));
    await taskApi.remove(id);
  }, []);

  const moveTask = useCallback(
    async (taskId: string, newStatus: Task["status"], newOrder: number) => {
      setTasks((prev) => {
        const target = prev.find((t) => t._id === taskId);
        if (!target) return prev;
        const rest = prev.filter((t) => t._id !== taskId);
        const updated = { ...target, status: newStatus, order: newOrder };
        return [...rest, updated];
      });

      const columnTasks = tasks
        .filter((t) => t.status === newStatus && t._id !== taskId)
        .sort((a, b) => a.order - b.order);

      columnTasks.splice(newOrder, 0, { ...tasks.find((t) => t._id === taskId)!, status: newStatus });

      const updates = columnTasks.map((t, idx) => ({
        _id: t._id,
        status: newStatus,
        order: idx,
      }));

      await taskApi.reorder(updates);
    },
    [tasks]
  );

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask };
};
