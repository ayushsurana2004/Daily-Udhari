package com.dailyudhari.server.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * EmailService — sends all transactional emails for Daily Udhar via Gmail SMTP.
 * All send methods are @Async so they never block the HTTP response.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. WELCOME EMAIL
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "🎉 Welcome to Daily Udhari, " + userName + "!";
        String html = buildHtml(
            "Welcome to Daily Udhari! 🚀",
            "Hey <strong>" + userName + "</strong>, you're all set!",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Daily Udhari makes splitting bills, tracking debts, and settling up with friends completely <strong style='color:#10b981;'>effortless</strong>.</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Here's what you can do:</p>"
            + "<ul style='color:#94a3b8;font-size:14px;line-height:2;padding-left:20px;'>"
            + "<li>💸 Add and split expenses equally, by exact amount, or by percentage</li>"
            + "<li>👥 Create squads and track group expenses</li>"
            + "<li>🔐 Settle debts with a secure 2-step 6-digit PIN</li>"
            + "<li>📊 View your real-time balance dashboard</li>"
            + "</ul>",
            null, null,
            "Go to Dashboard", "http://localhost:5173"
        );
        sendEmail(toEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SETTLEMENT INITIATED — notify PAYEE
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendSettlementInitiatedEmail(
            String payeeEmail, String payeeName,
            String payerName, BigDecimal amount, String pin) {

        String subject = "💰 " + payerName + " wants to pay you ₹" + amount;
        String html = buildHtml(
            "Payment Incoming! 💰",
            payerName + " has initiated a settlement with you.",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + payeeName + "</strong>, <strong style='color:#10b981;'>" + payerName + "</strong> wants to settle ₹<strong style='color:#10b981;font-size:18px;'>" + amount + "</strong> with you.</p>"
            + "<p style='color:#94a3b8;font-size:15px;'>To confirm the payment, use the secure <strong>6-digit PIN</strong> below:</p>"
            + "<div style='text-align:center;margin:28px 0;'>"
            + "<div style='display:inline-block;background:linear-gradient(135deg,#064e3b,#065f46);border:2px solid #10b981;border-radius:16px;padding:20px 40px;'>"
            + "<p style='color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;'>Your Settlement PIN</p>"
            + "<p style='color:#fff;font-size:42px;font-weight:900;letter-spacing:10px;font-family:monospace;margin:0;'>" + pin + "</p>"
            + "</div></div>"
            + "<p style='color:#64748b;font-size:12px;text-align:center;'>Share this PIN with " + payerName + " to complete the settlement, or approve directly from your dashboard.</p>",
            "⚠️", "This PIN expires in 24 hours. Do not share it with anyone other than " + payerName + ".",
            "Approve on Dashboard", "http://localhost:5173"
        );
        sendEmail(payeeEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SETTLEMENT CONFIRMED — notify PAYER
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendSettlementConfirmedEmail(
            String payerEmail, String payerName,
            String payeeName, BigDecimal amount) {

        String subject = "✅ Settlement of ₹" + amount + " confirmed by " + payeeName;
        String html = buildHtml(
            "Payment Confirmed! ✅",
            "Your settlement has been approved.",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + payerName + "</strong>, great news!</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#10b981;'>" + payeeName + "</strong> has confirmed your payment of ₹<strong style='color:#10b981;font-size:18px;'>" + amount + "</strong>.</p>"
            + "<div style='text-align:center;margin:28px 0;'>"
            + "<div style='display:inline-flex;align-items:center;gap:12px;background:#022c22;border:2px solid #10b981;border-radius:16px;padding:16px 32px;'>"
            + "<span style='font-size:32px;'>✅</span>"
            + "<div style='text-align:left;'>"
            + "<p style='color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;'>Settlement Complete</p>"
            + "<p style='color:#fff;font-size:22px;font-weight:900;margin:4px 0 0;'>₹" + amount + " Settled</p>"
            + "</div></div></div>"
            + "<p style='color:#94a3b8;font-size:14px;text-align:center;'>Your balance has been updated. Check your dashboard for the latest status.</p>",
            null, null,
            "View Dashboard", "http://localhost:5173"
        );
        sendEmail(payerEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. NEW EXPENSE ADDED — notify a group member
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendExpenseAddedEmail(
            String memberEmail, String memberName,
            String payerName, String description,
            BigDecimal totalAmount, BigDecimal yourShare,
            String groupName) {

        String subject = "🧾 New expense in " + groupName + ": " + description;
        String html = buildHtml(
            "New Expense Added 🧾",
            payerName + " added an expense in \"" + groupName + "\".",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + memberName + "</strong>,</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#10b981;'>" + payerName + "</strong> paid for <strong>" + description + "</strong> in the group <strong>" + groupName + "</strong>.</p>"
            + "<div style='background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px;margin:20px 0;'>"
            + "<div style='display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;'>"
            + "<span style='color:#64748b;font-size:13px;'>Total Bill</span>"
            + "<span style='color:#fff;font-weight:700;font-size:15px;'>₹" + totalAmount + "</span>"
            + "</div>"
            + "<div style='display:flex;justify-content:space-between;'>"
            + "<span style='color:#64748b;font-size:13px;'>Your Share</span>"
            + "<span style='color:#f43f5e;font-weight:900;font-size:18px;'>₹" + yourShare + "</span>"
            + "</div></div>"
            + "<p style='color:#64748b;font-size:12px;text-align:center;'>This has been recorded in your Daily Udhari balance.</p>",
            null, null,
            "View in Dashboard", "http://localhost:5173"
        );
        sendEmail(memberEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. FRIEND INVITATION RECEIVED
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendFriendInviteEmail(String toEmail, String recipientName, String senderName) {
        String subject = "🤝 " + senderName + " invited you to connect on Daily Udhari!";
        String html = buildHtml(
            "Friend Request Received! 🤝",
            senderName + " wants to connect with you.",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + recipientName + "</strong>,</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#10b981;'>" + senderName + "</strong> has sent you a friend request on Daily Udhari. Once accepted, you can split bills, track shared expenses, and settle debts easily.</p>"
            + "<p style='color:#94a3b8;font-size:14px;line-height:1.7;'>You can accept or decline this invite right from your dashboard.</p>",
            null, null,
            "Review Invite in Dashboard", "http://localhost:5173"
        );
        sendEmail(toEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. SQUAD / GROUP INVITATION RECEIVED
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendGroupInviteEmail(String toEmail, String recipientName, String senderName, String groupName) {
        String subject = "👥 " + senderName + " invited you to join \"" + groupName + "\" squad!";
        String html = buildHtml(
            "Squad Invite Received! 👥",
            "You've been invited to join " + groupName,
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + recipientName + "</strong>,</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#06b6d4;'>" + senderName + "</strong> has invited you to join the squad <strong style='color:#fff;'>\"" + groupName + "\"</strong>.</p>"
            + "<p style='color:#94a3b8;font-size:14px;line-height:1.7;'>Head to your dashboard to review and approve the invitation.</p>",
            null, null,
            "Review Squad Invite", "http://localhost:5173"
        );
        sendEmail(toEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. INVITATION ACCEPTED CONFIRMATIONS
    // ─────────────────────────────────────────────────────────────────────────

    @Async
    public void sendFriendAddedEmail(String toEmail, String recipientName, String newFriendName) {
        String subject = "🤝 " + newFriendName + " is now in your Daily Udhari network!";
        String html = buildHtml(
            "Friend Added! 🤝",
            "Your network is growing.",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + recipientName + "</strong>,</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#10b981;'>" + newFriendName + "</strong> accepted the friend request and is now in your network. You can now split expenses together!</p>",
            null, null,
            "View Friends", "http://localhost:5173/friends"
        );
        sendEmail(toEmail, subject, html);
    }

    @Async
    public void sendGroupJoinedEmail(String toEmail, String recipientName, String newMemberName, String groupName) {
        String subject = "🎉 " + newMemberName + " joined \"" + groupName + "\"!";
        String html = buildHtml(
            "New Squad Member! 🎉",
            newMemberName + " has joined the squad",
            "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'>Hey <strong>" + recipientName + "</strong>,</p>"
            + "<p style='color:#94a3b8;font-size:15px;line-height:1.7;'><strong style='color:#06b6d4;'>" + newMemberName + "</strong> accepted the invitation and joined <strong style='color:#fff;'>\"" + groupName + "\"</strong>!</p>",
            null, null,
            "View Squad", "http://localhost:5173"
        );
        sendEmail(toEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE: build beautiful HTML template
    // ─────────────────────────────────────────────────────────────────────────

    private String buildHtml(String heading, String subheading, String bodyContent,
                              String alertIcon, String alertText,
                              String ctaLabel, String ctaUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>")
          .append("<body style='margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;'>")
          .append("<table width='100%' cellpadding='0' cellspacing='0' style='background:#020617;padding:40px 20px;'>")
          .append("<tr><td align='center'>")
          .append("<table width='580' cellpadding='0' cellspacing='0' style='max-width:580px;width:100%;'>")

          // ── Header ──
          .append("<tr><td style='background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;'>")
          .append("<div style='width:52px;height:52px;background:#10b981;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;'>")
          .append("<span style='color:#020617;font-size:28px;font-weight:900;'>D</span></div>")
          .append("<p style='color:#6ee7b7;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;'>DAILY UDHARI</p>")
          .append("<p style='color:#94a3b8;font-size:11px;margin:0;'>Premium Financial Companion</p>")
          .append("</td></tr>")

          // ── Divider line ──
          .append("<tr><td style='height:3px;background:linear-gradient(90deg,#10b981,#06b6d4,#10b981);'></td></tr>")

          // ── Body ──
          .append("<tr><td style='background:#0f172a;padding:40px;'>")
          .append("<h1 style='color:#fff;font-size:24px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;'>").append(heading).append("</h1>")
          .append("<p style='color:#10b981;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px;'>").append(subheading).append("</p>")
          .append(bodyContent);

        // Optional alert box
        if (alertIcon != null && alertText != null) {
            sb.append("<div style='background:#1e293b;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin-top:20px;'>")
              .append("<p style='color:#fbbf24;font-size:13px;margin:0;'><strong>").append(alertIcon).append("</strong> ").append(alertText).append("</p>")
              .append("</div>");
        }

        // CTA button
        if (ctaLabel != null && ctaUrl != null) {
            sb.append("<div style='text-align:center;margin-top:32px;'>")
              .append("<a href='").append(ctaUrl).append("' style='display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);color:#020617;font-size:14px;font-weight:900;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.5px;'>")
              .append(ctaLabel).append("</a></div>");
        }

        sb.append("</td></tr>")

          // ── Footer ──
          .append("<tr><td style='background:#0a0f1a;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;'>")
          .append("<p style='color:#334155;font-size:12px;margin:0 0 6px;'>You received this email because you have a Daily Udhari account.</p>")
          .append("<p style='color:#334155;font-size:11px;margin:0;'>© 2026 Daily Udhari · Powered by ☕ &amp; 💻</p>")
          .append("</td></tr>")

          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE: send via JavaMailSender
    // ─────────────────────────────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("[EmailService] Email sent → " + to + " | " + subject);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
