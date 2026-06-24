const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@rayna.com';
    const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Rayna Store';

    console.log(`Attempting to send email to: ${JSON.stringify(to)} with subject: ${subject}`);
    const data = {
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: Array.isArray(to) ? to : [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Email sent successfully: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    console.error('Email sending error details:', error.response ? JSON.stringify(error.response.data) : error.message);
    throw new Error('Failed to send email');
  }
};

const sendOrderNotification = async (order, isAdmin = false) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rayna.com';
  const recipient = isAdmin ? adminEmail : order.customerEmail;
  const subject = isAdmin ? `New Order Received: #${order.orderNumber}` : `Your Order Confirmation: #${order.orderNumber}`;
  
  const itemsHtml = order.items.map(item => `
    <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 8px;">
      <img src="http://localhost:5000${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
      <div>
        <p style="margin: 0; font-weight: bold;">${item.name}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Qty: ${item.quantity} | Price: ₦${item.price.toLocaleString()}</p>
      </div>
    </div>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #207A6C;">${isAdmin ? 'New Order Alert!' : 'Successful Checkout!'}</h2>
      <p>${isAdmin ? 'A new order has been placed.' : `Hi ${order.customerName}, your order has been successfully placed.`}</p>
      
      <div style="background: #207A6C; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;">Tracking ID: <strong>${order.trackingNumber}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Order Number: <strong>#${order.orderNumber}</strong></p>
      </div>

      <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details</h3>
      ${itemsHtml}
      
      <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
        Total: ₦${order.totalAmount.toLocaleString()}
      </div>

      <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px;"><strong>Shipping Address:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
          ${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state}
        </p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; text-align: center;">
        Rayna Store &copy; 2024. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({ to: recipient, subject, htmlContent });
};

module.exports = {
  sendOrderNotification,
};
