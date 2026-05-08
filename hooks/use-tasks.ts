import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { addTask, deleteTask, getTasks, patchTask, updateTask } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { Task, TaskInput, TaskPatchInput } from "@/lib/task";
import { useState } from "react";

type UpdateTaskVariables = {
  id: number;
  task: TaskInput;
};

type PatchTaskVariables = {
  id: number;
  task: TaskPatchInput;
};

const tasksQueryKey = ["tasks"] as const;

export function useTasks() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: tasks = [],
    error: tasksQueryError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: getTasks,
  });

  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: tasksQueryKey });

  const createTaskMutation = useMutation({
    mutationFn: addTask,
    onSuccess: invalidateTasks,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: UpdateTaskVariables) => updateTask(id, task),
    onSuccess: invalidateTasks,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, task }: PatchTaskVariables) => patchTask(id, task),
    onSuccess: invalidateTasks,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidateTasks,
  });

  const isSubmitting =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    toggleTaskMutation.isPending ||
    deleteTaskMutation.isPending;

  const errorMessage =
    actionError ??
    (tasksQueryError
      ? getErrorMessage(tasksQueryError, "タスクの読み込みに失敗しました。")
      : null);

  function clearError() {
    setActionError(null);
  }

  async function refreshTasks() {
    clearError();
    await refetch();
  }

  async function createTask(task: TaskInput) {
    clearError();
    return await createTaskMutation.mutateAsync(task);
  }

  async function saveTask(id: number, task: TaskInput) {
    clearError();
    await updateTaskMutation.mutateAsync({ id, task });
  }

  async function toggleTask(task: Task) {
    clearError();

    try {
      await toggleTaskMutation.mutateAsync({
        id: task.id,
        task: {
          isComplete: !task.isComplete,
        },
      });
    } catch (error) {
      setActionError(getErrorMessage(error, "タスク状態の更新に失敗しました。"));
    }
  }

  async function removeTask(id: number) {
    clearError();
    await deleteTaskMutation.mutateAsync(id);
  }

  return {
    tasks,
    errorMessage,
    isLoading,
    isRefreshing: isRefetching,
    isSubmitting,
    clearError,
    refreshTasks,
    createTask,
    updateTask: saveTask,
    toggleTask,
    deleteTask: removeTask,
  };
}
