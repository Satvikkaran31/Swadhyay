import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

// Rate limiting middleware
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 3 requests per windowMs
  
  message: {
    error: 'Too many inquiry requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.MAIL_USER, // Your email
      pass: process.env.MAIL_PASS, // Your email password or app password
    },
  });
};

// Validation helper
const validateInquiryData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.email || !validator.isEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (data.phone && !validator.isMobilePhone(data.phone, 'any', { strictMode: false })) {
    errors.push('Please provide a valid phone number');
  }
  
  if (!data.message || data.message.trim().length < 1) {
    errors.push('Message must be at least 10 characters long');
  }
  
  return errors;
};

// Express.js route handler
// Export the rate limiter for use in server
export { inquiryLimiter };

export const handleInquiry = async (req, res) => {
    console.log("Incoming inquiry:", req.body);
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, message } = req.body;

    // Validate input data
    const validationErrors = validateInquiryData({ name, email, phone, message });
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    // Create email transporter
    const transporter = createTransporter();

    // Email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Inquiry - Swadhyay</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1D2A2D, #1C3437);
            color: #E0E7E9;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
          }
          .field {
            margin-bottom: 20px;
            padding: 15px;
            background: white;
            border-radius: 15px;
            border-left: 4px solid #1A2B3C;
          }
          .field-label {
            font-weight: 700;
            color: #1A2B3C;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .field-value {
            font-size: 16px;
            color: #333;
            word-wrap: break-word;
          }
          .message-field {
            white-space: pre-line;
            line-height: 1.8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
          .timestamp {
            background: #ECF5EE;
            padding: 15px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 20px;
            color: #1A2B3C;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 INQUIRY</h1>
          <p>New inquiry received from Swadhyay website</p>
        </div>
        
        <div class="timestamp">
          Received on: ${new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })} IST
        </div>
        
        <div class="content">
          <div class="field">
            <div class="field-label">Full Name</div>
            <div class="field-value">${validator.escape(name.trim())}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Email Address</div>
            <div class="field-value">
              <a href="mailto:${email.trim()}" style="color: #1A2B3C; text-decoration: none;">
                ${validator.escape(email.trim())}
              </a>
            </div>
          </div>
          
          ${phone ? `
          <div class="field">
            <div class="field-label">Phone Number</div>
            <div class="field-value">
              <a href="tel:${phone.trim()}" style="color: #1A2B3C; text-decoration: none;">
                ${validator.escape(phone.trim())}
              </a>
            </div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="field-label">Message</div>
            <div class="field-value message-field">${validator.escape(message.trim())}</div>
          </div>
        </div>
        
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: {
        name: 'Swadhyay Website',
        address: process.env.MAIL_USER
      },
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 INQUIRY - New Message from ${name.trim()}`,
      html: emailTemplate,
      // Also include plain text version
      text: `
INQUIRY - New inquiry received

Name: ${name.trim()}
Email: ${email.trim()}
Phone: ${phone ? phone.trim() : 'Not provided'}
Message: ${message.trim()}

Received on: ${new Date().toLocaleString('en-US', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})} IST
      `,
      // Set reply-to as the inquirer's email
      replyTo: email.trim()
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Log successful inquiry 
    console.log(`Inquiry received from ${name.trim()} (${email.trim()}) at ${new Date().toISOString()}`);

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Inquiry sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending inquiry email:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to send inquiry. Please try again later.' 
    });
  }
};