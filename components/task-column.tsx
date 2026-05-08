import { Task } from '@/lib/task';
import { formatDateLabel, getDueBadge } from '@/lib/task-date';

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

export function TaskColumn({
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
                  aria-label={task.isComplete ? '未完了に戻す' : '完了にする'}
                  className="mt-0.5 shrink-0 rounded-full p-0.5 transition hover:scale-105"
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border ${
                      task.isComplete
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full ${
                        task.isComplete ? 'bg-white' : 'bg-transparent'
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
