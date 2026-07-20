import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Clock, Award, Mail, Phone, ArrowLeft, Users, FileSpreadsheet, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { issueCertificate } from "@/lib/certificate.functions";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ngo/events/$id/applicants")({
  head: () => ({ meta: [{ title: "Applicants — KindLink" }] }),
  component: Applicants,
});

function Applicants() {
  const { id } = Route.useParams();
  const issue = useServerFn(issueCertificate);
  const [crmStatus, setCrmStatus] = useState<"pending" | "accepted" | "waitlisted" | "rejected">(
    "pending",
  );
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const { data: ev } = useQuery({
    queryKey: ["ev", id],
    queryFn: async () => (await supabase.from("events").select("*").eq("id", id).single()).data,
  });

  const { data: apps = [], refetch } = useQuery({
    queryKey: ["apps", id],
    queryFn: async () => {
      console.log("[CRM] Fetching applications for event ID:", id);
      // 1. Fetch applications with direct relation joins
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select(
          `id, status, message, applied_at, volunteer_id, event_role_id,
                 event_roles(role_name),
                 attendance(attended, hours),
                 certificates(id, pdf_url)`,
        )
        .eq("event_id", id)
        .order("applied_at", { ascending: true });
      
      if (appsError) {
        console.error("[CRM] appsError:", appsError);
        throw appsError;
      }
      console.log("[CRM] appsData:", appsData);

      const volunteerIds = (appsData ?? []).map((app) => app.volunteer_id);
      console.log("[CRM] volunteerIds:", volunteerIds);

      // 2. Fetch profiles
      let profilesData: any[] = [];
      if (volunteerIds.length > 0) {
        const { data: pData, error: pError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, lat, lng")
          .in("id", volunteerIds);
        if (pError) {
          console.warn("[CRM] Profiles query with email failed, retrying without email:", pError.message);
          const { data: pDataRetry, error: pErrorRetry } = await supabase
            .from("profiles")
            .select("id, full_name, phone, lat, lng")
            .in("id", volunteerIds);
          if (pErrorRetry) {
            console.error("[CRM] Profiles retry query failed:", pErrorRetry);
            throw pErrorRetry;
          }
          profilesData = pDataRetry || [];
        } else {
          profilesData = pData || [];
        }
      }
      console.log("[CRM] profilesData:", profilesData);

      // 3. Fetch volunteer profiles
      let volunteerProfilesData: any[] = [];
      if (volunteerIds.length > 0) {
        const { data: vpData, error: vpError } = await supabase
          .from("volunteer_profiles")
          .select("user_id, skills, bio")
          .in("user_id", volunteerIds);
        if (vpError) {
          console.error("[CRM] vpError:", vpError);
          throw vpError;
        }
        volunteerProfilesData = vpData || [];
      }
      console.log("[CRM] volunteerProfilesData:", volunteerProfilesData);

      // 4. Combine data
      const mergedApps = (appsData ?? []).map((app) => {
        const profile = profilesData.find((p) => p.id === app.volunteer_id) || null;
        const volunteerProfile =
          volunteerProfilesData.find((vp) => vp.user_id === app.volunteer_id) || null;
        return {
          ...app,
          profiles: profile,
          volunteer_profiles: volunteerProfile,
        };
      });

      console.log("[CRM] mergedApps:", mergedApps);
      return mergedApps;
    },
  });

  const setStatus = async (
    appId: string,
    status: "accepted" | "rejected" | "waitlisted" | "cancelled",
  ) => {
    const { error } = await supabase
      .from("applications")
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", appId);
    if (error) toast.error(error.message);
    else {
      toast.success(`Application updated to ${status}`);
      refetch();
    }
  };

  const distance = (a: any) => {
    if (!ev?.lat || !ev?.lng || !a.profiles?.lat || !a.profiles?.lng) return null;
    const R = 6371,
      toR = (d: number) => (d * Math.PI) / 180;
    const dLat = toR(a.profiles.lat - ev.lat),
      dLng = toR(a.profiles.lng - ev.lng);
    const v =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toR(ev.lat)) * Math.cos(toR(a.profiles.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(v));
  };

  const filteredApps = apps.filter((a: any) => a.status === crmStatus);

  useEffect(() => {
    if (filteredApps.length > 0) {
      const exists = filteredApps.find((a: any) => a.id === selectedAppId);
      if (!exists) {
        setSelectedAppId(filteredApps[0].id);
      }
    } else {
      setSelectedAppId(null);
    }
  }, [crmStatus, apps.length]);

  const selectedApp = apps.find((a: any) => a.id === selectedAppId);
  const acceptedApps = apps.filter((a: any) => a.status === "accepted");

  const downloadExcel = () => {
    try {
      const headers = ["Volunteer Name", "Email", "Phone", "Role", "Status", "Hours Logged"];
      const rows = acceptedApps.map((a: any) => {
        const att = Array.isArray(a.attendance) ? a.attendance[0] : a.attendance;
        return [
          a.profiles?.full_name || "N/A",
          a.profiles?.email || "N/A",
          a.profiles?.phone || "N/A",
          a.event_roles?.role_name || "General Volunteer",
          att?.attended ? "Present" : "Absent",
          att?.hours ?? 0,
        ];
      });

      const csvContent = [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${ev?.title || "event"}_attendance_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel sheet (CSV) downloaded successfully");
    } catch (error) {
      console.error("CSV generation error:", error);
      toast.error("Failed to generate Excel sheet");
    }
  };

  const downloadPdf = async () => {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595; // A4 width
      const pageHeight = 842; // A4 height
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // 515

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      const tealColor = rgb(0.06, 0.46, 0.45);
      const charcoalColor = rgb(0.13, 0.16, 0.22);
      const white = rgb(1, 1, 1);
      const lightGray = rgb(0.95, 0.95, 0.95);
      const borderGray = rgb(0.85, 0.85, 0.85);

      // Title Banner
      page.drawRectangle({
        x: margin,
        y: currentY - 60,
        width: contentWidth,
        height: 60,
        color: tealColor,
      });

      page.drawText("EVENT ATTENDANCE REPORT", {
        x: margin + 15,
        y: currentY - 35,
        size: 16,
        font: fontBold,
        color: white,
      });

      const formattedDate = format(new Date(), "PPpp");
      page.drawText(`Generated on: ${formattedDate}`, {
        x: margin + 15,
        y: currentY - 50,
        size: 8,
        font: fontRegular,
        color: white,
      });

      currentY -= 80;

      // Event Info Box
      page.drawRectangle({
        x: margin,
        y: currentY - 65,
        width: contentWidth,
        height: 65,
        color: lightGray,
        borderColor: borderGray,
        borderWidth: 1,
      });

      page.drawText(`Event: ${ev?.title || "N/A"}`, {
        x: margin + 15,
        y: currentY - 18,
        size: 11,
        font: fontBold,
        color: charcoalColor,
      });

      const eventTime = ev?.starts_at
        ? `${format(new Date(ev.starts_at), "PPp")}`
        : "N/A";
      page.drawText(`Date & Time: ${eventTime}`, {
        x: margin + 15,
        y: currentY - 34,
        size: 9,
        font: fontRegular,
        color: charcoalColor,
      });

      const presentCount = acceptedApps.filter((a: any) => {
        const att = Array.isArray(a.attendance) ? a.attendance[0] : a.attendance;
        return att?.attended;
      }).length;
      const totalCount = acceptedApps.length;

      page.drawText(
        `Total Volunteers: ${totalCount}   |   Present: ${presentCount}   |   Absent: ${totalCount - presentCount}`,
        {
          x: margin + 15,
          y: currentY - 50,
          size: 9,
          font: fontBold,
          color: tealColor,
        },
      );

      currentY -= 90;

      // Table configuration
      const colWidths = [150, 150, 100, 65, 50]; // Total: 515
      const headers = ["Volunteer Name", "Email", "Role", "Status", "Hours"];

      const drawRow = (
        rowPage: typeof page,
        y: number,
        data: string[],
        isHeader = false,
      ) => {
        if (isHeader) {
          rowPage.drawRectangle({
            x: margin,
            y: y - 18,
            width: contentWidth,
            height: 18,
            color: tealColor,
          });
        } else {
          rowPage.drawRectangle({
            x: margin,
            y: y - 18,
            width: contentWidth,
            height: 18,
            color: lightGray,
            borderColor: borderGray,
            borderWidth: 0.5,
          });
        }

        let xOffset = margin;
        for (let i = 0; i < data.length; i++) {
          const text = String(data[i]);
          const font = isHeader ? fontBold : fontRegular;
          const color = isHeader ? white : charcoalColor;
          const size = isHeader ? 8.5 : 8;

          let truncated = text;
          while (
            truncated.length > 0 &&
            font.widthOfTextAtSize(truncated, size) > colWidths[i] - 10
          ) {
            truncated = truncated.slice(0, -1);
          }
          if (truncated.length < text.length) {
            truncated = truncated + "...";
          }

          rowPage.drawText(truncated, {
            x: xOffset + 5,
            y: y - 12,
            size,
            font,
            color,
          });
          xOffset += colWidths[i];
        }
      };

      // Draw table headers
      drawRow(page, currentY, headers, true);
      currentY -= 18;

      // Draw rows
      for (let index = 0; index < acceptedApps.length; index++) {
        const a = acceptedApps[index];

        if (currentY - 20 < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
          drawRow(page, currentY, headers, true);
          currentY -= 18;
        }

        const att = Array.isArray(a.attendance) ? a.attendance[0] : a.attendance;
        const name = a.profiles?.full_name || "Volunteer";
        const email = a.profiles?.email || "N/A";
        const role = a.event_roles?.role_name || "Volunteer";
        const status = att?.attended ? "Present" : "Absent";
        const hours = String(att?.hours ?? 0);

        drawRow(page, currentY, [name, email, role, status, hours], false);
        currentY -= 18;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ev?.title || "event"}_attendance_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF Downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Back navigation */}
      <Link
        to="/ngo/events"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-1 border-b border-border/40 pb-6 mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Applicants CRM
        </h1>
        {ev && (
          <p className="text-sm text-muted-foreground">
            {ev.title} · {format(new Date(ev.starts_at), "PPp")}
          </p>
        )}
      </div>

      <Tabs defaultValue="crm" className="mt-4">
        <TabsList className="bg-secondary/40 border border-primary/5 rounded-2xl p-1 mb-6">
          <TabsTrigger
            value="crm"
            className="rounded-xl px-5 py-2 font-semibold text-sm cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            Applications Grid
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="rounded-xl px-5 py-2 font-semibold text-sm cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            Attendance Log ({acceptedApps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-0 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row gap-6 min-h-[550px] lg:h-[650px]">
            {/* Left Column - Applicant Summaries List (38% width) */}
            <div className="w-full lg:w-[38%] flex flex-col border border-border/50 rounded-2xl bg-card overflow-hidden h-full shadow-xs">
              {/* Pills selectors for states */}
              <div className="p-3 border-b border-border/30 bg-secondary/15 flex flex-wrap gap-1">
                {(["pending", "accepted", "waitlisted", "rejected"] as const).map((status) => {
                  const count = apps.filter((a: any) => a.status === status).length;
                  const isActive = crmStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setCrmStatus(status)}
                      className={`flex-1 text-center py-2 px-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      {status} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Scrollable list of items */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/25">
                {filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-sm text-muted-foreground font-medium">
                    No {crmStatus} applicants.
                  </div>
                ) : (
                  filteredApps.map((a: any) => {
                    const isSelected = a.id === selectedAppId;
                    const dist = distance(a);
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAppId(a.id)}
                        className={`w-full text-left p-4 transition-colors flex flex-col gap-1 border-l-4 cursor-pointer ${
                          isSelected
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-secondary/15 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-sm text-foreground line-clamp-1">
                            {a.profiles?.full_name || "Volunteer"}
                          </span>
                          {dist != null && (
                            <span className="text-[10px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full shrink-0 font-medium">
                              {dist.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="truncate max-w-[150px]">
                            {a.event_roles?.role_name || "General Volunteer"}
                          </span>
                          <span>{format(new Date(a.applied_at), "MMM d, yyyy")}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column - Applicant Details Panel (62% width) */}
            <div className="w-full lg:w-[62%] border border-border/50 rounded-2xl bg-card overflow-hidden h-full flex flex-col shadow-xs">
              {selectedApp ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Panel Header */}
                  <div className="p-6 border-b border-border/30 bg-secondary/15">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-bold text-foreground">
                          {selectedApp.profiles?.full_name}
                        </h2>
                        <p className="text-sm font-semibold text-primary mt-1">
                          Role: {selectedApp.event_roles?.role_name || "General Volunteer"}
                        </p>
                      </div>
                      <Badge className="rounded-full capitalize font-bold bg-primary/10 text-primary border-none text-xs px-3 py-1">
                        {selectedApp.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Panel Details Scrollable Body */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* Distance & Applied info */}
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground bg-secondary/25 border border-border/30 p-3.5 rounded-xl">
                      <div>
                        Applied:{" "}
                        <span className="text-foreground">
                          {format(new Date(selectedApp.applied_at), "PPp")}
                        </span>
                      </div>
                      {distance(selectedApp) != null && (
                        <div>
                          Distance:{" "}
                          <span className="text-foreground">
                            {(distance(selectedApp) || 0).toFixed(1)} km away
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Contact Details
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedApp.profiles?.email && (
                          <a
                            href={`mailto:${selectedApp.profiles.email}`}
                            className="flex items-center gap-2 p-3 rounded-xl border border-border/40 hover:bg-secondary/15 transition-all text-sm font-medium text-foreground/80 hover:text-primary"
                          >
                            <Mail className="h-4.5 w-4.5 text-primary/70 shrink-0" />
                            <span className="truncate">{selectedApp.profiles.email}</span>
                          </a>
                        )}
                        {selectedApp.profiles?.phone && (
                          <a
                            href={`tel:${selectedApp.profiles.phone}`}
                            className="flex items-center gap-2 p-3 rounded-xl border border-border/40 hover:bg-secondary/15 transition-all text-sm font-medium text-foreground/80 hover:text-primary"
                          >
                            <Phone className="h-4.5 w-4.5 text-primary/70 shrink-0" />
                            <span>{selectedApp.profiles.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Cover note message */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Application Message
                      </h4>
                      {selectedApp.message ? (
                        <div className="p-4 rounded-xl bg-secondary/15 border border-border/30 text-sm text-foreground/90 italic leading-relaxed">
                          "{selectedApp.message}"
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No cover note provided.
                        </p>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Bio
                      </h4>
                      {selectedApp.volunteer_profiles?.bio ? (
                        <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/5 border border-border/10 p-4 rounded-xl">
                          {selectedApp.volunteer_profiles.bio}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No bio provided by volunteer.
                        </p>
                      )}
                    </div>

                    {/* Skills list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Skills & Badges
                      </h4>
                      {selectedApp.volunteer_profiles?.skills &&
                      selectedApp.volunteer_profiles.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApp.volunteer_profiles.skills.map((s: string) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="rounded-full px-3 py-1 font-semibold text-xs border-primary/20 text-primary bg-primary/5"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No listed skills.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-border/30 bg-secondary/10 flex justify-end gap-2.5 shrink-0">
                    {selectedApp.status !== "accepted" && (
                      <Button
                        onClick={() => setStatus(selectedApp.id, "accepted")}
                        className="rounded-xl px-5 font-bold text-xs h-9 cursor-pointer"
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Accept Volunteer
                      </Button>
                    )}
                    {selectedApp.status !== "waitlisted" && (
                      <Button
                        variant="outline"
                        onClick={() => setStatus(selectedApp.id, "waitlisted")}
                        className="rounded-xl px-5 font-semibold text-xs h-9 cursor-pointer"
                      >
                        <Clock className="mr-1.5 h-4 w-4" />
                        Waitlist
                      </Button>
                    )}
                    {selectedApp.status !== "rejected" && (
                      <Button
                        variant="ghost"
                        onClick={() => setStatus(selectedApp.id, "rejected")}
                        className="rounded-xl px-5 font-semibold text-xs text-destructive hover:bg-destructive/5 h-9 cursor-pointer"
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Reject Application
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <span className="text-4xl mb-3">📋</span>
                  <h3 className="font-display font-bold text-base text-foreground">
                    Select an applicant
                  </h3>
                  <p className="text-xs max-w-xs mt-1">
                    Choose one of the applicants from the left-side list to view their full profile,
                    contact details, and decide on their application.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0 animate-in fade-in duration-200">
          {acceptedApps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-muted-foreground bg-card/10">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-display font-semibold text-base">No accepted volunteers yet</h3>
              <p className="text-xs mt-1">
                Once applicants are accepted, their names will show here to track attendance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 border border-border/40 rounded-2xl shadow-xs transition-all duration-300 hover:shadow-md">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Attendance Sheet & Statistics</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Download the attendance log for external record-keeping or reporting.</p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadExcel} 
                    className="flex-1 sm:flex-initial rounded-xl font-semibold text-xs py-2 px-4 border border-border/60 hover:bg-secondary/40 hover:text-foreground cursor-pointer transition-all duration-200"
                  >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-500" /> Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadPdf} 
                    className="flex-1 sm:flex-initial rounded-xl font-semibold text-xs py-2 px-4 border border-border/60 hover:bg-secondary/40 hover:text-foreground cursor-pointer transition-all duration-200"
                  >
                    <FileDown className="mr-1.5 h-4 w-4 text-teal-600 dark:text-teal-500" /> Export PDF
                  </Button>
                </div>
              </div>
              <div className="border border-border/40 rounded-2xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 bg-secondary/35 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Volunteer</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Attendance</th>
                        <th className="px-6 py-4">Hours Logged</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/25 text-sm">
                      {acceptedApps.map((a: any) => (
                        <AttendanceTableRow key={a.id} a={a} refetch={refetch} issue={issue} ev={ev} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AttendanceTableRow({ a, refetch, issue, ev }: any) {
  const attData = Array.isArray(a.attendance) ? a.attendance[0] : a.attendance;
  const certData = Array.isArray(a.certificates) ? a.certificates[0] : a.certificates;

  const [attended, setAttended] = useState(attData?.attended ?? false);
  const [hours, setHours] = useState(attData?.hours ?? 0);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("attendance")
      .upsert({ application_id: a.id, attended, hours });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Attendance saved");
      refetch();
    }
  };

  const downloadExistingCert = async () => {
    const certPath = certData?.pdf_url;
    if (!certPath) return;
    try {
      setBusy(true);
      const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(certPath);
      if (urlData?.publicUrl) {
        try {
          const fileRes = await fetch(urlData.publicUrl);
          const blob = await fileRes.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `certificate_${a.profiles?.full_name || "volunteer"}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          toast.success("Certificate downloaded successfully");
        } catch (err) {
          window.open(urlData.publicUrl, "_blank");
        }
      }
    } catch (e: any) {
      toast.error("Failed to download certificate");
    } finally {
      setBusy(false);
    }
  };

  const generateCertificateClientSide = async () => {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([792, 612]);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const body = await pdf.embedFont(StandardFonts.Helvetica);
      const teal = rgb(0.06, 0.46, 0.45);
      const goldColor = rgb(0.83, 0.69, 0.22); // Premium Gold color
      const ink = rgb(0.13, 0.16, 0.22);

      page.drawRectangle({
        x: 24,
        y: 24,
        width: 744,
        height: 564,
        borderColor: goldColor,
        borderWidth: 3,
      });
      page.drawRectangle({
        x: 36,
        y: 36,
        width: 720,
        height: 540,
        borderColor: goldColor,
        borderWidth: 1,
      });

      const drawCenteredText = (text: string, y: number, size: number, textFont: any, color: any) => {
        const textWidth = textFont.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: 396 - textWidth / 2,
          y,
          size,
          font: textFont,
          color,
        });
      };

      drawCenteredText("Certificate of Volunteer Service", 470, 32, font, teal);
      drawCenteredText("This certificate is proudly presented to", 410, 14, body, ink);
      
      const name = a.profiles?.full_name || "Volunteer";
      drawCenteredText(name, 360, 28, font, ink);

      const eventTitle = ev?.title || "";
      const eventDate = new Date(ev?.starts_at || Date.now()).toDateString();

      drawCenteredText(`for volunteering at "${eventTitle}"`, 305, 14, body, ink);
      drawCenteredText(`on ${eventDate}  -  ${hours} hours contributed`, 275, 12, body, ink);

      // Try fetching NGO org_name
      let orgName = "Organization";
      try {
        const { data: ngoData } = await supabase
          .from("ngo_profiles")
          .select("org_name")
          .eq("user_id", ev?.ngo_id)
          .single();
        if (ngoData?.org_name) {
          orgName = ngoData.org_name;
        }
      } catch (e) {
        console.warn("Failed to fetch NGO name:", e);
      }

      page.drawText(`Issued by ${orgName}`, {
        x: 60,
        y: 80,
        size: 11,
        font: body,
        color: ink,
      });
      page.drawText(`KindLink  -  ${new Date().toDateString()}`, {
        x: 520,
        y: 80,
        size: 10,
        font: body,
        color: ink,
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `certificate_${name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("Certificate generated and downloaded locally!");
    } catch (err: any) {
      console.error("Client-side certificate generation failed:", err);
      toast.error("Failed to generate certificate locally");
    }
  };

  const cert = async () => {
    if (!attended) {
      toast.error("Volunteer must be marked as present to issue a certificate");
      return;
    }
    try {
      setBusy(true);
      // Auto-save the present state before issuing
      const { error: saveError } = await supabase
        .from("attendance")
        .upsert({ application_id: a.id, attended, hours });
      if (saveError) throw saveError;

      const res = await issue({ data: { application_id: a.id } });
      toast.success("Certificate issued successfully");
      refetch();

      if (res && res.path) {
        const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(res.path);
        if (urlData?.publicUrl) {
          try {
            const fileRes = await fetch(urlData.publicUrl);
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `certificate_${a.profiles?.full_name || "volunteer"}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          } catch (err) {
            window.open(urlData.publicUrl, "_blank");
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        console.warn("Database service role key missing. Falling back to client-side generation.");
        toast.info("Database service key not configured. Generating certificate client-side...");
        await generateCertificateClientSide();
      } else {
        toast.error(e.message || "Failed to issue certificate");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="hover:bg-secondary/15 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{a.profiles?.full_name || "Volunteer"}</div>
        <div className="text-xs text-muted-foreground">{a.profiles?.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="secondary" className="rounded-full text-xs">
          {a.event_roles?.role_name || "Volunteer"}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Switch
            checked={attended}
            onCheckedChange={setAttended}
            id={`attended-${a.id}`}
            className="cursor-pointer"
          />
          <label
            htmlFor={`attended-${a.id}`}
            className="text-xs font-semibold text-muted-foreground select-none cursor-pointer"
          >
            {attended ? "Present" : "Absent"}
          </label>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={0.5}
            className="w-20 rounded-lg text-sm h-8"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
          <span className="text-xs text-muted-foreground">hrs</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={save}
            disabled={busy}
            className="rounded-lg text-xs h-8 cursor-pointer"
          >
            Save
          </Button>
          {certData?.id ? (
            <Button
              size="sm"
              variant="outline"
              onClick={downloadExistingCert}
              disabled={busy}
              className="rounded-lg text-xs h-8 border-emerald-500/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer font-semibold"
            >
              <Award className="mr-1 h-3.5 w-3.5" />
              Download Cert
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={cert}
              disabled={busy || !attended}
              className="rounded-lg text-xs h-8 bg-primary/10 text-primary hover:bg-primary/20 border-none cursor-pointer"
            >
              <Award className="mr-1 h-3.5 w-3.5" />
              Issue Cert
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
