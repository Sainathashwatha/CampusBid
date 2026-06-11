import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || "smtp.gmail.com",
  port:   process.env.EMAIL_PORT   || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service ready");
  } catch (err) {
    console.warn("⚠️  Email not configured:", err.message);
  }
};

const emailWrapper = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
              background:#f8fafc;padding:24px;border-radius:12px">
    <div style="background:white;border-radius:8px;padding:32px;border:1px solid #e2e8f0">
      ${content}
    </div>
    <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:16px">
      Campus Auction — Your college marketplace
    </p>
  </div>
`;

// ── AUCTION END EMAILS ────────────────────────────────────────────
export const sendAuctionEndEmail = async ({
  to, role, listingTitle = "your item", listingId, amount,
  winnerName, sellerName, sellerEmail,
  buyerName, buyerEmail,
}) => {
  try {
    let subject, html;

    if (role === "winner") {
      subject = `🎉 You won: ${listingTitle} — ₹${amount?.toLocaleString("en-IN")}`;
      html = emailWrapper(`
        <h2 style="color:#1e293b;margin:0 0 8px">Congratulations ${winnerName}! 🎉</h2>
        <p style="color:#64748b;margin:0 0 24px">
          You won the auction for <strong>${listingTitle}</strong>.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;
                    border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-size:13px;color:#166534">
            <strong>Your winning bid:</strong>
            <span style="font-size:24px;font-weight:bold;color:#15803d;margin-left:8px">
              ₹${amount?.toLocaleString("en-IN")}
            </span>
          </p>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;
                    border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#1e40af">
            📞 Seller Contact Details
          </p>
          <p style="margin:0;font-size:13px;color:#1e40af">
            <strong>${sellerName}</strong><br/>
            <a href="mailto:${sellerEmail}" style="color:#2563eb">${sellerEmail}</a>
          </p>
        </div>

        <p style="color:#64748b;font-size:13px;margin:0">
          Please reach out to the seller to arrange pickup and payment.
        </p>
      `);
    }

    else if (role === "seller") {
      subject = `💰 ${listingTitle} sold for ₹${amount?.toLocaleString("en-IN")}!`;
      html = emailWrapper(`
        <h2 style="color:#1e293b;margin:0 0 8px">Your item sold! 💰</h2>
        <p style="color:#64748b;margin:0 0 24px">
          <strong>${listingTitle}</strong> has a winner.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;
                    border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-size:13px;color:#166534">
            <strong>Final price:</strong>
            <span style="font-size:24px;font-weight:bold;color:#15803d;margin-left:8px">
              ₹${amount?.toLocaleString("en-IN")}
            </span>
          </p>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;
                    border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#1e40af">
            📞 Buyer Contact Details
          </p>
          <p style="margin:0;font-size:13px;color:#1e40af">
            <strong>${buyerName}</strong><br/>
            <a href="mailto:${buyerEmail}" style="color:#2563eb">${buyerEmail}</a>
          </p>
        </div>

        <p style="color:#64748b;font-size:13px;margin:0">
          The buyer has been notified and will reach out to arrange handover.
        </p>
      `);
    }

    else if (role === "seller_no_bids") {
      subject = `Auction ended — no bids for ${listingTitle}`;
      html = emailWrapper(`
        <h2 style="color:#1e293b;margin:0 0 8px">Your auction ended</h2>
        <p style="color:#64748b;margin:0 0 16px">
          Unfortunately <strong>${listingTitle}</strong> received no bids this time.
        </p>
        <p style="color:#64748b;font-size:13px;margin:0">
          Consider re-listing with a lower starting price, or switching to
          <strong>Fixed Price</strong> or <strong>Negotiable</strong> mode.
        </p>
      `);
    }

    await transporter.sendMail({
      from: `"Campus Auction" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`📧 Email sent → ${to} (${role})`);
  } catch (err) {
    console.error(`❌ Email failed → ${to}:`, err.message);
  }
};

// ── PAYMENT EMAILS ────────────────────────────────────────────────
export const sendPaymentEmail = async ({
  to, role, amount, buyerName, sellerName,
}) => {
  try {
    let subject, html;

    if (role === "payment_buyer") {
      subject = `✅ Payment confirmed — ₹${amount?.toLocaleString("en-IN")}`;
      html = emailWrapper(`
        <h2 style="color:#1e293b;margin:0 0 8px">Payment Successful! ✅</h2>
        <p style="color:#64748b;margin:0 0 16px">
          Hi ${buyerName}, your payment of
          <strong style="color:#15803d">₹${amount?.toLocaleString("en-IN")}</strong>
          has been confirmed.
        </p>
        <p style="color:#64748b;font-size:13px">
          The seller has been notified and will contact you to arrange handover.
        </p>
      `);
    }

    else if (role === "payment_seller") {
      subject = `💰 Payment received — ₹${amount?.toLocaleString("en-IN")}`;
      html = emailWrapper(`
        <h2 style="color:#1e293b;margin:0 0 8px">You've been paid! 💰</h2>
        <p style="color:#64748b;margin:0 0 16px">
          Hi ${sellerName}, ${buyerName} has paid
          <strong style="color:#15803d">₹${amount?.toLocaleString("en-IN")}</strong>.
        </p>
        <p style="color:#64748b;font-size:13px">
          Please arrange handover with the buyer.
        </p>
      `);
    }

    await transporter.sendMail({
      from: `"Campus Auction" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error(`❌ Payment email failed → ${to}:`, err.message);
  }
};