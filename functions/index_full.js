const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // for server-to-server calls
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Create Stripe checkout session
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

// Webhook for Stripe events (licenses)
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
    }, { merge: true });
  }

  res.json({ received: true });
});

// Admin: list licenses (secure this in production)
app.get('/admin/licenses', async (req, res) => {
  try{
    const snap = await db.collection('licenses').limit(100).get();
    const list = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    res.json({ licenses: list });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Receipt verification - Apple (server-side)
// Requires APPLE_SHARED_SECRET (for subscriptions) and optionally App Store Connect credentials for server-to-server validation
app.post('/verify-apple', async (req, res) => {
  try{
    const { receiptData, isSandbox } = req.body;
    if(!receiptData) return res.status(400).json({ error: 'receiptData required' });

    const url = isSandbox ? 'https://sandbox.itunes.apple.com/verifyReceipt' : 'https://buy.itunes.apple.com/verifyReceipt';
    const body = { 'receipt-data': receiptData, 'password': process.env.APPLE_SHARED_SECRET };

    const response = await fetch(url, { method:'POST', body: JSON.stringify(body), headers:{ 'Content-Type':'application/json' } });
    const json = await response.json();
    // Forward raw response; implement logic to check status and expiration
    res.json({ result: json });
  }catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
});

// Receipt verification - Google Play (server-to-server)
// This requires Google service account credentials and access to Google Play Developer API.
app.post('/verify-google', async (req, res) => {
  try{
    const { packageName, productId, token } = req.body;
    if(!packageName || !productId || !token) return res.status(400).json({ error: 'missing fields' });

    // Placeholder: You must implement OAuth2 server-to-server call to Google Play Developer API.
    // See README for steps to enable Google Play Android Publisher API and use googleapis client.
    res.json({ message: 'This endpoint is a placeholder. Implement server-to-server OAuth2 call to Play Developer API.' });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// License validation by email or key
app.post('/validate-license', async (req, res) => {
  try{
    const { licenseKey, userEmail } = req.body;
    if(!licenseKey && !userEmail) return res.status(400).json({ valid:false });

    let q;
    if(licenseKey) q = db.collection('licenses').where('key','==',licenseKey).limit(1);
    else q = db.collection('licenses').where('email','==',userEmail).limit(1);
    const snap = await q.get();
    if(snap.empty) return res.json({ valid:false });
    const doc = snap.docs[0];
    const data = doc.data();
    res.json({ valid: data.active === true, license: data });
  }catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
});

exports.api = functions.https.onRequest(app);
