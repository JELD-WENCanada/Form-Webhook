import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)

# SMTP Configuration (using environment variables)
SMTP_SERVER = os.environ.get('SMTP_SERVER')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
EMAIL_FROM = os.environ.get('EMAIL_FROM')
EMAIL_TO = os.environ.get('EMAIL_TO')
EMAIL_SUBJECT = 'New Form Submission'

def handler(event, context):
    try:
        # Get form data from request
        form_data = json.loads(event['body'])
        
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
        
        return {
            'statusCode': 200,
            'body': json.dumps({"message": "Form submission received and email sent successfully."})
        }
    except Exception as e:
        logging.error(f"Error handling form submission: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({"error": "An error occurred while processing the form submission."})
        }
