import { Task } from '@/lib/task';

type DueBadge = {
  label: string;
  className: string;
};

function parseTaskDate(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes('T') ? value : `${value}T00:00:00`;
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

export function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : '';
}

export function formatDateLabel(value?: string) {
  const date = parseTaskDate(value);

  if (!date) {
    return '期限なし';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function getDueBadge(task: Task): DueBadge {
  if (!task.dueDate) {
    return {
      label: '期限なし',
      className: 'bg-zinc-100 text-zinc-600',
    };
  }

  if (task.isComplete) {
    return {
      label: '完了済み',
      className: 'bg-emerald-100 text-emerald-700',
    };
  }

  const dueDate = parseTaskDate(task.dueDate);

  if (!dueDate) {
    return {
      label: '期限あり',
      className: 'bg-zinc-100 text-zinc-600',
    };
  }

  const dayDifference = getDayDifference(
    startOfDay(new Date()),
    startOfDay(dueDate),
  );

  if (dayDifference < 0) {
    return {
      label: '期限切れ',
      className: 'bg-rose-100 text-rose-700',
    };
  }

  if (dayDifference === 0) {
    return {
      label: '今日まで',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (dayDifference === 1) {
    return {
      label: '明日まで',
      className: 'bg-sky-100 text-sky-700',
    };
  }

  return {
    label: '予定あり',
    className: 'bg-zinc-100 text-zinc-600',
  };
}

export function sortTasks(tasks: Task[]) {
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
