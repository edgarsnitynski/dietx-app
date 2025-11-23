
# Cloud Setup & Billing Notes

Before deploying scheduled functions (Cloud Scheduler) and production workloads, ensure:

1. **Enable billing** on your Firebase/GCP project
   - Cloud Scheduler requires a billing-enabled project.
   - Go to Google Cloud Console -> Billing and attach a billing account.

2. **Enable required APIs**
   - Cloud Scheduler API
   - Cloud Tasks API (used by Scheduler)
   - Cloud Pub/Sub API (scheduled functions use Pub/Sub)
   - Google Play Android Publisher API (for Play verification)
   - App Store Connect API (not an API to enable, but you need keys from App Store Connect)
   - Firebase Management API (optional)

3. **Service Account Permissions**
   - Ensure the service account used for the Play Developer API has access to the Play Console (API access -> Grant access).
   - For Cloud Functions deployment, the Firebase service account must have Cloud Functions Admin and Service Account User roles.

4. **Secrets management**
   - Use `firebase functions:config:set` for quick setup.
   - For better security use Secret Manager or CI/CD secrets (recommended).
   - Do NOT commit `.p8` or service account JSON files to source control.

5. **Testing in sandbox**
   - Use App Store sandbox for iOS test purchases.
   - Use Google Play License Testing (in Play Console) to add test accounts.

6. **Monitoring**
   - After deployment, monitor functions in Firebase Console -> Functions (logs) and Cloud Scheduler (jobs).
   - Set alerts for failed verifications or webhook errors.

