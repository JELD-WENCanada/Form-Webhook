const nodemailer = require('nodemailer');
const path = require('path');
const formidable = require('formidable');
const { Writable } = require('stream');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({
    multiples: true,
    fileWriteStreamHandler: (file) => {
      const chunks = [];
      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
        final(callback) {
          file.buffer = Buffer.concat(chunks);
          callback();
        }
      });
      return writable;
    }
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    // Friendly field labels
    const fieldLabels = {
      fullName: 'Full Name',
      date: 'Date',
      phone: 'Phone',
      email: 'Email',
      projectDetails: 'Project Details',
      consent: 'Consent to Share',
      accuracy: 'Accuracy Confirmation'
    };

    // HTML email
    let emailHtml = `
      <h2>New Form Submission</h2>
      <p>A customer has submitted their information and images for a portfolio project. Please take a moment to review the submission below.</p>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">
    `;

    for (const key of Object.keys(fieldLabels)) {
      const label = fieldLabels[key];
      const value = fields[key];
      let displayValue = value;

      if (key === 'consent' || key === 'accuracy') {
        displayValue = value ? '✅ Yes' : '❌ No';
      }

      emailHtml += `<tr><td><strong>${label}</strong></td><td>${displayValue || ''}</td></tr>`;
    }
    emailHtml += '</table>';

    // Plain text email
    let emailText = `New Form Submission\n\nA customer has submitted their information and images for a portfolio project. Please review the submission below:\n\n`;

    for (const key of Object.keys(fieldLabels)) {
      const label = fieldLabels[key];
      const value = fields[key];
      let displayValue = value;

      if (key === 'consent' || key === 'accuracy') {
        displayValue = value ? 'Yes' : 'No';
      }

      emailText += `${label}: ${displayValue || ''}\n`;
    }

    // Attachments
    const attachments = [];
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };

    for (const [key, fileOrFiles] of Object.entries(files)) {
      const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

      for (const file of fileArray) {
        if (!file || !file.originalFilename || !file.buffer) {
          console.warn(`Skipping invalid file input for key: ${key}`);
          continue;
        }

        const ext = path.extname(file.originalFilename).toLowerCase();

        attachments.push({
          filename: file.originalFilename,
          content: file.buffer,
          contentType: file.mimetype || mimeTypes[ext] || 'application/octet-stream',
          cid: `image-${attachments.length + 1}`,
        });

        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
          emailHtml += `<br><img src="cid:image-${attachments.length}" alt="Image ${attachments.length}">`;
        }
      }
    }

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
