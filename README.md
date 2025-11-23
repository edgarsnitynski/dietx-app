# DietX - Starter (Expo + Firebase)
This is a starter project for **DietX**, a cross-platform app for nutritionists.

## What's included
- Expo React Native app (JS) with screens: Login, Home, Patients, PatientDetail
- Additional screens: Appointments, Plans, Anthropometry, Photos, Protocols, Patient Portal
- Firebase integration skeleton (Auth, Firestore, Storage)
- Firebase Cloud Functions skeleton for Stripe-based licensing and license validation
- Firestore security rules template
- Publishing notes and store listing texts
- Placeholder assets (icons)

## Quick start
1. Install dependencies:
   ```
   npm install
   npx expo install
   ```
2. Replace `firebaseConfig.js` with your Firebase config.
3. Start development:
   ```
   npx expo start
   ```
4. For functions:
   - Install firebase-tools and deploy: `firebase deploy --only functions`
   - Set environment variables for Stripe keys: via Firebase CLI `firebase functions:config:set stripe.secret="..." stripe.webhook_secret="..."`
   - Deploy.

## Git and publishing
Initialize git and push to your repo:
```
git init
git add .
git commit -m "Initial DietX starter"
```
Use GitHub CLI or create repo manually.

## Notes
- This starter contains placeholder code and should be tested and hardened before production.
- Follow LGPD (Brazil) and privacy best practices for patient data.


## Added by request (TypeScript, IAP endpoints, scripts, mockups)

- TypeScript setup (`tsconfig.json`) and `App.tsx` added.
- Cloud Functions `functions/index_full.js` includes endpoints for Stripe, Apple receipt verification (basic), Google placeholder, admin licenses and license validation.
- Scripts: `push_to_github.sh`, `deploy_functions.sh`.
- Promotional screenshots created in `/promotional_screenshots`.

See the files and follow the README steps to configure environment variables (Stripe keys, Apple shared secret, Google service account) before deploying.


## Google Play verification setup (server-side)

To enable server-side verification of Google Play purchases (required for validating in-app purchases/subscriptions):

1. In Google Play Console -> Settings -> API access, link a Google Cloud project and create a Service Account.
2. In Google Cloud Console, create a Service Account and grant it access to the Google Play Console (see Play Console API access docs).
3. Download the JSON key for the service account (do **not** commit it to source control).
4. Provide credentials to your Cloud Functions:
   - Option A: Set environment variable `GOOGLE_SERVICE_ACCOUNT_JSON` with the full JSON content (use firebase functions:config:set or your deployment secret manager).
     Example (locally):
       export GOOGLE_SERVICE_ACCOUNT_JSON="$(cat /path/to/key.json)"
   - Option B: Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON key file (less recommended for Cloud Functions).
5. Deploy functions and call the endpoint `/verifySubscription`:
   - POST to `https://<region>-<project>.cloudfunctions.net/api/verifySubscription`
   - Body: { "packageName":"com.yourcompany.dietx", "subscriptionId":"your.subscription.id", "token":"purchaseToken" }
6. For purchases (one-time products) call `/verifyProduct` with { packageName, productId, token }.
7. To verify and automatically save license data, call `/verifyAndSaveLicense` with { packageName, subscriptionId, token, userEmail }.

Notes:
- The endpoint `functions/google_verify.js` uses googleapis and supports two credential modes (env JSON or ADC).
- Testing: use Google Play Developer API test purchases and real purchase tokens from test accounts.



## App Store (Apple) advanced verification setup

This project includes `functions/apple_verify_advanced.js` with endpoints:

- `/verifyReceiptLegacy` — verify receipt via legacy verifyReceipt endpoint (buy.itunes.apple.com). Requires `APPLE_SHARED_SECRET` env var (App-specific shared secret).
- `/verifyReceiptAndSave` — same as above, but saves license in Firestore under `licenses/<userEmail>`.
- `/lookupSubscription` — uses App Store Server API (StoreKit) and requires App Store Connect API key (KEY ID, ISSUER ID, and private key `.p8` contents).
- `/getTransactionHistory` — retrieve transaction history for an `originalTransactionId`.

### How to create App Store Connect API Key (to use JWT)
1. Login to App Store Connect -> Users and Access -> Keys -> Create API Key.
2. Save the following:
   - Key ID (e.g. ABCDE12345)
   - Issuer ID (UUID)
   - Download `.p8` private key file (do **not** commit this file).
3. In your deployment environment, set the following env variables securely:
   - `APPLE_KEY_ID` = Key ID
   - `APPLE_ISSUER_ID` = Issuer ID
   - `APPLE_PRIVATE_KEY` = contents of the `.p8` file (include BEGIN/END lines; newlines must be preserved or represented as \n)
