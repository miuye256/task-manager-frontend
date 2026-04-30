import { z } from "zod";

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  isComplete: z.boolean(),
});

export const taskInputSchema = taskSchema.omit({ id: true });

export const taskListSchema = z.array(taskSchema);

export type Task = z.infer<typeof taskSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskPatchInput = Partial<TaskInput>;
