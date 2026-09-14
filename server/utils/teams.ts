// Microsoft Teams meetings — created as an online-meeting calendar event on the
// coach's Outlook calendar via Microsoft Graph (app-only / client-credentials
// OAuth, reusing the same Azure app already used for availability).
//
// Requires, in addition to the availability setup (AZURE_TENANT_ID,
// AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, MS_ORGANIZER_EMAIL): the Graph
// APPLICATION permission `Calendars.ReadWrite` granted with admin consent.
import getGraphClient from "../controllers/graphClients.js";

export function isTeamsConfigured(): boolean {
  return Boolean(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.MS_ORGANIZER_EMAIL
  );
}

export interface TeamsMeeting { joinUrl: string; eventId: string; }

/** Create a Teams online-meeting event on the organizer's calendar. */
export async function createTeamsMeeting(opts: {
  subject: string;
  startISO: string;
  endISO: string;
  timezone?: string;       // IANA tz
  bodyHtml?: string;
  attendeeEmail?: string;
}): Promise<TeamsMeeting> {
  const organizer = process.env.MS_ORGANIZER_EMAIL as string;
  const tz = opts.timezone ?? "India Standard Time"; // Graph uses Windows tz names

  const event: Record<string, unknown> = {
    subject: opts.subject,
    body: { contentType: "HTML", content: opts.bodyHtml ?? "" },
    start: { dateTime: opts.startISO, timeZone: tz },
    end: { dateTime: opts.endISO, timeZone: tz },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };
  if (opts.attendeeEmail) {
    event.attendees = [
      { emailAddress: { address: opts.attendeeEmail }, type: "required" },
    ];
  }

  const created = await getGraphClient()
    .api(`/users/${organizer}/events`)
    .post(event);

  const joinUrl: string | undefined = created?.onlineMeeting?.joinUrl;
  if (!joinUrl) throw new Error("Teams meeting link was not returned by Graph.");
  return { joinUrl, eventId: created.id };
}

/** Best-effort cancellation of a Teams event by id. */
export async function deleteTeamsEvent(eventId: string): Promise<void> {
  if (!isTeamsConfigured() || !eventId) return;
  try {
    const organizer = process.env.MS_ORGANIZER_EMAIL as string;
    await getGraphClient().api(`/users/${organizer}/events/${eventId}`).delete();
  } catch (err: any) {
    console.error("Teams event delete error:", err?.message);
  }
}
