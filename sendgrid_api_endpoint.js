// api/subscribe.js - Place this file in the 'api' folder
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Add contact to SendGrid contacts
    const contactData = {
      contacts: [
        {
          email: email,
          custom_fields: {
            // Add any custom fields you want to track
            source: 'Punjab Chronicle Landing Page',
            signup_date: new Date().toISOString(),
          }
        }
      ]
    };

    // Add to SendGrid contacts
    const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SendGrid API Error:', errorData);
      throw new Error('Failed to add contact to SendGrid');
    }

    // Optional: Send welcome email
    if (process.env.SEND_WELCOME_EMAIL === 'true') {
      const welcomeMsg = {
        to: email,
        from: process.env.FROM_EMAIL, // Must be verified in SendGrid
        subject: 'Welcome to The Punjab Chronicle!',
        text: `Thank you for subscribing to The Punjab Chronicle! We'll notify you when we launch.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a5568;">Welcome to The Punjab Chronicle!</h2>
            <p>Thank you for subscribing to our newsletter. You'll be among the first to know when we launch our Punjabi news and Web TV platform.</p>
            <p>Stay tuned for updates!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
              <p>The Punjab Chronicle Team</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(welcomeMsg);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed!' 
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to subscribe. Please try again later.' 
    });
  }
}