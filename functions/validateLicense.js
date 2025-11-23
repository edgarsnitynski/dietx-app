const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.validateLicense = functions.https.onRequest(async (req, res) => {
  const { licenseKey, userEmail } = req.body;
  if(!licenseKey && !userEmail) return res.status(400).json({ valid:false });
  try{
    const q = licenseKey ? db.collection('licenses').where('key','==',licenseKey) : db.collection('licenses').where('email','==',userEmail);
    const snap = await q.get();
    if(snap.empty) return res.json({ valid:false });
    const doc = snap.docs[0];
    const data = doc.data();
    return res.json({ valid: data.active === true, license: data });
  }catch(e){ console.error(e); return res.status(500).json({ error:e.message }); }
});
