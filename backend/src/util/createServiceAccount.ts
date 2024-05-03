import { cert } from 'firebase-admin/app';

/**
 * Creates a service account and returns it to the user.
 * Assumes environment variables are initialized.
 */
export default function createServiceAccount() {
    return cert({
        projectId: process.env.GCP_PROJECT_ID,
        privateKey: process.env.GCP_PRIVATE_KEY,
        clientEmail: process.env.GCP_CLIENT_EMAIL,
    });
}