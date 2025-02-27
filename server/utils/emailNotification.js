const nodemailer = require('nodemailer');

/**
 * Send an email notification
 * @param {string} recipients - Comma-separated list of email recipients
 * @param {Object} message - The message to send
 * @param {string} message.title - The title/subject of the message
 * @param {string} message.description - The description/body of the message
 * @returns {Promise<Object>} - The response from the email service
 */
async function sendEmailNotification(recipients, message) {
  if (!recipients) {
    throw new Error('Email recipients are required');
  }

  // Create a test account if no SMTP settings are provided
  // In production, you would use real SMTP settings from environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'powerpulse@example.com';
  
  let transporter;
  let testAccount;
  
  if (!smtpHost || !smtpPort) {
    // Create a test account using Ethereal Email for development
    console.log('No SMTP settings found, using Ethereal Email for testing');
    testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } else {
    // Use provided SMTP settings
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass
      } : undefined
    });
  }

  // Format the email content
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">${message.title}</h2>
        <p style="color: #555; line-height: 1.5;">${message.description.replace(/\n/g, '<br>')}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">This is an automated notification from PowerPulse UPS Monitoring System.</p>
      </div>
    </div>
  `;

  try {
    // Send the email
    const info = await transporter.sendMail({
      from: `"PowerPulse UPS Monitor" <${smtpFrom}>`,
      to: recipients,
      subject: message.title,
      text: message.description,
      html: emailContent
    });
    
    // Log the test URL if using Ethereal Email
    if (testAccount) {
      console.log('Email sent (test mode). Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email notification:', error.message);
    throw error;
  }
}

module.exports = {
  sendEmailNotification
};
