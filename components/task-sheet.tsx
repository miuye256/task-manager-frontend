import type { FormEvent } from 'react';

import { FormMode, TaskFormState } from '@/lib/task-form';

type TaskSheetProps = {
  isOpen: boolean;
  formMode: FormMode;
  form: TaskFormState;
  formError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onFormChange: (patch: Partial<TaskFormState>) => void;
};

export function TaskSheet({
  isOpen,
  formMode,
  form,
  formError,
  isSubmitting,
  onClose,
  onSubmit,
  onDelete,
  onFormChange,
}: TaskSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-black/5 bg-[#fcfbf8] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                {formMode === 'create' ? '新規カード' : 'カードを編集'}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                {formMode === 'create' ? 'タスクを追加' : 'タスクを更新'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/5 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              閉じる
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col">
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
                onChange={(event) => onFormChange({ title: event.target.value })}
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
                  onFormChange({ description: event.target.value })
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
                onChange={(event) => onFormChange({ dueDate: event.target.value })}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
              <input
                type="checkbox"
                checked={form.isComplete}
                onChange={(event) =>
                  onFormChange({ isComplete: event.target.checked })
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
              {formMode === 'edit' ? (
                <button
                  type="button"
                  onClick={onDelete}
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
                  onClick={onClose}
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
                    ? '保存中...'
                    : formMode === 'create'
                      ? 'タスクを作成'
                      : '変更を保存'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
