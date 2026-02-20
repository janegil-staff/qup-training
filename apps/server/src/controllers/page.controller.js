export const privacyPolicy = (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - QUP Training</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; }
    p, li { font-size: 15px; }
    ul { padding-left: 20px; }
    .updated { color: #666; font-size: 14px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>Privacy Policy for QUP Training</h1>
  <p class="updated">Last updated: January 2026</p>
  <h2>1. Introduction</h2>
  <p>QUP ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application ("the App").</p>
  <h2>2. Information We Collect</h2>
  <p>We may collect:</p>
  <ul>
    <li>Profile information you choose to provide</li>
    <li>Messages or content you send in the app</li>
    <li>Device information (model, OS version, identifiers)</li>
    <li>Usage data (interactions, crash logs)</li>
    <li>Approximate location if required for app functionality</li>
  </ul>
  <p>We do not collect sensitive personal data unless you explicitly provide it.</p>
  <h2>3. How We Use Your Information</h2>
  <p>We use your information to:</p>
  <ul>
    <li>Operate and improve the app</li>
    <li>Enhance performance and stability</li>
    <li>Communicate with you about updates or support</li>
    <li>Prevent misuse and ensure safety</li>
  </ul>
  <p>We do not sell your data.</p>
  <h2>4. Sharing of Information</h2>
  <p>We may share information only with:</p>
  <ul>
    <li>Service providers (analytics, crash reporting)</li>
    <li>Legal authorities if required by law</li>
    <li>To protect the rights and safety of users</li>
  </ul>
  <p>We do not share data for advertising.</p>
  <h2>5. Data Security</h2>
  <p>We use reasonable technical and organizational measures to protect your data. No method is 100% secure.</p>
  <h2>6. Children's Privacy</h2>
  <p>QUP Training is not intended for children under 18. We do not knowingly collect data from children under 18.</p>
  <h2>7. Your Rights</h2>
  <p>You may request:</p>
  <ul>
    <li>Access to your data</li>
    <li>Correction or deletion</li>
    <li>Withdrawal of consent</li>
  </ul>
  <p>Contact us using the email below.</p>
  <h2>8. Third-Party Services</h2>
  <p>The app may use third-party tools such as analytics or crash reporting. These services follow their own privacy policies.</p>
  <h2>9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy. The latest version will always be available at this URL.</p>
  <h2>10. Contact Us</h2>
  <p>Email: qup.dating@gmail.com<br>Company: QUP DA<br>Country: Norway</p>
</body>
</html>`);
};

export const support = (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support - QUP Training</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; }
    p { font-size: 15px; }
    a { color: #4F46E5; }
    .subtitle { color: #666; font-size: 15px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>QUP Training Support</h1>
  <p class="subtitle">We're here to help you get the most out of QUP Training.</p>
  <h2>Contact Us</h2>
  <p>For questions, feedback, or issues, reach out to us at:<br><a href="mailto:qup.dating@gmail.com">qup.dating@gmail.com</a></p>
  <h2>Common Topics</h2>
  <p><strong>Account Issues</strong> — If you're having trouble logging in or need to reset your password, use the "Forgot Password" option on the login screen.</p>
  <p><strong>Bug Reports</strong> — Please include your device model, OS version, and steps to reproduce the issue when contacting us.</p>
  <p><strong>Feature Requests</strong> — We love hearing your ideas. Send them to the email above.</p>
  <p><strong>Data & Privacy</strong> — See our <a href="/privacy">Privacy Policy</a> for details on how we handle your data. To request data deletion, email us.</p>
  <h2>Account Deletion</h2>
  <p>You can delete your account directly in the app under Settings, or email us and we'll process your request within 48 hours.</p>
</body>
</html>`);
};

export const deleteAccount = (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delete Account - QUP Training</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #222; line-height: 1.7; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; }
    p { font-size: 15px; }
    a { color: #4F46E5; }
  </style>
</head>
<body>
  <h1>Delete Your Account</h1>
  <h2>In the App</h2>
  <p>Go to Settings > Delete Account and confirm. All your data will be permanently removed.</p>
  <h2>Via Email</h2>
  <p>Send a request to <a href="mailto:qup.dating@gmail.com">qup.dating@gmail.com</a> with the subject "Account Deletion Request" and we'll process it within 48 hours.</p>
  <h2>What Gets Deleted</h2>
  <p>Your profile, workout logs, nutrition data, body stats, posts, and all associated data will be permanently deleted. This action cannot be undone.</p>
</body>
</html>`);
};
