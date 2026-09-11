/**
 * Google Workspace REST API integrations (Drive, Calendar, Gmail).
 * Uses the OAuth Bearer token obtained client-side via Google Identity Services.
 */
import { requestGoogleAccessToken } from "./google-auth";

/* ==========================================================================
   GOOGLE DRIVE INTEGRATION
   ========================================================================== */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

export async function listDriveMedicalFiles(): Promise<GoogleDriveFile[]> {
  const token = await requestGoogleAccessToken();
  const query = encodeURIComponent(
    "trashed = false and (name contains 'prescription' or name contains 'rx' or name contains 'medical' or name contains 'lab' or name contains 'medora')",
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Drive API error: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function uploadPrescriptionToDrive(
  file: File | Blob,
  fileName: string,
): Promise<GoogleDriveFile> {
  const token = await requestGoogleAccessToken();

  const metadata = {
    name: fileName,
    mimeType: file.type || "application/pdf",
    description: "Prescription uploaded via Medora India Health Platform",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  form.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Drive Upload error: ${res.status} ${errorBody}`);
  }

  return await res.json();
}

/* ==========================================================================
   GOOGLE CALENDAR INTEGRATION
   ========================================================================== */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function listCalendarMedicationEvents(): Promise<
  GoogleCalendarEvent[]
> {
  const token = await requestGoogleAccessToken();
  const timeMin = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin,
    )}&maxResults=20&orderBy=startTime&singleEvents=true&q=medora`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createMedicationCalendarEvent(options: {
  summary: string;
  description: string;
  startTime: string; // ISO
  endTime: string; // ISO
  recurrenceDays?: number;
}): Promise<GoogleCalendarEvent> {
  const token = await requestGoogleAccessToken();

  const body: {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    recurrence?: string[];
  } = {
    summary: options.summary,
    description: `${options.description}\n\nManaged via Medora Healthcare`,
    start: {
      dateTime: options.startTime,
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    },
    end: {
      dateTime: options.endTime,
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    },
  };

  if (options.recurrenceDays && options.recurrenceDays > 1) {
    body.recurrence = [`RRULE:FREQ=DAILY;COUNT=${options.recurrenceDays}`];
  }

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Calendar Event error: ${res.status} ${errorBody}`);
  }

  return await res.json();
}

/* ==========================================================================
   GMAIL INTEGRATION
   ========================================================================== */

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function listMedicalEmails(): Promise<GmailMessageItem[]> {
  const token = await requestGoogleAccessToken();
  const query = encodeURIComponent(
    "prescription OR pharmacy OR medicine OR doctor OR 'apollo' OR '1mg' OR 'medora'",
  );
  const listRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!listRes.ok) {
    const errorBody = await listRes.text();
    throw new Error(`Gmail API error: ${listRes.status} ${errorBody}`);
  }

  const listData = await listRes.json();
  const messageRefs: { id: string; threadId: string }[] =
    listData.messages || [];

  const items: GmailMessageItem[] = await Promise.all(
    messageRefs.map(async (ref) => {
      try {
        const msgRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!msgRes.ok)
          return { id: ref.id, threadId: ref.threadId, snippet: "" };
        const msgData = await msgRes.json();

        const headers = msgData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find(
            (h: { name: string; value: string }) =>
              h.name.toLowerCase() === name.toLowerCase(),
          )?.value;

        return {
          id: ref.id,
          threadId: ref.threadId,
          snippet: msgData.snippet || "",
          subject: getHeader("Subject") || "No Subject",
          from: getHeader("From") || "Unknown Sender",
          date: getHeader("Date") || "",
        };
      } catch {
        return { id: ref.id, threadId: ref.threadId, snippet: "" };
      }
    }),
  );

  return items;
}

export async function sendEmailViaGmail(options: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<{ id: string; threadId: string }> {
  const token = await requestGoogleAccessToken();

  const utf8Subject = `=?utf-8?B?${btoa(
    unescape(encodeURIComponent(options.subject)),
  )}?=`;
  const emailLines = [
    `To: ${options.to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    options.bodyText,
  ];
  const email = emailLines.join("\r\n");

  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gmail Send error: ${res.status} ${errorBody}`);
  }

  return await res.json();
}
