package com.example.courseplanner.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String FROM_CONTACT = "SFU Course Planner <contact@sfucourseplanner.com>";
    private static final String FROM_NOTIFICATIONS = "SFU Course Planner <notifications@sfucourseplanner.com>";
    private static final String FROM_SUPPORT = "SFU Course Planner Support <support@sfucourseplanner.com>";
    private static final String SUPPORT_EMAIL = "support@sfucourseplanner.com";

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    private void send(String to, String from, String subject, String htmlBody, String replyTo) {
        try {
            Resend resend = new Resend(resendApiKey);

            CreateEmailOptions.Builder builder = CreateEmailOptions.builder()
                    .from(from)
                    .to(to)
                    .subject(subject)
                    .html(htmlBody);

            if (replyTo != null) {
                builder.replyTo(replyTo);
            }

            CreateEmailResponse response = resend.emails().send(builder.build());
            log.info("Email sent successfully [id={}, to={}, subject={}]", response.getId(), to, subject);
        } catch (Exception e) {
            log.error("Failed to send email [to={}, subject={}]: {}", to, subject, e.getMessage(), e);
        }
    }

    public void sendContactFormEmail(String senderName, String senderEmail, String message) {
        String subject = "Contact Form: " + senderName;

        String html = """
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
                    <table style="width: 100%%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Name</td>
                            <td style="padding: 8px 12px;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
                            <td style="padding: 8px 12px;">%s</td>
                        </tr>
                    </table>
                    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
                        <p style="margin: 0; white-space: pre-wrap;">%s</p>
                    </div>
                </div>
                """.formatted(
                escapeHtml(senderName),
                escapeHtml(senderEmail),
                escapeHtml(message)
        );

        send(SUPPORT_EMAIL, FROM_CONTACT, subject, html, senderEmail);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public void sendNotificationDigest(String toEmail, String subject, String htmlBody) {
        send(toEmail, FROM_NOTIFICATIONS, subject, htmlBody, null);
    }

    public void sendSupportReply(String toEmail, String userName, String replyMessage) {
        String subject = "Re: Your message to SFU Course Planner";

        String html = """
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Hi %s,</p>
                    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px; margin-bottom: 16px;">
                        <p style="margin: 0; white-space: pre-wrap;">%s</p>
                    </div>
                    <p style="color: #888; font-size: 13px;">— SFU Course Planner Support</p>
                </div>
                """.formatted(
                escapeHtml(userName),
                escapeHtml(replyMessage)
        );

        send(toEmail, FROM_SUPPORT, subject, html, SUPPORT_EMAIL);
    }
}
