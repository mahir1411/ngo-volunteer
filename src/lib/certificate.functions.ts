import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const inputSchema = z.object({ application_id: z.string().uuid() });

interface AppRow {
  id: string;
  volunteer_id: string;
  event_id: string;
  events: { title: string; starts_at: string; ngo_id: string } | null;
  attendance: { attended: boolean; hours: number } | null;
}

export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: appData, error: appErr } = await supabase
      .from("applications")
      .select(
        "id, volunteer_id, event_id, events(title, starts_at, ngo_id), attendance(attended, hours)",
      )
      .eq("id", data.application_id)
      .single();
    if (appErr || !appData) throw new Error("Application not found");
    const app = appData as unknown as AppRow;
    if (app.events?.ngo_id !== userId) throw new Error("Not authorized");
    if (!app.attendance?.attended) throw new Error("Volunteer not marked as attended");

    const { data: vol } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", app.volunteer_id)
      .single();
    const { data: ngo } = await supabase
      .from("ngo_profiles")
      .select("org_name")
      .eq("user_id", userId)
      .single();

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

    const drawCenteredText = (text: string, y: number, size: number, textFont: typeof font, color: typeof ink) => {
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
    
    const name = vol?.full_name || "Volunteer";
    drawCenteredText(name, 360, 28, font, ink);
    const eventTitle = app.events?.title || "";
    const eventDate = new Date(app.events?.starts_at || Date.now()).toDateString();
    const hours = app.attendance?.hours ?? 0;

    drawCenteredText(`for volunteering at "${eventTitle}"`, 305, 14, body, ink);
    drawCenteredText(`on ${eventDate}  -  ${hours} hours contributed`, 275, 12, body, ink);

    page.drawText(`Issued by ${ngo?.org_name || "Organization"}`, {
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

    const bytes = await pdf.save();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${app.volunteer_id}/${app.id}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("certificates")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { data: cert, error: certErr } = await supabaseAdmin
      .from("certificates")
      .upsert({ application_id: app.id, pdf_url: path }, { onConflict: "application_id" })
      .select("id, pdf_url")
      .single();
    if (certErr) throw new Error(certErr.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: app.volunteer_id,
      type: "certificate_issued",
      title: "Your certificate is ready",
      body: `Download your certificate for "${eventTitle}".`,
      link: "/volunteer/certificates",
    });

    return { ok: true, path: cert.pdf_url };
  });
