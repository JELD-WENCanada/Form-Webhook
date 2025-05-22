from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

# SMTP Configuration (replace with your actual values or use environment variables)
SMTP_SERVER = 'smtp.example.com'
SMTP_PORT = 587
SMTP_USERNAME = 'your_email@example.com'
SMTP_PASSWORD = 'your_password'
EMAIL_FROM = 'your_email@example.com'
EMAIL_TO = 'recipient_email@example.com'
EMAIL_SUBJECT = 'New Form Submission'

@app.route('/submit', methods=['POST'])
def handle_form_submission():
    try:
        # Get form data from request
        form_data = request.json
        
        # Log the form data
        logging.info(f"Received form data: {form_data}")
        
        # Create email content
        email_content = ""
        for key, value in form_data.items():
            email_content += f"{key}: {value}\n"
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = EMAIL_TO
        msg['Subject'] = EMAIL_SUBJECT
        msg.attach(MIMEText(email_content, 'plain'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
        server.quit()
        
        return jsonify({"message": "Form submission received and email sent successfully."}), 200
    except Exception as e:
        logging.error(f"Error handling form submission: {e}")
        return jsonify({"error": "An error occurred while processing the form submission."}), 500

# Required for Vercel to recognize the app
handler = app
