"use client";

import { Task, TaskInput } from "@/lib/task";
import { startTransition, useEffect, useState } from "react";
import { addTask, deleteTask, getTasks, updateTask } from "@/lib/api";

type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
};

type FormMode = "create" | "edit";

type TaskColumnProps = {
  title: string;
  description: string;
  tasks: Task[];
  emptyTitle: string;
  emptyDescription: string;
  completeOnCreate: boolean;
  onCreate: (isComplete: boolean) => void;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
};

function createEmptyForm(isComplete = false): TaskFormState {
  return {
    title: "",
    description: "",
    dueDate: "",
    isComplete,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toFormState(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? "",
    dueDate: toDateInputValue(task.dueDate),
    isComplete: task.isComplete,
  };
}

function toTaskInput(form: TaskFormState): TaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    dueDate: form.dueDate || undefined,
    isComplete: form.isComplete,
  };
}

function parseTaskDate(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(from: Date, to: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay);
}

function formatDateLabel(value?: string) {
  const date = parseTaskDate(value);

  if (!date) {
    return "期限なし";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getDueBadge(task: Task) {
  if (!task.dueDate) {
    return {
      label: "期限なし",
      className: "bg-zinc-100 text-zinc-600",
    };
  }

  if (task.isComplete) {
    return {
      label: "完了済み",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  const dueDate = parseTaskDate(task.dueDate);

  if (!dueDate) {
    return {
      label: "期限あり",
      className: "bg-zinc-100 text-zinc-600",
    };
  }

  const dayDifference = getDayDifference(
    startOfDay(new Date()),
    startOfDay(dueDate),
  );

  if (dayDifference < 0) {
    return {
      label: "期限切れ",
      className: "bg-rose-100 text-rose-700",
    };
  }

  if (dayDifference === 0) {
    return {
      label: "今日まで",
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (dayDifference === 1) {
    return {
      label: "明日まで",
      className: "bg-sky-100 text-sky-700",
    };
  }

  return {
    label: "予定あり",
    className: "bg-zinc-100 text-zinc-600",
  };
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (!left.dueDate && !right.dueDate) {
      return left.id - right.id;
    }

    if (!left.dueDate) {
      return 1;
    }

    if (!right.dueDate) {
      return -1;
    }

    return left.dueDate.localeCompare(right.dueDate);
  });
}

function BoardLoading() {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4">
      {[0, 1].map((column) => (
        <section
          key={column}
          className="min-w-[min(22rem,calc(100vw-2rem))] flex-1 rounded-[28px] border border-black/5 bg-[#ece8df] p-4"
        >
          <div className="mb-4 h-6 w-40 animate-pulse rounded-full bg-white/80" />
          <div className="space-y-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm shadow-zinc-950/5"
              >
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskColumn({
  title,
  description,
  tasks,
  emptyTitle,
  emptyDescription,
  completeOnCreate,
  onCreate,
  onEdit,
  onToggle,
}: TaskColumnProps) {
  return (
    <section className="min-w-[min(22rem,calc(100vw-2rem))] flex-1 rounded-[28px] border border-black/5 bg-[#ece8df] p-4 shadow-inner shadow-white/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-500">
              {tasks.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => onCreate(completeOnCreate)}
          className="rounded-full border border-black/5 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          追加
        </button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white/70 px-4 py-6 text-sm text-zinc-500">
            <p className="font-medium text-zinc-700">{emptyTitle}</p>
            <p className="mt-1">{emptyDescription}</p>
          </div>
        ) : null}

        {tasks.map((task) => {
          const dueBadge = getDueBadge(task);

          return (
            <article
              key={task.id}
              className="rounded-3xl border border-white/80 bg-white p-4 shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggle(task)}
                  aria-label={task.isComplete ? "未完了に戻す" : "完了にする"}
                  className="mt-0.5 shrink-0 rounded-full p-0.5 transition hover:scale-105"
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border ${
                      task.isComplete
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-300 bg-white"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        task.isComplete ? "bg-white" : "bg-transparent"
                      }`}
                    />
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-6 text-zinc-900">
                      {task.title}
                    </h3>

                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                    >
                      編集
                    </button>
                  </div>

                  {task.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                      {task.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-400">
                      説明はまだありません。
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${dueBadge.className}`}
                    >
                      {dueBadge.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDateLabel(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskFormState>(createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadTasks(options?: { initial?: boolean }) {
    if (options?.initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const nextTasks = await getTasks();
      startTransition(() => {
        setTasks(nextTasks);
      });
    } catch (error) {
      setError(getErrorMessage(error, "タスクの読み込みに失敗しました。"));
    } finally {
      if (options?.initial) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialTasks() {
      setIsLoading(true);
      setError(null);

      try {
        const nextTasks = await getTasks();

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setTasks(nextTasks);
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(getErrorMessage(error, "タスクの読み込みに失敗しました。"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateSheet(isComplete = false) {
    setFormMode("create");
    setEditingTaskId(null);
    setForm(createEmptyForm(isComplete));
    setFormError(null);
    setIsSheetOpen(true);
  }

  function openEditSheet(task: Task) {
    setFormMode("edit");
    setEditingTaskId(task.id);
    setForm(toFormState(task));
    setFormError(null);
    setIsSheetOpen(true);
  }

  function closeSheet() {
    if (isSubmitting) {
      return;
    }

    setIsSheetOpen(false);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = toTaskInput(form);

    if (!input.title) {
      setFormError("タイトルを入力してください。");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (formMode === "create") {
        await addTask(input);
      } else if (editingTaskId !== null) {
        await updateTask(editingTaskId, input);
      }

      await loadTasks();

      startTransition(() => {
        setIsSheetOpen(false);
        setEditingTaskId(null);
        setForm(createEmptyForm());
      });
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          formMode === "create"
            ? "タスクの作成に失敗しました。"
            : "タスクの更新に失敗しました。",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: toDateInputValue(task.dueDate) || undefined,
        isComplete: !task.isComplete,
      });
      await loadTasks();
    } catch (error) {
      setError(getErrorMessage(error, "タスク状態の更新に失敗しました。"));
    }
  }

  async function handleDelete() {
    if (editingTaskId === null || isSubmitting) {
      return;
    }

    const taskTitle =
      tasks.find((task) => task.id === editingTaskId)?.title ?? "このタスク";

    if (!window.confirm(`「${taskTitle}」を削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await deleteTask(editingTaskId);
      await loadTasks();

      startTransition(() => {
        setIsSheetOpen(false);
        setEditingTaskId(null);
        setForm(createEmptyForm());
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "タスクの削除に失敗しました。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const todoTasks = sortTasks(tasks.filter((task) => !task.isComplete));
  const doneTasks = sortTasks(tasks.filter((task) => task.isComplete));

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#f6f5f2] text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[32px] border border-black/5 bg-white/80 px-5 py-5 shadow-sm shadow-zinc-950/5 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">Task Manager</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                タスクボード
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3 text-sm text-zinc-600">
                <span className="font-medium text-zinc-900">
                  未着手 {todoTasks.length}
                </span>
                <span className="mx-2 text-zinc-300">/</span>
                <span className="font-medium text-zinc-900">
                  完了 {doneTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void loadTasks()}
                disabled={isLoading || isRefreshing}
                className="rounded-full border border-black/5 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing ? "更新中..." : "再読み込み"}
              </button>

              <button
                type="button"
                onClick={() => openCreateSheet(false)}
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                新規タスク
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <BoardLoading />
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4">
            <TaskColumn
              title="未着手"
              description="着手前または進行中のタスク"
              tasks={todoTasks}
              emptyTitle="まだタスクがありません。"
              emptyDescription="右上の新規タスク、またはこの列の追加ボタンから最初のカードを作成できます。"
              completeOnCreate={false}
              onCreate={openCreateSheet}
              onEdit={openEditSheet}
              onToggle={handleToggle}
            />

            <TaskColumn
              title="完了"
              description="完了済みとして保存されたタスク"
              tasks={doneTasks}
              emptyTitle="完了したタスクはまだありません。"
              emptyDescription="カード左上の丸いボタンで完了切替ができます。"
              completeOnCreate={true}
              onCreate={openCreateSheet}
              onEdit={openEditSheet}
              onToggle={handleToggle}
            />
          </div>
        )}
      </div>

      {isSheetOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35 backdrop-blur-[2px]"
          onClick={closeSheet}
        >
          <aside
            className="flex h-full w-full max-w-xl flex-col border-l border-black/5 bg-[#fcfbf8] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-black/5 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    {formMode === "create" ? "新規カード" : "カードを編集"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                    {formMode === "create" ? "タスクを追加" : "タスクを更新"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeSheet}
                  className="rounded-full border border-black/5 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  閉じる
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {formError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {formError}
                  </div>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-800">
                    タイトル
                  </span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="例: 来週のデモ資料を仕上げる"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-800">
                    説明
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={6}
                    placeholder="補足メモや依頼内容をここに書けます。"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-800">
                    期限
                  </span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
                  <input
                    type="checkbox"
                    checked={form.isComplete}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isComplete: event.target.checked,
                      }))
                    }
                    className="size-4 rounded border-zinc-300 text-zinc-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      完了として保存
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      チェックすると完了列に移動します。
                    </p>
                  </div>
                </label>
              </div>

              <div className="border-t border-black/5 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {formMode === "edit" ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isSubmitting}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      削除する
                    </button>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      保存後はカードとしてボードに並びます。
                    </p>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeSheet}
                      disabled={isSubmitting}
                      className="rounded-full border border-black/5 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      キャンセル
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting
                        ? "保存中..."
                        : formMode === "create"
                          ? "タスクを作成"
                          : "変更を保存"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
