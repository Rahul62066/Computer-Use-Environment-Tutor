import { google } from 'googleapis';
import { auth } from '@/auth';
import { dbServer } from '@/db/drizzle-server';
import { accounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getGoogleCalendarClient() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Get the user's Google OAuth tokens from the database
  const accountRecords = await dbServer
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, session.user.id),
        eq(accounts.provider, 'google')
      )
    )
    .limit(1);

  console.log('Account lookup for user:', session.user.id);
  console.log('Account records found:', accountRecords.length);
  if (accountRecords.length > 0) {
    console.log('Account data:', {
      provider: accountRecords[0].provider,
      hasAccessToken: !!accountRecords[0].access_token,
      hasRefreshToken: !!accountRecords[0].refresh_token,
      expiresAt: accountRecords[0].expires_at,
    });
  }

  if (!accountRecords || accountRecords.length === 0) {
    throw new Error('No Google account found. Please sign in with Google again.');
  }

  const account = accountRecords[0];

  if (!account.refresh_token) {
    throw new Error('No refresh token available. Please sign out and sign in again to re-authorize.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL || process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await dbServer
        .update(accounts)
        .set({
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          refresh_token: tokens.refresh_token,
        })
        .where(
          and(
            eq(accounts.userId, session.user.id),
            eq(accounts.provider, 'google')
          )
        );
    } else if (tokens.access_token) {
      await dbServer
        .update(accounts)
        .set({
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        })
        .where(
          and(
            eq(accounts.userId, session.user.id),
            eq(accounts.provider, 'google')
          )
        );
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createGoogleCalendarEvent(event: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  guests?: string;
}) {
  const calendar = await getGoogleCalendarClient();

  // Parse guest emails and format for Google Calendar
  const attendees = event.guests
    ? event.guests.split(',').map(email => ({ email: email.trim() })).filter(a => a.email)
    : [];

  const googleEvent: any = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startDateTime,
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: 'UTC',
    },
  };

  // Add attendees if provided
  if (attendees.length > 0) {
    googleEvent.attendees = attendees;
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: googleEvent,
    sendUpdates: attendees.length > 0 ? 'all' : 'none', // Send email invites if guests are added
  });

  return response.data.id; // Return Google Calendar event ID
}

export async function updateGoogleCalendarEvent(
  googleEventId: string,
  event: {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    guests?: string;
  }
) {
  const calendar = await getGoogleCalendarClient();

  // Parse guest emails and format for Google Calendar
  const attendees = event.guests
    ? event.guests.split(',').map(email => ({ email: email.trim() })).filter(a => a.email)
    : [];

  const googleEvent: any = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startDateTime,
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: 'UTC',
    },
  };

  // Add attendees if provided
  if (attendees.length > 0) {
    googleEvent.attendees = attendees;
  }

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: googleEvent,
    sendUpdates: attendees.length > 0 ? 'all' : 'none', // Send email updates if guests are added
  });
}

export async function deleteGoogleCalendarEvent(googleEventId: string) {
  const calendar = await getGoogleCalendarClient();

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
}

export async function getGoogleCalendarEvents(
  timeMin?: string,
  timeMax?: string
) {
  const calendar = await getGoogleCalendarClient();

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}
