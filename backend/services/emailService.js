// Log Email Service Configuration
console.log('📧 Email Service Configuration:');
console.log(`   BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '***configured***' : 'NOT SET'}`);
console.log(`   SMTP_FROM_EMAIL: ${process.env.SMTP_FROM_EMAIL || 'NOT SET'}`);
console.log('   Using: Brevo HTTP API (not SMTP)');

// Brevo API endpoint
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ── Brand colors (matches app theme) ─────────────────────────────────────────
const BRAND = {
  navy:        '#1A1A2E',
  navyMid:     '#1E1E38',
  navyLight:   '#252540',
  orange:      '#FF8C42',
  orangeLight: '#F5A53A',
  orangePale:  '#FFF4EC',
  orangeBorder:'#FFD4A8',
  purple:      '#7C6FCD',
  purplePale:  '#EEF0FF',
  purpleBorder:'#C7CAFE',
  green:       '#10B981',
  greenPale:   '#D1FAE5',
  red:         '#EF4444',
  redPale:     '#FEE2E2',
  amber:       '#F59E0B',
  amberPale:   '#FEF3C7',
  textDark:    '#1A1A2E',
  textMid:     '#475569',
  textLight:   '#64748B',
  textMuted:   '#94A3B8',
  bgPage:      '#F0F2F8',
  bgCard:      '#FFFFFF',
  bgSection:   '#F8FAFC',
  border:      '#E2E8F0',
};

// Send email using Brevo HTTP API
const sendEmailWithBrevoAPI = async (emailData) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'gazarisefyp@gmail.com';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  console.log(`📧 Sending email to: ${emailData.to}`);
  console.log(`📧 Subject: ${emailData.subject}`);
  console.log(`📧 Using: Brevo HTTP API`);

  const payload = {
    sender: { name: 'GazaRise', email: fromEmail },
    to: [{ email: emailData.to, name: emailData.toName || emailData.to }],
    subject: emailData.subject,
    htmlContent: emailData.html,
    textContent: emailData.text
  };

  // Add attachments if present (for certificates)
  if (emailData.attachments && emailData.attachments.length > 0) {
    payload.attachment = emailData.attachments
      .filter(att => att.content && att.filename)
      .map(att => ({
        name: att.filename,
        content: att.content.toString('base64')
      }));
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API error:', data);
      throw new Error(data.message || `Brevo API error: ${response.status}`);
    }

    console.log(`✅ Email sent successfully! Message ID: ${data.messageId}`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    throw error;
  }
};

// ── Shared logo block (text-based, reliable across all email clients) ─────────
const logoBlock = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
    <tr>
      <td style="background: rgba(255,255,255,0.12); border-radius: 14px; padding: 10px 22px; border: 1.5px solid rgba(255,255,255,0.2);">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 3px; color: rgba(255,255,255,0.55); text-transform: uppercase; display: block; text-align: center; margin-bottom: 2px;">✦ PLATFORM ✦</span>
        <span style="font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">Gaza</span><span style="font-size: 26px; font-weight: 900; color: ${BRAND.orange}; letter-spacing: -0.5px;">Rise</span>
      </td>
    </tr>
  </table>
`;

// ── Master email template ─────────────────────────────────────────────────────
const generateEmailTemplate = ({ title, subtitle, content, accentColor = BRAND.orange }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgPage};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:${BRAND.bgCard};border-radius:22px;overflow:hidden;box-shadow:0 12px 48px rgba(26,26,46,0.14);">

          <!-- Header — navy gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyLight} 60%,${BRAND.navyMid} 100%);padding:36px 32px 32px;text-align:center;position:relative;">
              <!-- Decorative top stripe -->
              <div style="background:${BRAND.orange};height:3px;border-radius:2px;width:60px;margin:0 auto 24px auto;"></div>
              ${logoBlock}
              <h1 style="color:#FFFFFF;margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:-0.3px;line-height:1.3;">${title}</h1>
              ${subtitle ? `<p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;font-weight:500;letter-spacing:0.2px;">${subtitle}</p>` : ''}
              <!-- Bottom accent line -->
              <div style="background:linear-gradient(90deg,transparent,${BRAND.orange},transparent);height:1px;margin-top:24px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(180deg,${BRAND.bgSection} 0%,#EEF0F6 100%);padding:24px 32px;text-align:center;border-top:1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    <span style="font-size:17px;font-weight:900;color:${BRAND.navy};">Gaza</span><span style="font-size:17px;font-weight:900;color:${BRAND.orange};">Rise</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color:${BRAND.textLight};margin:0;font-size:12px;line-height:1.5;">Learn Today, Rise Tomorrow</p>
                    <p style="color:${BRAND.textMuted};margin:10px 0 0 0;font-size:11px;">&copy; ${new Date().getFullYear()} GazaRise. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};

