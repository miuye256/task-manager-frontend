export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  isComplete: boolean;
}

export type TaskInput = Omit<Task, "id">;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

async function getErrorMessage(response: Response, fallback: string) {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text) as {
      title?: string;
      message?: string;
      error?: string;
    };

    return payload.message ?? payload.title ?? payload.error ?? fallback;
  } catch {
    return text;
  }
}

async function parseJson<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "API リクエストに失敗しました。"),
    );
  }

  return parseJson<T>(response);
}

export async function getTasks(): Promise<Task[]> {
  return (await request<Task[]>("/tasks", { cache: "no-store" })) ?? [];
}

export async function getTask(id: number): Promise<Task> {
  const task = await request<Task>(`/tasks/${id}`, { cache: "no-store" });

  if (!task) {
    throw new Error("タスクが見つかりませんでした。");
  }

  return task;
}

export async function addTask(task: TaskInput): Promise<Task> {
  const createdTask = await request<Task>("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  if (!createdTask) {
    throw new Error("タスクの作成結果を取得できませんでした。");
  }

  return createdTask;
}

export async function updateTask(id: number, task: TaskInput): Promise<Task> {
  const updatedTask = await request<Task>(`/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  return updatedTask ?? { id, ...task };
}

export async function deleteTask(id: number): Promise<void> {
  await request(`/tasks/${id}`, {
    method: "DELETE",
  });
}
