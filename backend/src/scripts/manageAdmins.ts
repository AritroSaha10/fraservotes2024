import dotenv from 'dotenv';
import { initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import createServiceAccount from '../util/createServiceAccount';
dotenv.config();

async function changeAdminStatus(adminEmail: string, isAdmin: boolean) {
  try {
    // Initialize Firebase Admin SDK
    initializeApp({
      credential: createServiceAccount(),
    });
    const auth = getAuth();

    // Get the user object from Firebase Admin
    const user = await auth.getUserByEmail(adminEmail);
    
    // Get the existing custom claims
    const { customClaims } = user;
    
    // Merge the existing claims with the new admin claim
    const updatedClaims = { ...customClaims, admin: isAdmin };
    
    // Set the updated claims for the user
    await auth.setCustomUserClaims(user.uid, updatedClaims);

    return `Admin added successfully for ${adminEmail}`;
  } catch (error) {
    throw new Error('Failed to add admin: ' + error);
  }
}

const main = async () => {
  const [operation, adminEmail] = process.argv.slice(2); // Capture command-line arguments

  if (!operation || !adminEmail) {
    console.log('Usage: tsx manageAdmins.ts <add|remove> <admin-email>');
    process.exit(1);
  }

  try {
    if (operation === 'add') {
      const result = await changeAdminStatus(adminEmail, true);
      console.log(result);
    } else if (operation === 'remove') {
      const result = await changeAdminStatus(adminEmail, false);
      console.log(result);
    } else {
      console.log('Invalid operation. Use "add" or "remove".');
    }
  } catch (error) {
    console.error('Error managing admin:', error);
    process.exit(1);
  }
};

main();