4. Deploy functions. The endpoints will use the JWT to call the App Store Server API (`api.storekit.itunes.apple.com`).

### Example: call lookupSubscription
POST to `https://<region>-<project>.cloudfunctions.net/api/lookupSubscription`
Body:
```
{
  "originalTransactionId": "1000000654321098"
}
```

Notes:
- The Server API returns structured data about subscription status; inspect `data` fields and handle expirations/cancellations.
- You should secure admin endpoints and restrict them to authorized admin accounts.




## Sample curl commands (Apple & Google endpoints)

### Google Play - verifySubscription
```
curl -X POST "https://<region>-<project>.cloudfunctions.net/api/verifySubscription"   -H "Content-Type: application/json"   -d '{
    "packageName":"com.yourcompany.dietx",
    "subscriptionId":"dietx_annual",
    "token":"<purchaseTokenFromClient>"
  }'
```

### Google Play - verifyAndSaveLicense
```
curl -X POST "https://<region>-<project>.cloudfunctions.net/api/verifyAndSaveLicense"   -H "Content-Type: application/json"   -d '{
    "packageName":"com.yourcompany.dietx",
    "subscriptionId":"dietx_annual",
    "token":"<purchaseToken>",
    "userEmail":"cliente@exemplo.com"
  }'
```

### Apple - verifyReceiptLegacy
```
curl -X POST "https://<region>-<project>.cloudfunctions.net/api/verifyReceiptLegacy"   -H "Content-Type: application/json"   -d '{
    "receiptData":"<base64_receipt_data>",
    "isSandbox": true
  }'
```

### Apple - verifyReceiptAndSave
```
curl -X POST "https://<region>-<project>.cloudfunctions.net/api/verifyReceiptAndSave"   -H "Content-Type: application/json"   -d '{
    "receiptData":"<base64_receipt_data>",
    "userEmail":"cliente@exemplo.com",
    "isSandbox": true
  }'
```

### Apple - lookupSubscription (App Store Server API)
```
curl -X POST "https://<region>-<project>.cloudfunctions.net/api/lookupSubscription"   -H "Content-Type: application/json"   -d '{
    "originalTransactionId":"1000000654321098"
  }'
```

Note: Replace `<region>`, `<project>`, tokens and IDs with your actual values.




## Deployment instructions (exact CLI commands)

### 1) Install prerequisites locally
- Node 16+ (or the version supported by Firebase functions runtime)
- Firebase CLI (`npm install -g firebase-tools`)
- (Optional) GitHub CLI `gh` for repo creation

### 2) Authenticate Firebase CLI
```
firebase login
firebase projects:list
# set your project (replace <PROJECT_ID> with your project)
firebase use <PROJECT_ID>
```

### 3) Set environment variables / secrets for functions
**Google Service Account (option A - recommended):**
```
# do NOT commit key.json to git
export GOOGLE_SERVICE_ACCOUNT_JSON="$(cat /path/to/google-service-account.json)"
firebase functions:config:set google.service_account_json="$GOOGLE_SERVICE_ACCOUNT_JSON"
```

**Apple private key (.p8) and secrets:**
```
export APPLE_PRIVATE_KEY="$(awk 'BEGIN{ORS="\\n"} {print}' /path/to/AuthKey_ABC12345.p8)"
firebase functions:config:set apple.private_key="$APPLE_PRIVATE_KEY" apple.key_id="ABC12345" apple.issuer_id="YOUR_ISSUER_ID"
# set shared secret (optional, for legacy receipt verification)
firebase functions:config:set apple.shared_secret="YOUR_APPLE_SHARED_SECRET"
```

**Stripe keys:**
```
firebase functions:config:set stripe.secret="sk_live_xxx" stripe.webhook_secret="whsec_xxx"
```

**Alternatively**, use `gcloud secrets` or your CI/CD secrets manager. After setting config, deploy functions:

### 4) Deploy functions
```
pushd functions
npm install
# copy service account to proper env or ensure GOOGLE_SERVICE_ACCOUNT_JSON is available in environment
firebase deploy --only functions
popd
```

### 5) (Optional) Deploy Firestore rules and indexes
```
firebase deploy --only firestore:rules
# to deploy indexes:
firebase deploy --only firestore:indexes
```

### 6) Verify scheduled function is enabled
The scheduled function `licenseMaintenance` uses Cloud Scheduler. Ensure billing is enabled for your Firebase project (required for scheduled functions).

### 7) Test endpoints via curl (see samples above)
```
curl ... (use the sample curl commands)
```

Notes:
- Use `firebase functions:config:get` to verify stored config.
- To unset a config: `firebase functions:config:unset apple.shared_secret` etc.
