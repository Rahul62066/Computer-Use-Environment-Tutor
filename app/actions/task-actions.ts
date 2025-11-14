'use server'

import { dbServer } from "@/db/drizzle-server";
import { tasksTable } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function createTask(formData: FormData): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to create tasks' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const dueDate = formData.get('dueDate') as string;

  if (!title) {
    return { error: 'Title is required' };
  }

  try {
    await dbServer.insert(tasksTable).values({
      userId: session.user.id,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: 0,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: 'Failed to create task' };
  }
}

export async function getTasks() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const tasks = await dbServer
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, session.user.id));

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function updateTask(
  taskId: number,
  data: {
    title: string;
    description?: string;
    dueDate?: Date | null;
    completed?: number;
  }
): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to update tasks' };
  }

  try {
    const task = await dbServer
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return { error: 'Task not found' };
    }

    if (task[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    await dbServer
      .update(tasksTable)
      .set({
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate || null,
        completed: data.completed !== undefined ? data.completed : task[0].completed,
      })
      .where(eq(tasksTable.id, taskId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return { error: 'Failed to update task' };
  }
}

export async function toggleTaskComplete(taskId: number): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to update tasks' };
  }

  try {
    const task = await dbServer
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return { error: 'Task not found' };
    }

    if (task[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    await dbServer
      .update(tasksTable)
      .set({
        completed: task[0].completed === 1 ? 0 : 1,
      })
      .where(eq(tasksTable.id, taskId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { error: 'Failed to toggle task' };
  }
}

export async function deleteTask(taskId: number): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to delete tasks' };
  }

  try {
    const task = await dbServer
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return { error: 'Task not found' };
    }

    if (task[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    await dbServer
      .delete(tasksTable)
      .where(eq(tasksTable.id, taskId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error: 'Failed to delete task' };
  }
}