// ── Send OTP Email ────────────────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, name = 'User') => {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Hello, ${name}!</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">Use the verification code below to complete your sign-in to GazaRise:</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0 0 28px 0;">
          <!-- OTP Box — orange brand -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${BRAND.orangePale} 0%,#FFE8D0 100%);border-radius:18px;border:2px solid ${BRAND.orangeBorder};">
            <tr>
              <td style="padding:22px 44px;text-align:center;">
                <p style="margin:0 0 6px 0;font-size:10px;font-weight:800;letter-spacing:2.5px;color:${BRAND.orange};text-transform:uppercase;">Your Code</p>
                <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:${BRAND.navy};font-family:'SF Mono',Monaco,'Courier New',monospace;">${otp}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.amberPale};border-radius:12px;border-left:4px solid ${BRAND.amber};">
            <tr>
              <td style="padding:13px 16px;">
                <p style="color:#92400E;margin:0;font-size:13px;font-weight:500;">
                  &#9201; This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;">
          <p style="color:${BRAND.textMuted};margin:0;font-size:13px;line-height:1.6;">If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.</p>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: name,
    subject: `${otp} — Your GazaRise verification code`,
    html: generateEmailTemplate({ title: 'Verify Your Identity', subtitle: 'One-time sign-in code', content }),
    text: `Hello ${name},\n\nYour GazaRise verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nGazaRise`
  });
};

// ── Send Welcome Email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Welcome aboard, ${name}! 🎉</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">Your account is ready. We're thrilled to have you join the GazaRise learning community!</p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgSection};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td style="padding:6px 0;background:linear-gradient(135deg,${BRAND.navy},${BRAND.navyLight});"></td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 14px 0;font-size:13px;color:${BRAND.textMid};font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">What you can do now</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:7px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.green};margin-right:10px;font-weight:700;">&#10003;</span>Browse and enroll in expert-led courses</td></tr>
                  <tr><td style="padding:7px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.green};margin-right:10px;font-weight:700;">&#10003;</span>Track your learning progress in real time</td></tr>
                  <tr><td style="padding:7px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.green};margin-right:10px;font-weight:700;">&#10003;</span>Earn certificates upon course completion</td></tr>
                  <tr><td style="padding:7px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.green};margin-right:10px;font-weight:700;">&#10003;</span>Chat with your AI learning assistant</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,${BRAND.orange},${BRAND.orangeLight});border-radius:50px;padding:13px 32px;">
            <span style="color:#FFFFFF;font-size:14px;font-weight:800;letter-spacing:0.3px;">Start exploring courses today! →</span>
          </div>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: name,
    subject: 'Welcome to GazaRise — Let\'s Start Learning!',
    html: generateEmailTemplate({ title: 'Welcome to GazaRise!', subtitle: 'Your learning journey begins now', content }),
    text: `Welcome ${name}!\n\nYour account has been created successfully.\n\nYou can now:\n- Browse and enroll in courses\n- Track your learning progress\n- Earn certificates upon completion\n- Chat with your AI learning assistant\n\nStart exploring today!\n\nGazaRise`
  });
};

