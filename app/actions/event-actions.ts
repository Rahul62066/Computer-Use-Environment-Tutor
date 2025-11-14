'use server'

import { dbServer } from "@/db/drizzle-server";
import { eventsTable } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/lib/google-calendar";
import dayjs from "dayjs";


export async function createEvent(formData:  FormData): Promise<{ error: string } | { success: boolean } > {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to create events' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const guests = formData.get('guests') as string;


  if (!title || !description || !date || !time) {
    return { error: 'All fields are required' };
  }

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  try {
    // Create event in Google Calendar first
    const googleEventId = await createGoogleCalendarEvent({
      title,
      description,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      guests: guests || undefined,
    });

    // Then save to our database with the Google Calendar event ID
    await dbServer.insert(eventsTable).values({
        userId: session.user.id,
        googleEventId,
        title,
        description,
        date: startDateTime,
        endDate: endDateTime,
        guests: guests || null,
      });

      // Revalidate the path and return a success response
    revalidatePath("/");

    return { success: true };  // Return success instead of revalidatePath directly

  } catch (error) {
    console.error('Error creating event:', error);
    return { error: 'Failed to create event. Make sure you have granted calendar permissions.' };
  }
}

export async function getEvents() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    const events = await dbServer
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, session.user.id));

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function updateEvent(
  eventId: number,
  data: {
    title: string;
    description: string;
    date: Date;
    endDate: Date;
    guests?: string;
  }
): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to update events' };
  }

  try {
    // Get the event from database to get the Google Calendar event ID
    const event = await dbServer
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1);

    if (!event || event.length === 0) {
      return { error: 'Event not found' };
    }

    if (event[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    // Update in Google Calendar if we have a Google event ID
    if (event[0].googleEventId) {
      await updateGoogleCalendarEvent(event[0].googleEventId, {
        title: data.title,
        description: data.description,
        startDateTime: data.date.toISOString(),
        endDateTime: data.endDate.toISOString(),
        guests: data.guests,
      });
    }

    // Update in our database
    await dbServer
      .update(eventsTable)
      .set({
        title: data.title,
        description: data.description,
        date: data.date,
        endDate: data.endDate,
        guests: data.guests || null,
      })
      .where(eq(eventsTable.id, eventId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return { error: 'Failed to update event' };
  }
}

export async function deleteEvent(eventId: number): Promise<{ error: string } | { success: boolean }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'You must be signed in to delete events' };
  }

  try {
    // Get the event from database to get the Google Calendar event ID
    const event = await dbServer
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1);

    if (!event || event.length === 0) {
      return { error: 'Event not found' };
    }

    if (event[0].userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    // Delete from Google Calendar if we have a Google event ID
    if (event[0].googleEventId) {
      await deleteGoogleCalendarEvent(event[0].googleEventId);
    }

    // Delete from our database
    await dbServer
      .delete(eventsTable)
      .where(eq(eventsTable.id, eventId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { error: 'Failed to delete event' };
  }
}