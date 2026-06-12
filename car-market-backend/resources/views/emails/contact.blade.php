<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission - AutoMarket</title>
  <style>
    /* Reset & Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
        background-color: #f3f4f6; 
        color: #1f2937; 
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
    }
    
    /* Layout */
    .email-wrapper { 
        width: 100%; 
        background-color: #f3f4f6; 
        padding: 40px 20px; 
    }
    .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
    }

    /* Header / Branding */
    .header { 
        background-color: #ffffff; /* White background for logo */
        padding: 30px 40px; 
        text-align: center; 
        border-bottom: 2px solid #f3f4f6;
    }
    .logo-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }
    .logo-img {
        height: 48px;
        width: auto;
    }
    .header-subtitle { 
        color: #6b7280; 
        font-size: 15px; 
        margin-top: 15px; 
        font-weight: 500;
    }

    /* Body */
    .body-content { 
        padding: 40px; 
    }
    .greeting { 
        font-size: 20px; 
        font-weight: 700; 
        color: #111827; 
        margin-bottom: 24px; 
    }
    
    /* Card Layout for details */
    .details-card {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 30px;
    }
    
    .detail-row {
        margin-bottom: 16px;
    }
    .detail-row:last-child {
        margin-bottom: 0;
    }
    .detail-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        font-weight: 700;
        margin-bottom: 4px;
    }
    .detail-value {
        font-size: 16px;
        color: #111827;
        font-weight: 500;
    }
    .detail-value a {
        color: #D32F2F;
        text-decoration: none;
    }
    .detail-value a:hover {
        text-decoration: underline;
    }

    /* Message Box */
    .message-box {
        background-color: #ffffff;
        border-left: 4px solid #D32F2F;
        padding: 16px 20px;
        margin-top: 8px;
        font-size: 15px;
        color: #374151;
        line-height: 1.7;
        white-space: pre-wrap;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    /* Action Button */
    .action-container {
        text-align: center;
        margin-top: 40px;
        margin-bottom: 10px;
    }
    .btn-reply {
        display: inline-block;
        background-color: #D32F2F;
        color: #ffffff !important;
        font-weight: 600;
        font-size: 16px;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.4);
    }
    .btn-reply:hover {
        background-color: #B71C1C;
    }

    /* Footer */
    .footer { 
        background-color: #f9fafb; 
        padding: 24px 40px; 
        text-align: center; 
        border-top: 1px solid #f3f4f6;
    }
    .footer p { 
        font-size: 13px; 
        color: #9ca3af; 
        margin-bottom: 8px;
    }
    .timestamp {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
    }

    /* Mobile Responsiveness */
    @media only screen and (max-width: 600px) {
        .email-wrapper { padding: 20px 10px; }
        .header { padding: 24px 20px; }
        .body-content { padding: 24px 20px; }
        .footer { padding: 20px; }
        .details-card { padding: 16px; }
        .btn-reply { display: block; width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <!-- Header -->
      <div class="header">
        <div class="logo-container">
            <img src="http://localhost:5173/logo/logo-horizontal.svg" alt="AutoMarket" class="logo-img">
        </div>
        <div class="header-subtitle">New Contact Form Submission</div>
      </div>

      <!-- Body -->
      <div class="body-content">
        <h2 class="greeting">Hello Admin,</h2>
        <p style="margin-bottom: 24px; color: #4b5563; font-size: 15px;">
          You have received a new message from the AutoMarket contact form. Please find the details of the inquiry below:
        </p>

        <!-- Clean Card Layout -->
        <div class="details-card">
          <div class="detail-row">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">{{ $senderName }}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label">Email Address</div>
            <div class="detail-value">
              <a href="mailto:{{ $senderEmail }}">{{ $senderEmail }}</a>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label">Subject</div>
            <div class="detail-value" style="font-weight: 600;">{{ $mailSubject }}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-label">Message</div>
            <div class="message-box">{{ $userMessage }}</div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="action-container">
          <!-- The href mailto allows one-click reply directly to the user -->
          <a href="mailto:{{ $senderEmail }}?subject=Re: {{ urlencode($mailSubject) }}" class="btn-reply">
            Reply to {{ $senderName }}
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This email was automatically generated by the AutoMarket platform.</p>
        <div class="timestamp">
            Submitted on: {{ $submissionDate }}
        </div>
      </div>

    </div>
  </div>
</body>
</html>

