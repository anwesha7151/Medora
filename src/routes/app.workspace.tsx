import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  Cloud,
  FileText,
  Mail,
  Send,
  Plus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/primitives";
import { useStore } from "@/lib/store";
import {
  getStoredGoogleToken,
  requestGoogleAccessToken,
  clearGoogleToken,
} from "@/lib/google-auth";
import {
  listDriveMedicalFiles,
  uploadPrescriptionToDrive,
  listCalendarMedicationEvents,
  createMedicationCalendarEvent,
  listMedicalEmails,
  sendEmailViaGmail,
  type GoogleDriveFile,
  type GoogleCalendarEvent,
  type GmailMessageItem,
} from "@/lib/google-workspace";

export const Route = createFileRoute("/app/workspace")({
  head: () => ({
    meta: [
      { title: "Google Workspace Hub — Medora" },
      {
        name: "description",
        content:
          "Sync prescriptions with Google Drive, schedule dose alerts on Google Calendar, and send refill requests via Gmail.",
      },
    ],
  }),
  component: GoogleWorkspacePage,
});

function GoogleWorkspacePage() {
  const { state } = useStore();
  const [token, setToken] = useState<string | null>(getStoredGoogleToken());
  const [connecting, setConnecting] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(
    [],
  );
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Gmail state
  const [emails, setEmails] = useState<GmailMessageItem[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("support@apollo247.com");
  const [emailSubject, setEmailSubject] = useState(
    "Refill Request: Glycomet 500 SR (Order MD-4821)",
  );
  const [emailBody, setEmailBody] = useState(
    `Dear Pharmacist,\n\nI would like to request a refill for my regular prescription:\n- Medicine: Glycomet 500 SR (Metformin 500 mg)\n- Pack: 20 Tablets\n- Patient: ${state.profile.fullName}\n- Location: ${state.profile.city}\n\nPlease confirm availability and pickup time.\n\nThank you,\n${state.profile.fullName}`,
  );

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const accessToken = await requestGoogleAccessToken();
      setToken(accessToken);
      toast.success("Connected to Google Workspace", {
        description: "Gmail, Google Calendar, and Google Drive are now active.",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect Google account";
      toast.error("Google Connection Failed", { description: msg });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleToken();
    setToken(null);
    setDriveFiles([]);
    setCalendarEvents([]);
    setEmails([]);
    toast.info("Disconnected from Google Workspace");
  };

  const loadAllData = async () => {
    loadDrive();
    loadCalendar();
    loadGmail();
  };

  const loadDrive = async () => {
    try {
      setLoadingDrive(true);
      const files = await listDriveMedicalFiles();
      setDriveFiles(files);
    } catch (err) {
      console.warn("Drive fetch error:", err);
    } finally {
      setLoadingDrive(false);
    }
  };

  const loadCalendar = async () => {
    try {
      setLoadingCalendar(true);
      const events = await listCalendarMedicationEvents();
      setCalendarEvents(events);
    } catch (err) {
      console.warn("Calendar fetch error:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const loadGmail = async () => {
    try {
      setLoadingGmail(true);
      const msgs = await listMedicalEmails();
      setEmails(msgs);
    } catch (err) {
      console.warn("Gmail fetch error:", err);
    } finally {
      setLoadingGmail(false);
    }
  };

  const handleUploadSamplePrescription = async () => {
    try {
      setUploadingDrive(true);
      const blob = new Blob(
        [
          `MEDORA INDIA DIGITAL PRESCRIPTION RECORD\n` +
            `========================================\n` +
            `Patient: ${state.profile.fullName}\n` +
            `City: ${state.profile.city}\n` +
            `Date: ${new Date().toLocaleDateString()}\n\n` +
            `PRESCRIBED MEDICINES:\n` +
            `1. Glycomet 500 SR (Metformin Hydrochloride 500 mg) - 1 tab twice daily\n` +
            `2. Pan-D Capsule (Pantoprazole + Domperidone) - 1 cap daily empty stomach\n\n` +
            `Allergies on File: ${state.profile.allergies.join(", ") || "None"}\n` +
            `Prescriber: Dr. Rajesh Sharma (Apollo Clinics, Bengaluru)\n`,
        ],
        { type: "text/plain" },
      );

      const file = new File(
        [blob],
        `Medora-Prescription-${state.profile.fullName.replace(/\s+/g, "_")}-${Date.now()}.txt`,
        { type: "text/plain" },
      );

      await uploadPrescriptionToDrive(file, file.name);
      toast.success("Uploaded to Google Drive", {
        description: `${file.name} is saved safely in your Google Drive.`,
      });
      loadDrive();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Drive Upload Failed", { description: msg });
    } finally {
      setUploadingDrive(false);
    }
  };

  const handleSyncRemindersToCalendar = async () => {
    try {
      setSyncingCalendar(true);
      const activeReminders = state.reminders.filter((r) => r.active);
      if (activeReminders.length === 0) {
        toast.info("No active reminders to sync");
        return;
      }

      let count = 0;
      for (const rem of activeReminders) {
        for (const time of rem.times) {
          const parts = time.split(":");
          const hours = Number(parts[0]) || 8;
          const mins = Number(parts[1]) || 0;
          const start = new Date();
          start.setHours(hours, mins, 0, 0);
          if (start.getTime() < Date.now()) {
            start.setDate(start.getDate() + 1);
          }
          const end = new Date(start.getTime() + 15 * 60000);

          await createMedicationCalendarEvent({
            summary: `💊 Dose Reminder: ${rem.medicineName} ${rem.strength}`,
            description: `${rem.instruction}\nStrength: ${rem.strength}\nPrescription Ref: ${rem.sourcePrescriptionId || "Direct Entry"}`,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            recurrenceDays: 14,
          });
          count++;
        }
      }

      toast.success("Calendar Synced Successfully", {
        description: `Created ${count} recurring medication reminder events in Google Calendar.`,
      });
      loadCalendar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Calendar sync failed";
      toast.error("Calendar Sync Failed", { description: msg });
    } finally {
      setSyncingCalendar(false);
    }
  };

  const handleSendGmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast.error("Please fill in recipient, subject, and email body.");
      return;
    }

    try {
      setSendingEmail(true);
      await sendEmailViaGmail({
        to: emailTo,
        subject: emailSubject,
        bodyText: emailBody,
      });
      toast.success("Email Sent via Gmail", {
        description: `Refill message dispatched to ${emailTo}`,
      });
      loadGmail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      toast.error("Gmail Dispatch Error", { description: msg });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Workspace Medical Hub"
        description="Seamlessly bridge your prescriptions, medication calendar, and pharmacy communications with Google Drive, Google Calendar, and Gmail."
      />

      {/* Connection Banner */}
      <div className="surface p-5 border border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Cloud className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">
                  Google Workspace Integration
                </h2>
                {token ? (
                  <Badge
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                  >
                    <CheckCircle2 className="size-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Clock className="size-3" /> Action Needed
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authorized for Google Drive (Documents), Google Calendar (Dose
                Scheduling), and Gmail (Refills).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadAllData}
                  disabled={loadingDrive || loadingCalendar || loadingGmail}
                  className="h-9 text-xs"
                >
                  <RefreshCw
                    className={`mr-1.5 size-3.5 ${
                      loadingDrive || loadingCalendar || loadingGmail
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Refresh All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDisconnect}
                  className="h-9 text-xs text-muted-foreground hover:text-destructive"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="h-9 text-xs gap-1.5"
              >
                <Sparkles className="size-3.5" />
                {connecting
                  ? "Authorizing Google..."
                  : "Connect Google Workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Drive, Calendar, and Gmail */}
      <Tabs defaultValue="drive" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="drive" className="gap-2 text-xs">
            <FileText className="size-3.5" /> Google Drive
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 text-xs">
            <Calendar className="size-3.5" /> Google Calendar
          </TabsTrigger>
          <TabsTrigger value="gmail" className="gap-2 text-xs">
            <Mail className="size-3.5" /> Gmail Refills
          </TabsTrigger>
        </TabsList>

        {/* GOOGLE DRIVE TAB */}
        <TabsContent value="drive" className="space-y-4">
          <div className="surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Prescription & Lab Documents in Google Drive
                </h3>
                <p className="text-xs text-muted-foreground">
                  Safely back up prescription scans, doctor notes, and
                  diagnostic reports to your Google Drive.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadDrive}
                  disabled={!token || loadingDrive}
                  className="h-8 text-xs"
                >
                  <RefreshCw
                    className={`mr-1 size-3 ${loadingDrive ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleUploadSamplePrescription}
                  disabled={!token || uploadingDrive}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="size-3.5" />
                  {uploadingDrive ? "Uploading..." : "Save Active Rx to Drive"}
                </Button>
              </div>
            </div>

            {!token ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm font-semibold text-ink">
                  Google Drive is not connected
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click Connect Google Workspace above to view and upload
                  medical documents.
                </p>
                <Button
                  size="sm"
                  onClick={handleConnect}
                  className="mt-4 text-xs"
                >
                  Connect Google Drive
                </Button>
              </div>
            ) : loadingDrive ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                Querying Google Drive files...
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-3">
                <FileText className="mx-auto size-8 text-muted-foreground opacity-50" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    No medical documents found in Drive
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload your digital prescription record to keep a safe,
                    portable cloud backup.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleUploadSamplePrescription}
                  disabled={uploadingDrive}
                >
                  <Plus className="mr-1 size-3.5" /> Upload Current Prescription
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {file.mimeType.split("/")[1]?.toUpperCase() ||
                            "DOCUMENT"}
                        </p>
                      </div>
                    </div>

                    {file.webViewLink && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        asChild
                      >
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-3 mr-1" /> Open
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* GOOGLE CALENDAR TAB */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Medication Dose Reminders in Google Calendar
                </h3>
                <p className="text-xs text-muted-foreground">
                  Synchronize daily medication times and clinic appointments
                  directly to your Google Calendar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadCalendar}
                  disabled={!token || loadingCalendar}
                  className="h-8 text-xs"
                >
                  <RefreshCw
                    className={`mr-1 size-3 ${loadingCalendar ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleSyncRemindersToCalendar}
                  disabled={!token || syncingCalendar}
                  className="h-8 text-xs gap-1"
                >
                  <Calendar className="size-3.5" />
                  {syncingCalendar
                    ? "Syncing..."
                    : "Sync All Reminders (14-Day)"}
                </Button>
              </div>
            </div>

            {!token ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Calendar className="mx-auto size-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm font-semibold text-ink">
                  Google Calendar is not connected
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect your Google account to automatically push medication
                  alerts to your phone and calendar.
                </p>
                <Button
                  size="sm"
                  onClick={handleConnect}
                  className="mt-4 text-xs"
                >
                  Connect Google Calendar
                </Button>
              </div>
            ) : loadingCalendar ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                Fetching calendar events...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3.5 flex items-start gap-3">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-primary">
                      Active Prescription Routines
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {state.reminders
                        .filter((r) => r.active)
                        .map((r) => `${r.medicineName} (${r.times.join(", ")})`)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                {calendarEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      No Medora events found on primary calendar. Click
                      &quot;Sync All Reminders&quot; to push your schedule.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {calendarEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate">
                            {evt.summary}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {evt.start.dateTime
                              ? new Date(evt.start.dateTime).toLocaleString()
                              : evt.start.date}
                          </p>
                        </div>

                        {evt.htmlLink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            asChild
                          >
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-3 mr-1" /> View in
                              Calendar
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* GMAIL TAB */}
        <TabsContent value="gmail" className="space-y-4">
          <div className="surface p-5 space-y-4">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-ink">
                Send Prescription Refill via Gmail
              </h3>
              <p className="text-xs text-muted-foreground">
                Dispatch official medicine refill requests or consultation notes
                directly through your authenticated Gmail account.
              </p>
            </div>

            {!token ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Mail className="mx-auto size-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm font-semibold text-ink">
                  Gmail is not connected
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect Google Workspace to compose and send verified
                  prescription messages.
                </p>
                <Button
                  size="sm"
                  onClick={handleConnect}
                  className="mt-4 text-xs"
                >
                  Connect Gmail
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Compose Box */}
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Compose Medicine Refill
                  </h4>

                  <div className="space-y-1.5">
                    <Label htmlFor="gm-to" className="text-xs">
                      Pharmacy or Clinician Email
                    </Label>
                    <Input
                      id="gm-to"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="e.g. pharmacy@apollo.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gm-sub" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="gm-sub"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gm-body" className="text-xs">
                      Message Body
                    </Label>
                    <Textarea
                      id="gm-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={6}
                      className="text-xs font-mono"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSendGmail}
                    disabled={sendingEmail}
                    className="w-full text-xs gap-1.5"
                  >
                    <Send className="size-3.5" />
                    {sendingEmail
                      ? "Dispatching via Gmail..."
                      : "Send Refill Email via Gmail"}
                  </Button>
                </div>

                {/* Medical Emails Feed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Recent Medical & Pharmacy Messages
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadGmail}
                      disabled={loadingGmail}
                      className="h-7 text-xs"
                    >
                      <RefreshCw
                        className={`mr-1 size-3 ${loadingGmail ? "animate-spin" : ""}`}
                      />{" "}
                      Refresh
                    </Button>
                  </div>

                  {loadingGmail ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      <RefreshCw className="mx-auto size-5 animate-spin text-primary mb-2" />
                      Loading recent emails...
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No pharmacy or medical emails detected in recent inbox
                      messages.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {emails.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-lg border border-border bg-card p-3 space-y-1 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink truncate">
                              {msg.subject}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {msg.date?.slice(0, 16)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {msg.from}
                          </p>
                          <p className="text-xs text-ink/80 line-clamp-2">
                            {msg.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
