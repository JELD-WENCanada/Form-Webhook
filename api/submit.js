const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const formData = req.body;

  // Build plain text email content
  let emailContent = '';
  for (const [key, value] of Object.entries(formData)) {
    if (key !== 'files') {
      emailContent += `${key}: ${value}\n`;
    }
  }

  URLs
  const fileUrls = Array.isArray(formData.files)
    ? formData.files
    : formData.files
    ? [formData.files]
    : [];

  const attachments = fileUrls.map((fileUrl) => ({
    filename: fileUrl.split('/').pop(),
    path: fileUrl,
  }));

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
      subject: `New Customer Submission - Portfolio Project`,
      text: emailContent,
      attachments: attachments,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

