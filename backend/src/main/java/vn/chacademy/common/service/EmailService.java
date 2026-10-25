package vn.chacademy.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@chacademy.vn}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 đ";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + " đ";
    }

    public boolean sendEnrollmentSuccessEmail(
            String toEmail,
            String studentName,
            String studentCode,
            String courseName,
            String className,
            BigDecimal totalFee,
            BigDecimal paidAmount,
            BigDecimal remainingDebt,
            String username,
            String plainPassword
    ) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send email: toEmail is empty for student {}", studentCode);
            return false;
        }

        String subject = "CH Academy — Xác nhận đăng ký khóa học & Cấp tài khoản học viên";
        String loginUrl = frontendUrl + "/login";

        String statusBadge = (remainingDebt == null || remainingDebt.compareTo(BigDecimal.ZERO) <= 0)
                ? "<span style='background-color:#dcfce7;color:#166534;padding:4px 10px;border-radius:9999px;font-weight:bold;font-size:12px;'>ĐÃ HOÀN THÀNH HỌC PHÍ</span>"
                : "<span style='background-color:#fef3c7;color:#92400e;padding:4px 10px;border-radius:9999px;font-weight:bold;font-size:12px;'>ĐÓNG MỘT PHẦN (CÒN THIẾU " + formatVnd(remainingDebt) + ")</span>";

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
                .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #142B4A 0%%, #1E3A8A 100%%); padding: 32px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.5px; }
                .header p { margin: 0; color: #93c5fd; font-size: 14px; }
                .content { padding: 32px 28px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .card-title { font-size: 15px; font-weight: bold; color: #142B4A; margin-top: 0; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13.5px; }
                .info-label { color: #64748b; }
                .info-val { font-weight: 600; color: #0f172a; text-align: right; }
                .creds-box { background: #eff6ff; border: 1px dashed #3b82f6; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center; }
                .btn { display: inline-block; background: #142B4A; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 12px; }
                .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>HỌC VIỆN CH ACADEMY</h1>
                  <p>Xác nhận Đăng ký & Thông tin Tài khoản Học viên</p>
                </div>
                <div class="content">
                  <p>Kính gửi <strong>%s</strong>,</p>
                  <p>CH Academy xin trân trọng chúc mừng bạn đã đăng ký thành công khóa học. Dưới đây là thông tin chi tiết về khóa học và biên lai học phí của bạn:</p>
                  
                  <div class="card">
                    <div class="card-title">📚 THÔNG TIN KHÓA HỌC & LỚP HỌC</div>
                    <div class="info-row"><span class="info-label">Mã học viên:</span><span class="info-val" style="color:#2563eb;font-family:monospace;">%s</span></div>
                    <div class="info-row"><span class="info-label">Khóa học:</span><span class="info-val">%s</span></div>
                    <div class="info-row"><span class="info-label">Lớp học:</span><span class="info-val">%s</span></div>
                  </div>

                  <div class="card">
                    <div class="card-title">💳 BIÊN LAI HỌC PHÍ</div>
                    <div class="info-row"><span class="info-label">Học phí niêm yết:</span><span class="info-val">%s</span></div>
                    <div class="info-row"><span class="info-label">Số tiền đã đóng:</span><span class="info-val" style="color:#16a34a;">%s</span></div>
                    <div class="info-row"><span class="info-label">Số tiền còn thiếu:</span><span class="info-val" style="color:#ea580c;">%s</span></div>
                    <div class="info-row" style="margin-top:12px;"><span class="info-label">Trạng thái:</span><span class="info-val">%s</span></div>
                  </div>

                  <div class="creds-box">
                    <h3 style="margin-top:0;color:#1e40af;font-size:16px;">🔑 TÀI KHOẢN ĐĂNG NHẬP CỔNG HỌC VIÊN</h3>
                    <p style="font-size:13px;color:#475569;margin-bottom:14px;">Bạn có thể đăng nhập để theo dõi lịch học, kết quả điểm danh và học phí cá nhân:</p>
                    <div style="font-size:14px;margin-bottom:8px;"><strong>Tên đăng nhập:</strong> <span style="font-family:monospace;background:#dbeafe;padding:3px 8px;border-radius:4px;">%s</span></div>
                    <div style="font-size:14px;margin-bottom:14px;"><strong>Mật khẩu khởi tạo:</strong> <span style="font-family:monospace;background:#dbeafe;padding:3px 8px;border-radius:4px;font-weight:bold;">%s</span></div>
                    <a href="%s" class="btn" target="_blank">ĐĂNG NHẬP NGAY</a>
                  </div>

                  <p style="font-size:12.5px;color:#64748b;line-height:1.5;">
                    * Lưu ý: Vì lý do an toàn, vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên tại mục cài đặt tài khoản.
                  </p>
                </div>
                <div class="footer">
                  <p style="margin:0 0 6px 0;"><strong>Học viện Đào tạo CH Academy</strong></p>
                  <p style="margin:0;">Hotline: 0988 123 456 | Email: tuyensinh@chacademy.edu.vn | Website: chacademy.vn</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                studentName,
                studentCode,
                courseName,
                className,
                formatVnd(totalFee),
                formatVnd(paidAmount),
                formatVnd(remainingDebt),
                statusBadge,
                username,
                plainPassword,
                loginUrl
        );

        return sendMimeEmail(toEmail, subject, htmlContent);
    }

    public boolean sendAccountCredentialsEmail(String toEmail, String studentName, String username, String plainPassword) {
        if (toEmail == null || toEmail.isBlank()) {
            return false;
        }

        String subject = "CH Academy — Thông tin tài khoản Cổng học viên";
        String loginUrl = frontendUrl + "/login";

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f8fafc;padding:24px;">
              <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;">
                <h2 style="color:#142B4A;margin-top:0;">Tài khoản Cổng học viên CH Academy</h2>
                <p>Xin chào <strong>%s</strong>,</p>
                <p>Tài khoản học viên của bạn tại CH Academy đã được khởi tạo/cập nhật:</p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:20px 0;">
                  <p style="margin:6px 0;"><strong>Tên đăng nhập:</strong> <code style="font-size:15px;color:#1e40af;">%s</code></p>
                  <p style="margin:6px 0;"><strong>Mật khẩu:</strong> <code style="font-size:15px;color:#1e40af;font-weight:bold;">%s</code></p>
                </div>
                <p><a href="%s" style="display:inline-block;background:#142B4A;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Truy cập cổng học viên</a></p>
                <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Nếu bạn không yêu cầu thông tin này, vui lòng liên hệ hotline 0988 123 456.</p>
              </div>
            </body>
            </html>
            """.formatted(studentName, username, plainPassword, loginUrl);

        return sendMimeEmail(toEmail, subject, htmlContent);
    }

    private boolean sendMimeEmail(String toEmail, String subject, String htmlContent) {
        // Always log preview for easy debugging and tracking
        log.info("========== EMAIL DISPATCH PREVIEW ==========");
        log.info("To: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("============================================");

        if (mailSender == null || mailPassword == null || mailPassword.isBlank()) {
            log.info("Chưa cấu hình Mật khẩu ứng dụng Gmail (spring.mail.password). Email thông tin tài khoản được mô phỏng an toàn cho {}", toEmail);
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "CH Academy");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("MIME Email successfully sent to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to deliver live email to {}: {}. Fallback simulation recorded.", toEmail, e.getMessage());
            return false;
        }
    }
}
