const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try{
    const { priceId, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: process.env.SUCCESS_URL || 'https://your-site.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://your-site.com/cancel'
    });
    res.json({ id: session.id, url: session.url });
  }catch(e){ console.error(e); res.status(500).send({ error: e.message }); }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { console.error('Webhook error', err.message); return res.status(400).send(`Webhook Error: ${err.message}`); }

  if(event.type === 'checkout.session.completed'){
    const session = event.data.object;
    db.collection('licenses').doc(session.customer_email).set({
      email: session.customer_email,
      stripeSession: session.id,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.json({ received: true });
});

exports.api = functions.https.onRequest(app);