// ── Send Admin Account Created Email ─────────────────────────────────────────
const sendAdminAccountCreatedEmail = async (email, name, password, role) => {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const roleColor = role === 'expert' ? BRAND.purple : BRAND.orange;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Hello, ${name}!</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">You've been invited to join GazaRise as a <strong style="color:${roleColor};background:${roleColor}18;padding:2px 8px;border-radius:6px;">${roleDisplay}</strong>.</p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:28px;">
          <!-- Credentials box — navy themed -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;border:1.5px solid ${BRAND.navyLight};">
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND.navy},${BRAND.navyLight});padding:12px 20px;">
                <p style="margin:0;font-size:10px;color:${BRAND.orange};font-weight:800;text-transform:uppercase;letter-spacing:2px;">&#128274; Your Login Credentials</p>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.bgSection};padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
                      <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                      <span style="color:${BRAND.textDark};font-size:15px;font-weight:700;margin-top:3px;display:block;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;">
                      <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span><br>
                      <span style="color:${BRAND.navy};font-size:16px;font-weight:800;font-family:'SF Mono',Monaco,'Courier New',monospace;margin-top:3px;display:block;letter-spacing:1px;">${password}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.redPale};border-radius:12px;border-left:4px solid ${BRAND.red};">
            <tr>
              <td style="padding:13px 16px;">
                <p style="color:#DC2626;margin:0;font-size:13px;font-weight:600;">
                  &#9888; Please change your password immediately after your first login.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: name,
    subject: `Your GazaRise ${roleDisplay} Account is Ready`,
    html: generateEmailTemplate({ title: 'Account Created', subtitle: `${roleDisplay} access granted`, content }),
    text: `Hello ${name}!\n\nYou have been invited to join GazaRise as ${roleDisplay}.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after your first login.\n\nGazaRise`
  });
};

// ── Send Certificate Email ────────────────────────────────────────────────────
const sendCertificateEmail = async (email, studentName, courseName, certificateNumber, pdfBuffer) => {
  const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Congratulations, ${studentName}! 🏆</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">You've successfully completed the course. Your certificate of achievement is attached to this email.</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <!-- Course name spotlight — orange/navy -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyLight} 100%);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:4px 0;background:linear-gradient(90deg,${BRAND.orange},${BRAND.orangeLight},${BRAND.orange});"></td>
            </tr>
            <tr>
              <td style="padding:24px;text-align:center;">
                <p style="margin:0 0 6px 0;font-size:10px;color:${BRAND.orange};font-weight:800;text-transform:uppercase;letter-spacing:2.5px;">&#127942; Course Completed</p>
                <h2 style="margin:10px 0 0 0;font-size:19px;font-weight:800;color:#FFFFFF;line-height:1.4;">${courseName}</h2>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgSection};border-radius:14px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
                <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Certificate ID</span><br>
                <span style="color:${BRAND.navy};font-size:13px;font-weight:700;font-family:'SF Mono',Monaco,'Courier New',monospace;margin-top:4px;display:block;">${certificateNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;">
                <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Issue Date</span><br>
                <span style="color:${BRAND.textDark};font-size:14px;font-weight:600;margin-top:4px;display:block;">${issueDate}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,${BRAND.green},#059669);border-radius:50px;padding:12px 28px;">
            <span style="color:#FFFFFF;font-size:14px;font-weight:800;">Keep up the great work! &#127942;</span>
          </div>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: studentName,
    subject: `🏆 Your Certificate for "${courseName}" — GazaRise`,
    html: generateEmailTemplate({ title: 'Certificate Earned!', subtitle: 'You\'ve achieved something great', content }),
    text: `Congratulations ${studentName}!\n\nYou have successfully completed: ${courseName}\n\nCertificate ID: ${certificateNumber}\nIssue Date: ${issueDate}\n\nYour certificate is attached to this email.\n\nKeep up the great work!\n\nGazaRise`,
    attachments: [{ filename: `Certificate_${certificateNumber}.pdf`, content: pdfBuffer }]
  });
};

