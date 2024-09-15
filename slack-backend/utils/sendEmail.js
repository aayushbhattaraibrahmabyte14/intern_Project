const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const sendEmail = async (email, subject, text) => {
// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
user: process.env.GMAIL_USER, // Your Gmail address
pass: process.env.GMAIL_PASS, // Your Gmail app password or regular password
},
});

// Define email options
const mailOptions = {
from: process.env.GMAIL_USER, // Sender address
to: email, // List of recipients
subject: subject, // Subject line
text: text, // Plain text body
};

console.log('Attempting to send email with the following details:');
console.log('From:', mailOptions.from);
console.log('To:', mailOptions.to);
console.log('Subject:', mailOptions.subject);
console.log('Text:', mailOptions.text);

try {
// Send the email
await transporter.sendMail(mailOptions);
console.log(`Email sent successfully to ${email}`);
} catch (error) {
// Log and handle the error
console.error(`Failed to send email to ${email}:`, error);
throw new Error('Failed to send email'); // Optionally throw an error to handle it further up the stack
}
};

module.exports = sendEmail;
