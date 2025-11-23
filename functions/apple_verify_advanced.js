/**
 * functions/apple_verify_advanced.js
 *
 * Advanced Apple verification using:
 * 1) Legacy verifyReceipt endpoint (buy.itunes.apple.com) with shared secret (APPLE_SHARED_SECRET)
 * 2) App Store Server API (StoreKit) using JWT (App Store Connect key) - requires APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_PRIVATE_KEY
 *
 * Environment variables:
 * - APPLE_SHARED_SECRET: the app's shared secret (for subscriptions) - used with verifyReceipt endpoint
 * - APPLE_KEY_ID: the Key ID from App Store Connect (the 10-character key identifier)
 * - APPLE_ISSUER_ID: the Issuer ID (UUID) from App Store Connect
 * - APPLE_PRIVATE_KEY: the private key content (PEM) from the .p8 file (include BEGIN/END lines) OR you can set GOOGLE_APPLICATION_CREDENTIALS-like path
 *
 * Note: Do NOT commit private keys to source control. Use Firebase functions config or Secrets Manager.
 */
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Helper: verify receipt using legacy verifyReceipt endpoint (Apple)
// POST { 'receipt-data': receiptData, 'password': APPLE_SHARED_SECRET }
exports.verifyReceiptLegacy = async (req, res) => {
  try {
    const { receiptData, isSandbox } = req.body;
    if(!receiptData) return res.status(400).json({ error: 'receiptData required' });
    const url = isSandbox ? 'https://sandbox.itunes.apple.com/verifyReceipt' : 'https://buy.itunes.apple.com/verifyReceipt';
    const body = { 'receipt-data': receiptData };
    if(process.env.APPLE_SHARED_SECRET) body.password = process.env.APPLE_SHARED_SECRET;

    const response = await fetch(url, { method:'POST', body: JSON.stringify(body), headers:{ 'Content-Type':'application/json' } });
    const json = await response.json();
    // status 0 means success — see Apple docs
    return res.json({ result: json });
  } catch (err) {
    console.error('verifyReceiptLegacy error', err);
    return res.status(500).json({ error: err.message });
  }
};

// Helper: generate JWT for App Store Server API (StoreKit)
function generateAppStoreToken() {
  const keyId = process.env.APPLE_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY; // PEM format with \n or actual newlines
  if(!keyId || !issuerId || !privateKey) {
    throw new Error('Missing APPLE_KEY_ID, APPLE_ISSUER_ID, or APPLE_PRIVATE_KEY in env');
  }
  // JWT header: alg ES256, kid keyId, typ JWT
  // JWT claims: iss issuerId, exp (current + 20 minutes), iat
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + (60 * 20), // 20 minutes
    // 'aud' not required for App Store JWT
  };
  const token = jwt.sign(payload, privateKey.replace(/\\n/g, '\n'), { algorithm: 'ES256', keyid: keyId });
  return token;
}

// Use App Store Server API to lookup subscriptions by originalTransactionId
// POST body: { originalTransactionId } or { transactionId }
exports.lookupSubscription = async (req, res) => {
  try {
    const { originalTransactionId, transactionId } = req.body;
    if(!originalTransactionId && !transactionId) return res.status(400).json({ error: 'originalTransactionId or transactionId required' });

    const token = generateAppStoreToken();
    const base = 'https://api.storekit.itunes.apple.com';
    let url;
    if(originalTransactionId) {
      url = `${base}/inApps/v1/lookup`;
      // According to StoreKit API, lookup can accept originalTransactionId as query param
      url += `?originalTransactionId=${encodeURIComponent(originalTransactionId)}`;
    } else {
      url = `${base}/inApps/v1/lookup?transactionId=${encodeURIComponent(transactionId)}`;
    }

    const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const json = await response.json();
    // Save to Firestore? optional
    return res.json({ success: true, data: json });
  } catch (err) {
    console.error('lookupSubscription error', err);
    return res.status(500).json({ error: err.message });
  }
};

// Endpoint: get transaction history for a customer (using App Store Server API)
// POST body: { originalTransactionId }
exports.getTransactionHistory = async (req, res) => {
  try {
    const { originalTransactionId } = req.body;
    if(!originalTransactionId) return res.status(400).json({ error: 'originalTransactionId required' });

    const token = generateAppStoreToken();
    const base = 'https://api.storekit.itunes.apple.com';
    const url = `${base}/transactions/v1/history/${encodeURIComponent(originalTransactionId)}`;

    const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const json = await response.json();
    return res.json({ success: true, data: json });
  } catch (err) {
    console.error('getTransactionHistory error', err);
    return res.status(500).json({ error: err.message });
  }
};

// Convenience: verify receipt and mark license active in Firestore
// POST body: { receiptData, userEmail, isSandbox }
exports.verifyReceiptAndSave = async (req, res) => {
  try {
    const { receiptData, userEmail, isSandbox } = req.body;
    if(!receiptData || !userEmail) return res.status(400).json({ error: 'receiptData and userEmail required' });

    const url = isSandbox ? 'https://sandbox.itunes.apple.com/verifyReceipt' : 'https://buy.itunes.apple.com/verifyReceipt';
    const body = { 'receipt-data': receiptData };
    if(process.env.APPLE_SHARED_SECRET) body.password = process.env.APPLE_SHARED_SECRET;

    const response = await fetch(url, { method:'POST', body: JSON.stringify(body), headers:{ 'Content-Type':'application/json' } });
    const json = await response.json();

    // Basic check: status 0 => valid
    const valid = json.status === 0 || (json.status && json.status === 0);
    // Save license with raw receipt and response
    await db.collection('licenses').doc(userEmail).set({
      email: userEmail,
      provider: 'app_store',
      receiptResponse: json,
      active: valid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({ success: true, valid, result: json });
  } catch (err) {
    console.error('verifyReceiptAndSave error', err);
    return res.status(500).json({ error: err.message });
  }
};
