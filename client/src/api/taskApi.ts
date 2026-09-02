import axios from "axios";
import { Task, TaskInput } from "../types/task";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: `${API_URL}/api/tasks`,
  headers: { "Content-Type": "application/json" },
});

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await client.get<Task[]>("/");
    return data;
  },

  create: async (input: TaskInput): Promise<Task> => {
    const { data } = await client.post<Task>("/", input);
    return data;
  },

  update: async (id: string, input: Partial<TaskInput>): Promise<Task> => {
    const { data } = await client.put<Task>(`/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/${id}`);
  },

  reorder: async (
    updates: { _id: string; status: string; order: number }[]
  ): Promise<Task[]> => {
    const { data } = await client.patch<Task[]>("/reorder", { updates });
    return data;
  },
};