// ── Send Super Admin Welcome Email ────────────────────────────────────────────
const sendSuperAdminWelcomeEmail = async (email, name, password) => {
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Welcome, ${name}!</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">Your <strong style="color:${BRAND.orange};">Super Admin</strong> account has been created with full system access.</p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:24px;">
          <!-- Credentials box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;border:1.5px solid ${BRAND.navyLight};">
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND.navy},${BRAND.navyLight});padding:12px 20px;">
                <p style="margin:0;font-size:10px;color:${BRAND.orange};font-weight:800;text-transform:uppercase;letter-spacing:2px;">&#128274; Your Login Credentials</p>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.bgSection};padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.border};">
                      <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                      <span style="color:${BRAND.textDark};font-size:15px;font-weight:700;margin-top:3px;display:block;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;">
                      <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span><br>
                      <span style="color:${BRAND.navy};font-size:16px;font-weight:800;font-family:'SF Mono',Monaco,'Courier New',monospace;margin-top:3px;display:block;letter-spacing:1px;">${password}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgSection};border-radius:14px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td style="padding:14px 20px;background:${BRAND.orangePale};border-bottom:1px solid ${BRAND.orangeBorder};">
                <p style="margin:0;font-size:12px;color:${BRAND.orange};font-weight:800;text-transform:uppercase;letter-spacing:1px;">&#9733; Your Super Admin Permissions</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:6px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.orange};margin-right:10px;font-weight:700;">&#9670;</span>Manage all users, admins &amp; experts</td></tr>
                  <tr><td style="padding:6px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.orange};margin-right:10px;font-weight:700;">&#9670;</span>Create and manage all courses</td></tr>
                  <tr><td style="padding:6px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.orange};margin-right:10px;font-weight:700;">&#9670;</span>Configure certificate templates</td></tr>
                  <tr><td style="padding:6px 0;color:${BRAND.textLight};font-size:14px;"><span style="color:${BRAND.orange};margin-right:10px;font-weight:700;">&#9670;</span>View analytics and system reports</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.redPale};border-radius:12px;border-left:4px solid ${BRAND.red};">
            <tr>
              <td style="padding:13px 16px;">
                <p style="color:#DC2626;margin:0;font-size:13px;font-weight:600;">
                  &#9888; Please change your password immediately after your first login.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: name,
    subject: 'Welcome Super Admin — Your GazaRise Account is Ready',
    html: generateEmailTemplate({ title: 'Super Admin Access', subtitle: 'Full system privileges granted', content }),
    text: `Welcome ${name}!\n\nYour Super Admin account has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nPermissions:\n- Manage all users and admins\n- Create and manage courses\n- Configure certificate templates\n- View analytics and reports\n\nPlease change your password after your first login.\n\nGazaRise`
  });
};

// ── Send Reminder Email ───────────────────────────────────────────────────────
const sendReminderEmail = async (email, name, reminderText, scheduledAt) => {
  const formattedTime = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color:${BRAND.textDark};margin:0 0 6px 0;font-size:18px;font-weight:700;">Hey ${name}, don't forget! ⏰</p>
          <p style="color:${BRAND.textLight};margin:0 0 28px 0;font-size:15px;line-height:1.6;">Your reminder is coming up in <strong>30 minutes</strong>. Here's what you planned:</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyLight} 100%);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:4px 0;background:linear-gradient(90deg,${BRAND.orange},${BRAND.orangeLight},${BRAND.orange});"></td>
            </tr>
            <tr>
              <td style="padding:24px;text-align:center;">
                <p style="margin:0 0 8px 0;font-size:10px;color:${BRAND.orange};font-weight:800;text-transform:uppercase;letter-spacing:2.5px;">&#8987; Your Reminder</p>
                <h2 style="margin:0;font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.4;">${reminderText}</h2>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgSection};border-radius:14px;border:1px solid ${BRAND.border};">
            <tr>
              <td style="padding:16px 20px;">
                <span style="color:${BRAND.textMuted};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Scheduled For</span><br>
                <span style="color:${BRAND.textDark};font-size:15px;font-weight:700;margin-top:4px;display:block;">${formattedTime}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.amberPale};border-radius:12px;border-left:4px solid ${BRAND.amber};">
            <tr>
              <td style="padding:13px 16px;">
                <p style="color:#92400E;margin:0;font-size:13px;font-weight:500;">
                  &#9200; This reminder fires <strong>30 minutes before</strong> your scheduled time. Stay on track!
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return await sendEmailWithBrevoAPI({
    to: email,
    toName: name,
    subject: `⏰ Reminder in 30 min: "${reminderText}" — GazaRise`,
    html: generateEmailTemplate({ title: 'Reminder Alert', subtitle: '30 minutes to go!', content, accentColor: BRAND.amber }),
    text: `Hey ${name}!\n\nYour reminder is coming up in 30 minutes:\n\n"${reminderText}"\n\nScheduled for: ${formattedTime}\n\nStay on track!\n\nGazaRise`
  });
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendAdminAccountCreatedEmail,
  sendCertificateEmail,
  sendSuperAdminWelcomeEmail,
  sendReminderEmail
};
