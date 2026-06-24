const { BrevoClient } = require('@getbrevo/brevo');

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

async function sendEmail(user, params, templateId) {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            templateId: templateId,
            params,
            sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: user.email, name: user.name }],
        });
        console.log('Email sent. Message ID:', result.messageId);
        return result;
    } catch (error) {
        console.error('Error sending email via Brevo:', error);
        throw error;
    }
}

async function sendVerificationEmail(user, otp) {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            subject: "Verify Your Email - Rayna Store",
            htmlContent: `
                <html>
                    <body>
                        <h1>Welcome to Rayna Store, ${user.name}!</h1>
                        <p>Your verification code is:</p>
                        <h2 style="font-size: 32px; letter-spacing: 5px; color: #7c3aed;">${otp}</h2>
                        <p>This code will expire in 5 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </body>
                </html>
            `,
            sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: user.email, name: user.name }],
        });
        return result;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

async function sendPasswordResetEmail(user, otp) {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            subject: "Password Reset Request - Rayna Store",
            htmlContent: `
                <html>
                    <body>
                        <h1>Password Reset</h1>
                        <p>Your password reset code is:</p>
                        <h2 style="font-size: 32px; letter-spacing: 5px; color: #7c3aed;">${otp}</h2>
                        <p>This code will expire in 5 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </body>
                </html>
            `,
            sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: user.email, name: user.name }],
        });
        return result;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };