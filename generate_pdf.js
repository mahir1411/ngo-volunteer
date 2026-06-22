import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([612, 792]);
  let currentY = 712; // Start lower to accommodate title
  const marginX = 50;
  const contentWidth = 512;
  const bottomMargin = 50;
  let pageNumber = 1;

  function addNewPage() {
    // Add page number at bottom of current page before switching
    drawPageNumber();
    
    page = pdfDoc.addPage([612, 792]);
    currentY = 742;
    pageNumber++;
    drawHeader();
  }

  function drawHeader() {
    page.drawText('NGO Volunteer Connect Hub - System Documentation', {
      x: marginX,
      y: 760,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    });
    page.drawLine({
      start: { x: marginX, y: 752 },
      end: { x: 562, y: 752 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    });
  }

  function drawPageNumber() {
    const text = `Page ${pageNumber}`;
    page.drawText(text, {
      x: 306 - fontRegular.widthOfTextAtSize(text, 8) / 2,
      y: 30,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  function wrapText(text, maxW, font, size) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxW) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  function renderText(text, type) {
    let fontSize = 10;
    let leading = 14;
    let font = fontRegular;
    let spacingAfter = 8;
    let color = rgb(0.13, 0.16, 0.22);
    let bulletIndent = 0;

    if (type === 'title') {
      fontSize = 20;
      leading = 24;
      font = fontBold;
      spacingAfter = 18;
      color = rgb(0.06, 0.46, 0.45); // Teal
    } else if (type === 'h1') {
      fontSize = 14;
      leading = 18;
      font = fontBold;
      spacingAfter = 12;
      color = rgb(0.06, 0.46, 0.45); // Teal
    } else if (type === 'h2') {
      fontSize = 11;
      leading = 15;
      font = fontBold;
      spacingAfter = 8;
      color = rgb(0.13, 0.16, 0.22);
    } else if (type === 'bullet') {
      bulletIndent = 15;
    }

    const maxW = contentWidth - bulletIndent;
    const lines = wrapText(text, maxW, font, fontSize);

    // Check if we need a new page BEFORE rendering any lines of this block
    const blockHeight = lines.length * leading + spacingAfter;
    if (currentY - blockHeight < bottomMargin) {
      addNewPage();
    }

    for (let i = 0; i < lines.length; i++) {
      const xPos = marginX + bulletIndent;
      if (type === 'bullet' && i === 0) {
        page.drawText('•', {
          x: marginX + 5,
          y: currentY,
          size: fontSize,
          font: fontBold,
          color
        });
      }
      page.drawText(lines[i], {
        x: xPos,
        y: currentY,
        size: fontSize,
        font,
        color
      });
      currentY -= leading;
    }
    currentY -= spacingAfter;
  }

  // Define contents
  const content = [
    { type: 'title', text: 'NGO Volunteer Connect Hub - System Documentation' },
    { type: 'paragraph', text: 'This document provides a detailed report on the programming languages, technologies, database schemas, and system requirements used in the NGO Volunteer Connect Hub platform.' },
    { type: 'spacer', height: 10 },
    
    { type: 'h1', text: '1. Programming Languages & Technologies' },
    { type: 'paragraph', text: 'The platform is built using a modern full-stack web architecture, using the following languages and technologies:' },
    
    { type: 'h2', text: '1.1. TypeScript (TSX / TS)' },
    { type: 'bullet', text: 'Purpose: TypeScript is the core language of the application, used to write type-safe, maintainable code for both client and server logic.' },
    { type: 'bullet', text: 'Frontend (TSX): React components, TanStack Router route definitions (e.g., in src/routes/), and layout templates.' },
    { type: 'bullet', text: 'Server Functions (TS): Server-side logic (e.g., in src/lib/certificate.functions.ts and src/lib/geocode.functions.ts) built with createServerFn to securely perform actions (PDF generation, database updates, external geocoding calls) that require admin credentials or server execution.' },
    { type: 'bullet', text: 'Configuration (TS): Build settings defined in vite.config.ts.' },
    
    { type: 'h2', text: '1.2. HTML' },
    { type: 'bullet', text: 'Purpose: Standard markup language.' },
    { type: 'bullet', text: 'Usage: Entrypoint template to bootstrap the React application mount point.' },
    
    { type: 'h2', text: '1.3. CSS (Tailwind CSS v4)' },
    { type: 'bullet', text: 'Purpose: Styling and responsive design.' },
    { type: 'bullet', text: 'Usage: Tailored stylesheet (src/styles.css) utilizing Tailwind v4 features to ensure highly performant, custom-themed layouts, dynamic hover animations, and cohesive grid/flex structures.' },
    
    { type: 'h2', text: '1.4. SQL (PostgreSQL Dialect)' },
    { type: 'bullet', text: 'Purpose: Database schema creation, data manipulation, Row Level Security (RLS) access rules, triggers, and server-side RPC functions.' },
    { type: 'bullet', text: 'Usage: Migration scripts under supabase/migrations/ that configure database schemas, set up constraints, define security policies, and implement serverless business logic (such as auto-updating volunteer statistics upon attendance updates).' },
    
    { type: 'h2', text: '1.5. Configuration Formats (JSON / TOML)' },
    { type: 'bullet', text: 'Purpose: Project metadata and compiler settings.' },
    { type: 'bullet', text: 'package.json / package-lock.json: Manage npm dependencies, scripts, and runtime engines.' },
    { type: 'bullet', text: 'tsconfig.json: Configures TypeScript compiler rules (strict types, path aliases).' },
    { type: 'bullet', text: 'netlify.toml: Hard-pins Netlify build targets to ensure npm builds deploy correctly.' },
    { type: 'spacer', height: 10 },
    
    { type: 'h1', text: '2. Database Schema (Supabase / PostgreSQL)' },
    { type: 'paragraph', text: 'The backend database runs on Supabase (PostgreSQL) and uses custom Enums, Tables, Row Level Security (RLS) policies, Triggers, and Database RPC Functions.' },
    
    { type: 'h2', text: '2.1. Enumerated Types (Enums)' },
    { type: 'bullet', text: 'public.app_role: Defines user account types: \'admin\', \'ngo\', \'volunteer\'.' },
    { type: 'bullet', text: 'public.verification_status: NGO verification states: \'pending\', \'verified\', \'rejected\'.' },
    { type: 'bullet', text: 'public.event_status: Tracks event state: \'published\', \'cancelled\', \'completed\'.' },
    { type: 'bullet', text: 'public.application_status: Tracks volunteer applications: \'pending\', \'accepted\', \'rejected\', \'waitlisted\', \'cancelled\'.' },
    
    { type: 'h2', text: '2.2. Database Tables' },
    { type: 'bullet', text: 'public.profiles: Extends standard user authentication info (maps to auth.users). Stores id, full_name, phone, pincode, email, coordinates (lat, lng), and avatar_url.' },
    { type: 'bullet', text: 'public.user_roles: Maps users to their roles.' },
    { type: 'bullet', text: 'public.volunteer_profiles: Tracks volunteer-specific data, including skills (text array), availability (JSONB), bio, events_completed, and hours_total.' },
    { type: 'bullet', text: 'public.ngo_profiles: Stores NGO details, including org_name, registration_number, registration_cert_url, contact_email, contact_phone, address, coordinates (lat, lng), and verification_status.' },
    { type: 'bullet', text: 'public.events: Store event listings created by NGOs. Attributes include title, description, category, banner_url, starts_at, ends_at, address, coordinates (lat, lng), total_spots, contact details, and status.' },
    { type: 'bullet', text: 'public.event_roles: Specific volunteer roles within an event, defining role_name, spots_needed, and spots_filled.' },
    { type: 'bullet', text: 'public.applications: Link volunteers to events and roles. Includes application message, status, and timestamps.' },
    { type: 'bullet', text: 'public.attendance: Connects to applications to log if the volunteer attended and the number of hours contributed.' },
    { type: 'bullet', text: 'public.certificates: Stores URLs of generated PDF certificates, linking them to volunteer applications.' },
    { type: 'bullet', text: 'public.notifications: Stores user-facing alerts, with type, title, body, link redirect destination, and read_at status.' },
    { type: 'bullet', text: 'public.admin_reports: Allows reporting of events or NGOs, containing reported_entity_type, reason, status, and reporter_id.' },
    
    { type: 'h2', text: '2.3. Automated Database Triggers' },
    { type: 'bullet', text: 'on_auth_user_created: Executes handle_new_user() on sign-up to automatically insert profile entries and assign user roles.' },
    { type: 'bullet', text: 'trg_application_change: Executes handle_application_change() on application updates. Increments or decrements spots_filled on the associated event_roles, sends notification updates, and automatically promotes waitlisted applicants if a spot becomes available.' },
    { type: 'bullet', text: 'trg_new_application: Executes handle_new_application() to notify NGOs when a volunteer applies to their events.' },
    { type: 'bullet', text: 'trg_attendance_change: Executes handle_attendance_change() to recalculate a volunteer\'s events_completed and hours_total stats whenever attendance records are inserted or edited.' },
    
    { type: 'h2', text: '2.4. Custom RPC Functions' },
    { type: 'bullet', text: 'haversine_km: Computes geographical distance between coordinates.' },
    { type: 'bullet', text: 'search_events: Advanced query endpoint. Searches for events within a specific radius of a user\'s location, filtered by category, time bounds, and spot availability.' },
    { type: 'spacer', height: 10 },
    
    { type: 'h1', text: '3. System Requirements & Architecture' },
    { type: 'paragraph', text: 'The application requires specific runtime configurations to support SSR (Server-Side Rendering) and serverless database requests:' },
    
    { type: 'h2', text: '3.1. Frontend Requirements' },
    { type: 'bullet', text: 'React 19: Modern React framework for components and hooks.' },
    { type: 'bullet', text: 'TanStack Router & Start: Type-safe client-side routing, page layout shells, SSR engine, and server function executors.' },
    { type: 'bullet', text: 'TanStack Query (React Query): Client-side data fetching, automatic caching, caching invalidation, and data synchronization.' },
    
    { type: 'h2', text: '3.2. Backend & Deployment Requirements' },
    { type: 'bullet', text: 'Node.js: The project requires Node.js (version 18 or above) to run build and compilation commands.' },
    { type: 'bullet', text: 'Supabase Client SDK: Communicates with the Supabase PostgreSQL database, handles user authentication sessions, and handles file uploads to storage buckets.' },
    { type: 'bullet', text: 'Netlify Platform: Hosting target. Nitro compiles the SSR server bundles and automatically registers them as Netlify serverless functions, serving static assets from the dist directory.' }
  ];

  // Render elements
  for (const item of content) {
    if (item.type === 'spacer') {
      currentY -= item.height;
    } else {
      renderText(item.text, item.type);
    }
  }

  // Draw page number on the last page
  drawPageNumber();

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('DOCUMENTATION.pdf', pdfBytes);
  console.log('Successfully generated DOCUMENTATION.pdf');
}

createPdf().catch(console.error);
