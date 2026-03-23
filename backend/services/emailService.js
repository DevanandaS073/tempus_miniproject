const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    return transporter;
}

async function sendForgotPasswordOtpEmail(toEmail, otp) {
    const ttlMinutes = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10);
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@tempus.local';

    const client = getTransporter();

    if (!client) {
        console.log(`[FORGOT_PASSWORD_OTP] ${toEmail} => OTP ${otp} (SMTP not configured)`);
        return { mode: 'console' };
    }

    await client.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: 'Tempus Password Reset OTP',
        text: `Your Tempus password reset OTP is ${otp}. It expires in ${ttlMinutes} minutes.`,
        html: `
            <p>Your Tempus password reset OTP is:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${otp}</p>
            <p>This OTP expires in ${ttlMinutes} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    });

    return { mode: 'smtp' };
}

module.exports = {
    sendForgotPasswordOtpEmail
};
