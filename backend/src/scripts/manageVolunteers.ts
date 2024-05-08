import dotenv from 'dotenv';
import { initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import createServiceAccount from '../util/createServiceAccount';
dotenv.config();

async function changeVolunteerStatus(volunteerEmail: string, isVolunteer: boolean) {
  try {
    // Initialize Firebase Admin SDK
    initializeApp({
      credential: createServiceAccount(),
    });
    const auth = getAuth();

    // Get the user object from Firebase Admin
    const user = await auth.getUserByEmail(volunteerEmail);
    
    // Get the existing custom claims
    const { customClaims } = user;
    
    // Merge the existing claims with the new volunteer claim
    const updatedClaims = { ...customClaims, volunteer: isVolunteer };
    
    // Set the updated claims for the user
    await auth.setCustomUserClaims(user.uid, updatedClaims);

    return `Volunteer access added successfully for ${volunteerEmail}`;
  } catch (error) {
    throw new Error('Failed to add admin: ' + error);
  }
}

const main = async () => {
  const [operation, volunteerEmail] = process.argv.slice(2); // Capture command-line arguments

  if (!operation || !volunteerEmail) {
    console.log('Usage: ts-node manageVolunteers.ts <add|remove> <admin-email>');
    process.exit(1);
  }

  try {
    if (operation === 'add') {
      const result = await changeVolunteerStatus(volunteerEmail, true);
      console.log(result);
    } else if (operation === 'remove') {
      const result = await changeVolunteerStatus(volunteerEmail, false);
      console.log(result);
    } else {
      console.log('Invalid operation. Use "add" or "remove".');
    }
  } catch (error) {
    console.error('Error managing volunteer status:', error);
    process.exit(1);
  }
};

main();


