import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  Stethoscope,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatTile } from "@/components/common/primitives";
import { DataTable, type DataColumn } from "@/components/workspace/DataTable";
import {
  AsyncSection,
  StatusPill,
  WorkspaceSection,
} from "@/components/workspace/parts";
import {
  shortDate,
  shortDateTime,
  timeOnly,
  useWorkspaceData,
} from "@/services/workspace";
import type { Appointment } from "@/data/workspace-demo";

export const Route = createFileRoute("/doctor/schedule")({
  head: () => ({
    meta: [
      { title: "Appointment Schedule — Medora Clinician Workspace" },
      {
        name: "description",
        content:
          "Daily clinician consultation schedule, appointment queue, video consult triage, and appointment booking management.",
      },
      { property: "og:title", content: "Schedule — Medora Doctor Workspace" },
      {
        property: "og:description",
        content:
          "Clinician schedule, appointment tracking, and consultation management.",
      },
    ],
  }),
  component: DoctorSchedulePage,
});

const statusMeta = {
  scheduled: { label: "Scheduled", tone: "neutral" as const },
  checked_in: { label: "Checked in", tone: "warning" as const },
  in_consult: { label: "In consult", tone: "info" as const },
  completed: { label: "Completed", tone: "positive" as const },
  cancelled: { label: "Cancelled", tone: "danger" as const },
};

const kindMeta = {
  in_person: {
    label: "In Person",
    icon: MapPin,
    tone: "border-primary/30 bg-primary-soft text-primary",
  },
  video: {
    label: "Video Call",
    icon: Video,
    tone: "border-chart-2/30 bg-chart-2/15 text-chart-2",
  },
  phone: {
    label: "Phone Consult",
    icon: Phone,
    tone: "border-chart-3/30 bg-chart-3/15 text-chart-3",
  },
};

