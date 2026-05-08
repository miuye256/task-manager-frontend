import { z } from "zod";

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  isComplete: z.boolean(),
});

const dueDateInputSchema = z
  .string()
  .refine(
    isValidDateOnly,
    "期限は YYYY-MM-DD 形式の正しい日付で入力してください。",
  );

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください。"),
  description: z.string().trim().optional(),
  dueDate: dueDateInputSchema.optional(),
  isComplete: z.boolean(),
});
export const taskPatchSchema = taskInputSchema.partial();

export const taskListSchema = z.array(taskSchema);

export type Task = z.infer<typeof taskSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskPatchInput = z.infer<typeof taskPatchSchema>;
