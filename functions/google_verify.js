/**
 * functions/google_verify.js
 *
 * Server-side verification for Google Play purchases/subscriptions.
 * This code uses googleapis (androidpublisher) and expects a service account JSON.
 *
 * How to provide credentials:
 * - Option A (recommended): Set the environment variable GOOGLE_SERVICE_ACCOUNT_JSON to the JSON contents.
 * - Option B: Upload the service account JSON file to the functions directory and set GOOGLE_APPLICATION_CREDENTIALS to its path.
 *
 * Steps to enable API & service account:
 * 1. In Google Play Console -> Settings -> API access, create or link a Google Cloud project.
 * 2. In Google Cloud Console, create a Service Account and grant it the role "Service Account User" and "Editor" or appropriate role.
 * 3. In Play Console -> API access, grant the service account permission to access your Play Console.
 * 4. Download the JSON key file.
 *
 * Note: Do not commit the service account JSON to source control.
 */
const { google } = require('googleapis');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const androidpublisher = google.androidpublisher('v3');

// Helper to load credentials
function loadCredentials() {
  // Option A: JSON string in env var
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON', e);
      return null;
    }
  }
  // Option B: fallback to ADC (GOOGLE_APPLICATION_CREDENTIALS) - googleapis will use ADC automatically
  return null;
}

// Verify Android subscription purchase
// POST body: { packageName, subscriptionId, token }
exports.verifySubscription = async (req, res) => {
  try {
    const { packageName, subscriptionId, token } = req.body;
    if (!packageName || !subscriptionId || !token) return res.status(400).json({ error: 'missing fields' });

    const creds = loadCredentials();
    let authClient;
    if (creds) {
      const jwt = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://www.googleapis.com/auth/androidpublisher'],
        null
      );
      await jwt.authorize();
      authClient = jwt;
    } else {
      // Use Application Default Credentials if available
      authClient = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
    }

    const result = await androidpublisher.purchases.subscriptions.get({
      auth: authClient,
      packageName,
      subscriptionId,
      token,
    });

    // result.data contains details like expiryTimeMillis, autoRenewing, purchaseState etc.
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('verifySubscription error', err);
    return res.status(500).json({ error: err.message });
  }
};

// Verify Android in-app product (one-time purchase)
// POST body: { packageName, productId, token }
exports.verifyProduct = async (req, res) => {
  try {
    const { packageName, productId, token } = req.body;
    if (!packageName || !productId || !token) return res.status(400).json({ error: 'missing fields' });

    const creds = loadCredentials();
    let authClient;
    if (creds) {
      const jwt = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://www.googleapis.com/auth/androidpublisher'],
        null
      );
      await jwt.authorize();
      authClient = jwt;
    } else {
      authClient = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
    }

    const result = await androidpublisher.purchases.products.get({
      auth: authClient,
      packageName,
      productId,
      token,
    });

    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('verifyProduct error', err);
    return res.status(500).json({ error: err.message });
  }
};

// Helper endpoint to validate license and mark in Firestore
// POST body: { packageName, subscriptionId, token, userEmail }
exports.verifyAndSaveLicense = async (req, res) => {
  try {
    const { packageName, subscriptionId, token, userEmail } = req.body;
    if (!packageName || !subscriptionId || !token || !userEmail) return res.status(400).json({ error: 'missing fields' });

    // Call verifySubscription
    const fakeReq = { body: { packageName, subscriptionId, token } };
    const fakeRes = { json: (r)=>r, status: (s)=>({ json: (r)=>r }) }; // not used here
    // Reuse logic: create auth client and call API
    const creds = loadCredentials();
    let authClient;
    if (creds) {
      const jwt = new google.auth.JWT(
        creds.client_email,
        null,
        creds.private_key,
        ['https://www.googleapis.com/auth/androidpublisher'],
        null
      );
      await jwt.authorize();
      authClient = jwt;
    } else {
      authClient = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
    }

    const result = await androidpublisher.purchases.subscriptions.get({
      auth: authClient,
      packageName,
      subscriptionId,
      token,
    });

    const data = result.data;
    // Basic validation: check expiryTimeMillis and whether it's purchased
    const expiry = parseInt(data.expiryTimeMillis || '0', 10);
    const now = Date.now();
    const active = expiry > now;

    // Save license entry in Firestore
    await db.collection('licenses').doc(userEmail).set({
      email: userEmail,
      provider: 'google_play',
      subscriptionId,
      token,
      expiryMillis: expiry,
      active,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({ success: true, active, data });
  } catch (err) {
    console.error('verifyAndSaveLicense error', err);
    return res.status(500).json({ error: err.message });
  }
};