export function DoctorSchedulePage() {
  const appointmentsQuery = useWorkspaceData("appointments");
  const patientsQuery = useWorkspaceData("doctorPatients");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // New appointment dialog state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newPatientId, setNewPatientId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState("11:30");
  const [newDuration, setNewDuration] = useState("20");
  const [newKind, setNewKind] = useState<"in_person" | "video" | "phone">(
    "in_person",
  );
  const [newReason, setNewReason] = useState("");

  // Sync initial loaded data
  useMemo(() => {
    if (appointmentsQuery.data && appointments.length === 0) {
      setAppointments(appointmentsQuery.data);
    }
  }, [appointmentsQuery.data, appointments.length]);

  const patientOptions = patientsQuery.data ?? [];

  const updateStatus = (id: string, newStatus: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)),
    );
    toast.success(
      `Appointment status updated to ${statusMeta[newStatus].label}`,
    );
    if (selectedAppointment?.id === id) {
      setSelectedAppointment((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  const handleBookAppointment = () => {
    const matchedPatient = patientOptions.find((p) => p.id === newPatientId);
    if (!matchedPatient) {
      toast.error("Please select a patient");
      return;
    }
    if (!newReason.trim()) {
      toast.error("Please provide a visit reason");
      return;
    }

    const newApp: Appointment = {
      id: `ap-${Math.random().toString(36).slice(2, 7)}`,
      patientId: matchedPatient.id,
      patientName: matchedPatient.name,
      at: `${newDate}T${newTime}:00.000Z`,
      durationMin: Number(newDuration) || 20,
      kind: newKind,
      reason: newReason.trim(),
      status: "scheduled",
    };

    setAppointments((prev) => [newApp, ...prev]);
    setIsBookModalOpen(false);
    setNewReason("");
    toast.success(`Appointment booked for ${matchedPatient.name}`, {
      description: `${newDate} at ${newTime} (${newKindMeta(newKind)})`,
    });
  };

  function newKindMeta(k: "in_person" | "video" | "phone") {
    return kindMeta[k].label;
  }

  // Filtered rows
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchKind = filterKind === "all" || app.kind === filterKind;
      const matchStatus = filterStatus === "all" || app.status === filterStatus;
      const matchQuery =
        !searchQuery.trim() ||
        app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKind && matchStatus && matchQuery;
    });
  }, [appointments, filterKind, filterStatus, searchQuery]);

  // Metric stats
  const totalCount = appointments.length;
  const checkedInCount = appointments.filter(
    (a) => a.status === "checked_in",
  ).length;
  const inConsultCount = appointments.filter(
    (a) => a.status === "in_consult",
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "completed",
  ).length;

  const columns: DataColumn<Appointment>[] = [
    {
      key: "time",
      header: "Time",
      sortValue: (r) => r.at,
      render: (r) => (
        <div>
          <p className="font-semibold text-ink numeric">{timeOnly(r.at)}</p>
          <p className="text-[11px] text-muted-foreground">{shortDate(r.at)}</p>
        </div>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      sortValue: (r) => r.patientName,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.patientName}</p>
          <p className="text-xs text-muted-foreground">
            {r.durationMin} mins duration
          </p>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Type",
      sortValue: (r) => r.kind,
      render: (r) => {
        const meta = kindMeta[r.kind];
        const Icon = meta.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${meta.tone}`}
          >
            <Icon className="size-3" />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "reason",
      header: "Reason for Visit",
      hideBelow: "md",
      sortValue: (r) => r.reason,
      render: (r) => <span className="text-sm text-ink">{r.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => {
        const meta = statusMeta[r.status];
        return <StatusPill label={meta.label} tone={meta.tone} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "scheduled" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => updateStatus(r.id, "checked_in")}
            >
              Check In
            </Button>
          )}
          {r.status === "checked_in" && (
            <Button
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground"
              onClick={() => updateStatus(r.id, "in_consult")}
            >
              Start Consult
            </Button>
          )}
          {r.status === "in_consult" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-success border-success/40"
              onClick={() => updateStatus(r.id, "completed")}
            >
              <CheckCircle2 className="size-3 mr-1" />
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setSelectedAppointment(r)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinician Schedule"
        demo
        description="Consultation appointment ledger, triage queue, video consult rooms, and check-in timeline."
        actions={
          <Button onClick={() => setIsBookModalOpen(true)}>
            <Plus className="size-4 mr-1" /> Book Appointment
          </Button>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Bookings"
          value={totalCount.toString()}
          hint="Active schedule slots"
        />
        <StatTile
          label="Checked In"
          value={checkedInCount.toString()}
          hint="Patients in clinic waiting"
        />
        <StatTile
          label="In Consultation"
          value={inConsultCount.toString()}
          hint="Currently in consult room"
        />
        <StatTile
          label="Completed Today"
          value={completedCount.toString()}
          hint="Consults concluded"
        />
      </div>

      {/* Filter and Search Bar */}
      <WorkspaceSection
        title="Consultation Timeline"
        description="Review today's appointments by modality, status, or patient name."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patient or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={filterKind} onValueChange={setFilterKind}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="in_consult">In Consult</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <AsyncSection
          query={appointmentsQuery}
          emptyIcon={CalendarClock}
          emptyTitle="No appointments scheduled"
          emptyDescription="Book a patient consultation to populate the appointment timeline."
          isEmpty={() => filteredAppointments.length === 0}
        >
          {() => (
            <DataTable<Appointment>
              rows={filteredAppointments}
              columns={columns}
              onRowClick={(r) => setSelectedAppointment(r)}
            />
          )}
        </AsyncSection>
      </WorkspaceSection>

      {/* Appointment Detail Dialog */}
      <Dialog
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        {selectedAppointment && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                Appointment Details
              </DialogTitle>
              <DialogDescription>
                Reference ID:{" "}
                <span className="font-mono text-xs text-ink">
                  {selectedAppointment.id}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient Name:</span>
                  <span className="font-semibold text-ink">
                    {selectedAppointment.patientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium text-ink numeric">
                    {shortDate(selectedAppointment.at)} at{" "}
                    {timeOnly(selectedAppointment.at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Consultation Type:
                  </span>
                  <Badge variant="outline">
                    {kindMeta[selectedAppointment.kind].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-ink">
                    {selectedAppointment.durationMin} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <StatusPill
                    label={statusMeta[selectedAppointment.status].label}
                    tone={statusMeta[selectedAppointment.status].tone}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Clinical Reason for Visit
                </Label>
                <div className="mt-1 rounded-md border border-border bg-muted/40 p-3 text-ink">
                  {selectedAppointment.reason}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                {selectedAppointment.status !== "cancelled" &&
                  selectedAppointment.status !== "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                      onClick={() =>
                        updateStatus(selectedAppointment.id, "cancelled")
                      }
                    >
                      <XCircle className="size-4 mr-1" /> Cancel Slot
                    </Button>
                  )}
              </div>
              <div className="flex items-center gap-2">
                {selectedAppointment.status === "scheduled" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateStatus(selectedAppointment.id, "checked_in")
                    }
                  >
                    Check In Patient
                  </Button>
                )}
                {selectedAppointment.status === "checked_in" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateStatus(selectedAppointment.id, "in_consult")
                    }
                  >
                    Start Consultation
                  </Button>
                )}
                {selectedAppointment.status === "in_consult" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() =>
                      updateStatus(selectedAppointment.id, "completed")
                    }
                  >
                    <CheckCircle2 className="size-4 mr-1" /> Conclude Consult
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Book New Appointment Dialog */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" />
              Book Patient Consultation
            </DialogTitle>
            <DialogDescription>
              Schedule an in-person, video, or telephone consult slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="patientSelect">Select Patient</Label>
              <Select value={newPatientId} onValueChange={setNewPatientId}>
                <SelectTrigger id="patientSelect">
                  <SelectValue placeholder="Choose a registered patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patientOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.ageBand}) — {p.reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newDate">Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newTime">Time</Label>
                <Input
                  id="newTime"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newKind">Consultation Modality</Label>
                <Select
                  value={newKind}
                  onValueChange={(v) =>
                    setNewKind(v as "in_person" | "video" | "phone")
                  }
                >
                  <SelectTrigger id="newKind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Consult</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newDuration">Duration (Mins)</Label>
                <Select value={newDuration} onValueChange={setNewDuration}>
                  <SelectTrigger id="newDuration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newReason">Reason for Consultation</Label>
              <Input
                id="newReason"
                placeholder="e.g. Hypertension review, lab results, persistent cough"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookAppointment}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
