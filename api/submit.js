const formidable = require('formidable');
const nodemailer = require('nodemailer');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    // Build HTML email content
    let emailHtml = '<h2>New Form Submission</h2><table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">';
    for (const [key, value] of Object.entries(fields)) {
      emailHtml += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`;
    }
    emailHtml += '</table>';

    // Build plain text fallback
    let emailText = 'New Form Submission\n\n';
    for (const [key, value] of Object.entries(fields)) {
      emailText += `${key}: ${value}\n`;
    }

    // Handle file attachments
    const attachments = Object.values(files).map((file, index) => {
      const ext = path.extname(file.name).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
      };

      return {
        filename: file.name || `attachment-${index + 1}`,
        path: file.path,
        contentType: mimeTypes[ext] || 'application/octet-stream',
        cid: `image-${index + 1}` // Set CID for inline embedding
      };
    });

    // Embed images inline in the HTML content
    attachments.forEach((attachment, index) => {
      if (['image/jpeg', 'image/png', 'image/gif'].includes(attachment.contentType)) {
        emailHtml += `<br><img src="cid:image-${index + 1}" alt="Image ${index + 1}">`;
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: 'New Customer Submission - Portfolio Project',
        html: emailHtml,
        text: emailText,
        attachments: attachments,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });
};
