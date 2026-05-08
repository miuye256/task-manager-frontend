import { Task, TaskInput } from '@/lib/task';
import { toDateInputValue } from '@/lib/task-date';

export type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
};

export type FormMode = 'create' | 'edit';

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
