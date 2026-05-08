"use client";

import type { FormEvent } from "react";

import { startTransition, useState } from "react";

import { BoardLoading } from "@/components/board-loading";
import { TaskColumn } from "@/components/task-column";
import { TaskSheet } from "@/components/task-sheet";
import { useTasks } from "@/hooks/use-tasks";
import { getErrorMessage } from "@/lib/error-message";
import {
  createEmptyForm,
  FormMode,
  TaskFormErrors,
  TaskFormState,
  toFormState,
  validateTaskForm,
} from "@/lib/task-form";
import { sortTasks } from "@/lib/task-date";
import { Task } from "@/lib/task";

export function TaskBoard() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskFormState>(createEmptyForm());
  const [fieldErrors, setFieldErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const {
    tasks,
    errorMessage,
    isLoading,
    isRefreshing,
    isSubmitting,
    clearError,
    refreshTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useTasks();

  function openCreateSheet(isComplete = false) {
    setFormMode("create");
    setEditingTaskId(null);
    setForm(createEmptyForm(isComplete));
    setFieldErrors({});
    setFormError(null);
    setIsSheetOpen(true);
  }

  function openEditSheet(task: Task) {
    setFormMode("edit");
    setEditingTaskId(task.id);
    setForm(toFormState(task));
    setFieldErrors({});
    setFormError(null);
    setIsSheetOpen(true);
  }

  function closeSheet() {
    if (isSubmitting) {
      return;
    }

    setIsSheetOpen(false);
    setFieldErrors({});
    setFormError(null);
  }

  function updateForm(patch: Partial<TaskFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));

    setFormError(null);
    setFieldErrors((current) => {
      const next = { ...current };

      for (const key of Object.keys(patch) as Array<keyof TaskFormState>) {
        delete next[key];
      }

      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateTaskForm(form);

    if (!validation.success) {
      setFieldErrors(validation.errors);
      setFormError("入力内容を確認してください。");
      return;
    }

    clearError();
    setFieldErrors({});
    setFormError(null);

    try {
      if (formMode === "create") {
        await createTask(validation.data);
      } else if (editingTaskId !== null) {
        await updateTask(editingTaskId, validation.data);
      }

      startTransition(() => {
        setIsSheetOpen(false);
        setEditingTaskId(null);
        setForm(createEmptyForm());
        setFieldErrors({});
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
    }
  }

  async function handleToggle(task: Task) {
    await toggleTask(task);
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

    clearError();
    setFormError(null);

    try {
      await deleteTask(editingTaskId);

      startTransition(() => {
        setIsSheetOpen(false);
        setEditingTaskId(null);
        setForm(createEmptyForm());
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "タスクの削除に失敗しました。"));
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
                onClick={() => void refreshTasks()}
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

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
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

      <TaskSheet
        isOpen={isSheetOpen}
        formMode={formMode}
        form={form}
        fieldErrors={fieldErrors}
        formError={formError}
        isSubmitting={isSubmitting}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        onDelete={() => void handleDelete()}
        onFormChange={updateForm}
      />
    </div>
  );
}
