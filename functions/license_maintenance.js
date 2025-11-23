
/**
 * functions/license_maintenance.js
 *
 * Scheduled function to validate stored licenses periodically and mark expired.
 * - For Google Play licenses: uses expiryMillis field saved during verification.
 * - For Apple: uses saved receipt response or can call App Store Server API lookup for each license.
 *
 * NOTE: This function will perform best-effort checks and should be tuned to your usage.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { google } = require('googleapis');
admin.initializeApp();
const db = admin.firestore();

// You can configure schedule in cron expression (default: every day at 02:00 UTC)
exports.licenseMaintenance = functions.pubsub.schedule('0 2 * * *').timeZone('UTC').onRun(async (context) => {
  console.log('Running license maintenance job...');
  const now = Date.now();
  const expired = [];
  const updated = [];

  const snap = await db.collection('licenses').get();
  for(const doc of snap.docs){
    const data = doc.data();
    let active = data.active === true;
    // 1) If we have expiryMillis, check it
    if(data.expiryMillis){
      if(parseInt(data.expiryMillis,10) <= now){
        active = false;
        await doc.ref.update({ active, checkedAt: admin.firestore.FieldValue.serverTimestamp() });
        expired.push(doc.id);
        continue;
      } else {
        // still active
        updated.push(doc.id);
        continue;
      }
    }
    // 2) If provider is google_play and we have token, try to re-verify via Play API
    if(data.provider === 'google_play' && data.subscriptionId && data.token && process.env.GOOGLE_SERVICE_ACCOUNT_JSON){
      try{
        const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const jwt = new google.auth.JWT(
          creds.client_email, null, creds.private_key,
          ['https://www.googleapis.com/auth/androidpublisher'], null
        );
        await jwt.authorize();
        const androidpublisher = google.androidpublisher('v3');
        const res = await androidpublisher.purchases.subscriptions.get({
          auth: jwt,
          packageName: data.packageName,
          subscriptionId: data.subscriptionId,
          token: data.token
        });
        const expiry = parseInt(res.data.expiryTimeMillis || '0',10);
        const isActive = expiry > now;
        await doc.ref.update({ expiryMillis: expiry, active: isActive, checkedAt: admin.firestore.FieldValue.serverTimestamp() });
        if(!isActive) expired.push(doc.id); else updated.push(doc.id);
        continue;
      }catch(e){
        console.warn('Google verify failed for', doc.id, e.message);
      }
    }
    // 3) If provider is app_store and we have a saved receiptResponse (legacy), we can inspect expiration dates
    if(data.provider === 'app_store' && data.receiptResponse){
      try{
        // receiptResponse.latest_receipt_info may contain expiration_date_ms
        const info = data.receiptResponse.latest_receipt_info || data.receiptResponse.latest_receipt || [];
        let expMillis = 0;
        if(Array.isArray(info) && info.length){
          // take latest
          const latest = info[0];
          if(latest.expires_date_ms) expMillis = parseInt(latest.expires_date_ms,10);
        } else if(info.expires_date_ms){
          expMillis = parseInt(info.expires_date_ms,10);
        }
        if(expMillis && expMillis <= now){
          await doc.ref.update({ active: false, expiryMillis: expMillis, checkedAt: admin.firestore.FieldValue.serverTimestamp() });
          expired.push(doc.id);
        } else {
          updated.push(doc.id);
        }
        continue;
      }catch(e){
        console.warn('Apple inspect failed for', doc.id, e.message);
      }
    }
    // 4) No reliable info -> mark for manual review after N days of age
    if(!data.updatedAt) continue;
  }

  console.log('License maintenance completed. expired:', expired.length, 'updated:', updated.length);
  return { expiredCount: expired.length, updatedCount: updated.length };
});
