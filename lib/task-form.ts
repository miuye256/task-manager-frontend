import { Task, TaskInput, taskInputSchema } from '@/lib/task';
import { toDateInputValue } from '@/lib/task-date';

export type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
};

export type FormMode = 'create' | 'edit';

export type TaskFormErrors = Partial<Record<keyof TaskFormState, string>>;

export function createEmptyForm(isComplete = false): TaskFormState {
  return {
    title: '',
    description: '',
    dueDate: '',
    isComplete,
  };
}

export function toFormState(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: toDateInputValue(task.dueDate),
    isComplete: task.isComplete,
  };
}

export function toTaskInput(form: TaskFormState): TaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    dueDate: form.dueDate || undefined,
    isComplete: form.isComplete,
  };
}

export function validateTaskForm(form: TaskFormState) {
  const result = taskInputSchema.safeParse(toTaskInput(form));

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  const errors: TaskFormErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (typeof field !== 'string') {
      continue;
    }

    const formField = field as keyof TaskFormState;

    if (errors[formField]) {
      continue;
    }

    errors[formField] = issue.message;
  }

  return {
    success: false as const,
    errors,
  };
}
