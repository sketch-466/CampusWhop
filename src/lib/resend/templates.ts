export function verificationEmailTemplate(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - CampusWhop</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { color: #10b981; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .card { background-color: #18181b; border-radius: 12px; padding: 32px; text-align: center; }
    .headline { color: #fafafa; font-size: 20px; font-weight: 600; margin-bottom: 16px; }
    .body { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .button:hover { background-color: #059669; }
    .footer { text-align: center; margin-top: 24px; color: #71717a; font-size: 12px; }
    .url { color: #a1a1aa; font-size: 12px; word-break: break-all; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">CampusWhop</span>
    </div>
    <div class="card">
      <h1 class="headline">Verify Your Email</h1>
      <p class="body">Click the button below to verify your email address and activate your CampusWhop account.</p>
      <a href="${verifyUrl}" class="button">Verify Email</a>
      <p class="url">Or copy this link: ${verifyUrl}</p>
    </div>
    <div class="footer">
      <p>CampusWhop — The Economic OS for Nigerian Students</p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function passwordResetEmailTemplate(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - CampusWhop</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { color: #10b981; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .card { background-color: #18181b; border-radius: 12px; padding: 32px; text-align: center; }
    .headline { color: #fafafa; font-size: 20px; font-weight: 600; margin-bottom: 16px; }
    .body { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .button:hover { background-color: #059669; }
    .footer { text-align: center; margin-top: 24px; color: #71717a; font-size: 12px; }
    .url { color: #a1a1aa; font-size: 12px; word-break: break-all; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">CampusWhop</span>
    </div>
    <div class="card">
      <h1 class="headline">Reset Your Password</h1>
      <p class="body">Click the button below to reset your CampusWhop password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p class="url">Or copy this link: ${resetUrl}</p>
    </div>
    <div class="footer">
      <p>CampusWhop — The Economic OS for Nigerian Students</p>
      <p>If you didn't request this reset, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
