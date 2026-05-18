// ============================================================
// Supabase Edge Function: send-quote-email
// Uses Resend to email quotes to customers
// ============================================================
// DEPLOYMENT INSTRUCTIONS:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref YOUR_PROJECT_ID
// 4. Create function folder: supabase/functions/send-quote-email/
// 5. Save this file as: supabase/functions/send-quote-email/index.ts
// 6. Set secret: supabase secrets set RESEND_API_KEY=your_key_here
// 7. Deploy: supabase functions deploy send-quote-email
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "quotes@hpcmcrm.net"; // Must match your verified Resend domain

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { quoteId, customerEmail, customerName, quoteNumber, total } = await req.json();

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email provided" }), { status: 400 });
    }

    // Format total as currency
    const totalFormatted = "$" + Number(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Build the email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote ${quoteNumber} from High Plains Custom Metal</title>
</head>
<body style="margin:0;padding:0;background:#F4F2EE;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    
    <!-- Header -->
    <div style="background:#1C2B3A;padding:32px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#ffffff;margin-bottom:4px;">
        High Plains Custom Metal
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);">Cheyenne, Wyoming</div>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="font-size:16px;color:#1C2B3A;margin:0 0 16px;">Hi ${customerName || "there"},</p>
      
      <p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0 0 24px;">
        Thank you for your interest in High Plains Custom Metal. Your quote is ready for review. 
        Please click the button below to view the full details and approve it online.
      </p>

      <!-- Quote summary box -->
      <div style="background:#F4F2EE;border-radius:10px;padding:20px 24px;margin-bottom:28px;border:1px solid #E8E4DC;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:12px;color:#4A6580;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Quote Number</div>
            <div style="font-size:18px;font-weight:700;color:#1C2B3A;font-family:Georgia,serif;">${quoteNumber}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:#4A6580;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total Amount</div>
            <div style="font-size:22px;font-weight:700;color:#B87333;font-family:Georgia,serif;">${totalFormatted}</div>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="https://hpcmcrm.net/quote/${quoteId}" 
           style="display:inline-block;background:#B87333;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
          Review &amp; Approve Quote →
        </a>
      </div>

      <p style="font-size:13px;color:#4A6580;line-height:1.6;margin:0 0 8px;">
        This quote is valid for <strong>30 days</strong>. Prices are subject to material availability.
        If you have any questions, please don't hesitate to reach out.
      </p>

      <p style="font-size:13px;color:#4A6580;margin:0;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <span style="color:#B87333;font-size:12px;">https://hpcmcrm.net/quote/${quoteId}</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F4F2EE;padding:20px 40px;border-top:1px solid #E8E4DC;text-align:center;">
      <div style="font-size:12px;color:#4A6580;">
        High Plains Custom Metal · Cheyenne, Wyoming<br>
        <a href="https://hpcmcrm.net" style="color:#B87333;text-decoration:none;">hpcmcrm.net</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `High Plains Custom Metal <${FROM_EMAIL}>`,
        to: [customerEmail],
        subject: `Quote ${quoteNumber} from High Plains Custom Metal — ${totalFormatted}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: resendData.message || "Email send failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
