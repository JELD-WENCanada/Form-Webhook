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

  // Build HTML email content
  Form Submission</h2><table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">';
  for (const [key, value] of Object.entries(formData)) {
    if (key !== 'User Uploaded Files') {
      emailHtml += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`;
    }
  }
  emailHtml += '</table>';

  // Handle file attachments
  const fileUrls = Array.isArray(formData['User Uploaded Files'])
    ? formData['User Uploaded Files']
    : formData['User Uploaded Files']
    Uploaded Files']]
    : [];

  const attachments = fileUrls.map((fileUrl) => ({
    filename: fileUrl.split('/').shift() + '.file', // Optional: customize filename
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
      subject: `New Submission from ${formData['Full Name']} - Project Submission`,
      html: emailHtml,
      attachments: attachments,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

