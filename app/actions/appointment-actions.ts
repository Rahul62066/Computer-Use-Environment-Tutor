'use server'

import { dbServer } from "@/db/drizzle-server";
import { appointmentsTable } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/lib/google-calendar";

export async function createAppointment(formData: FormData): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to create appointments' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const duration = formData.get('duration') as string;
  const location = formData.get('location') as string;
  const guests = formData.get('guests') as string;

  if (!title || !date || !time) {
    return { error: 'Title, date, and time are required' };
  }

  const startDateTime = new Date(`${date}T${time}:00`);
  const durationMinutes = duration ? parseInt(duration) : 60;
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  try {
    // Create appointment in Google Calendar
    const googleEventId = await createGoogleCalendarEvent({
      title,
      description,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      guests: guests || undefined,
    });

    // Save to database
    await dbServer.insert(appointmentsTable).values({
      userId: session.user.id,
      googleEventId,
      title,
      description: description || null,
      startDate: startDateTime,
      endDate: endDateTime,
      duration: durationMinutes,
      location: location || null,
      guests: guests || null,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { error: 'Failed to create appointment' };
  }
}

export async function getAppointments() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const appointments = await dbServer
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.userId, session.user.id));

    return appointments;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export async function updateAppointment(
  appointmentId: number,
  data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    duration?: number;
    location?: string;
    guests?: string;
  }
): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to update appointments' };
  }

  try {
    const appointment = await dbServer
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      return { error: 'Appointment not found' };
    }

    if (appointment[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    // Update in Google Calendar if we have a Google event ID
    if (appointment[0].googleEventId) {
      await updateGoogleCalendarEvent(appointment[0].googleEventId, {
        title: data.title,
        description: data.description || '',
        startDateTime: data.startDate.toISOString(),
        endDateTime: data.endDate.toISOString(),
        guests: data.guests,
      });
    }

    // Update in database
    await dbServer
      .update(appointmentsTable)
      .set({
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        location: data.location || null,
        guests: data.guests || null,
      })
      .where(eq(appointmentsTable.id, appointmentId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { error: 'Failed to update appointment' };
  }
}

export async function deleteAppointment(appointmentId: number): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to delete appointments' };
  }

  try {
    const appointment = await dbServer
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      return { error: 'Appointment not found' };
    }

    if (appointment[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    // Delete from Google Calendar if we have a Google event ID
    if (appointment[0].googleEventId) {
      await deleteGoogleCalendarEvent(appointment[0].googleEventId);
    }

    // Delete from database
    await dbServer
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { error: 'Failed to delete appointment' };
  }
}
