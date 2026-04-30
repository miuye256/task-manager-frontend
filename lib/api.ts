import { z } from "zod";
import { taskSchema, taskListSchema, Task, TaskInput } from "./task";
import { ApiError, BackendErrorResponse } from "./api-error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

type ApiErrorDisplay = {
  title: string;
  notFoundMessage?: string;
};

async function parseJson(
  response: Response,
  displayTitle: string,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError({
      kind: "invalid_response",
      displayTitle,
      cause: error,
    });
  }
}

async function request(
  path: string,
  errorDisplay: ApiErrorDisplay,
  init?: RequestInit,
) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    throw new ApiError({
      kind: "network",
      displayTitle: errorDisplay.title,
      cause: error,
    });
  }

  if (!response.ok) {
    throw await toApiError(response, errorDisplay);
  }

  return await parseJson(response, errorDisplay.title);
}

async function toApiError(
  response: Response,
  errorDisplay: ApiErrorDisplay,
): Promise<ApiError> {
  const notFoundMessage =
    response.status === 404 ? errorDisplay.notFoundMessage : undefined;

  const text = await response.text();
  if (!text) {
    return new ApiError({
      kind: "http",
      displayTitle: errorDisplay.title,
      message: notFoundMessage,
      status: response.status,
    });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    return new ApiError({
      kind: "http",
      displayTitle: errorDisplay.title,
      message: notFoundMessage,
      status: response.status,
      backendError: text,
    });
  }

  const backendError = getBackendErrorResponse(payload);

  const kind =
    backendError?.errors && (response.status === 400 || response.status === 422)
      ? "validation"
      : "http";

  return new ApiError({
    kind,
    displayTitle: errorDisplay.title,
    message: notFoundMessage,
    status: response.status,
    backendError,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBackendErrorResponse(
  value: unknown,
): BackendErrorResponse | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    title: getString(value, "title"),
    detail: getString(value, "detail"),
    errors: getFieldErrors(value),
  };
}

function getString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const candidate = value[key];

  if (typeof candidate !== "string") {
    return undefined;
  }
  return candidate.trim() === "" ? undefined : candidate;
}

function getFieldErrors(
  value: Record<string, unknown>,
): Record<string, string[]> | undefined {
  const candidate = value.errors;

  if (!isRecord(candidate)) {
    return undefined;
  }

  const fieldErrors: Record<string, string[]> = {};

  for (const [key, val] of Object.entries(candidate)) {
    if (!Array.isArray(val)) {
      continue;
    }
    if (!val.every((item) => typeof item === "string")) {
      continue;
    }
    fieldErrors[key] = val;
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

function requireBody(value: unknown, displayTitle: string) {
  if (value === null) {
    throw new ApiError({
      kind: "invalid_response",
      displayTitle,
    });
  }
  return value;
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  displayTitle: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError({
      kind: "invalid_response",
      displayTitle,
      cause: result.error,
    });
  }
  return result.data;
}

export async function getTasks(): Promise<Task[]> {
  const errorDisplay = {
    title: "タスクの一覧の取得に失敗しました。",
  };

  const tasks = await request("/tasks", errorDisplay, {
    cache: "no-store",
  });
  return parseWithSchema(taskListSchema, tasks, errorDisplay.title);
}

export async function getTask(id: number): Promise<Task> {
  const errorDisplay = {
    title: "タスクの取得に失敗しました。",
    notFoundMessage: "対象のタスクが見つかりませんでした。",
  };

  const task = requireBody(
    await request(`/tasks/${id}`, errorDisplay, {
      cache: "no-store",
    }),
    errorDisplay.title,
  );

  return parseWithSchema(taskSchema, task, errorDisplay.title);
}

export async function addTask(task: TaskInput): Promise<Task> {
  const errorDisplay = {
    title: "タスクの作成に失敗しました。",
  };

  const createdTask = requireBody(
    await request("/tasks", errorDisplay, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }),
    errorDisplay.title,
  );

  return parseWithSchema(taskSchema, createdTask, errorDisplay.title);
}

export async function updateTask(id: number, task: TaskInput): Promise<void> {
  const errorDisplay = {
    title: "タスクの更新に失敗しました。",
  };

  await request(`/tasks/${id}`, errorDisplay, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
}

export async function deleteTask(id: number): Promise<void> {
  const errorDisplay = {
    title: "タスクの削除に失敗しました。",
    notFoundMessage: "削除対象のタスクが見つかりませんでした。",
  };

  await request(`/tasks/${id}`, errorDisplay, {
    method: "DELETE",
  });
}
