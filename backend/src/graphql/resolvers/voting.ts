import { GraphQLError } from "graphql";
import { MyContext } from "../..";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "../../util/validateTokenForSensitiveRoutes.js";
import { validateIfAdmin } from "../../util/checkIfAdmin.js";
import { SelectedOption } from "../../models/decryptedBallot";

const getEncryptedBallots = async (_, __, contextValue: MyContext) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  return contextValue.dataSources.encryptedBallots.getAll();
};

const getEncryptedBallotCount = async (_, __, contextValue: MyContext) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  return contextValue.dataSources.encryptedBallots.getCount();
};

const getDecryptedBallots = async (_, __, contextValue: MyContext) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  return contextValue.dataSources.decryptedBallots.getAll();
};

const getDecryptedBallotCount = async (_, __, contextValue: MyContext) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  return contextValue.dataSources.decryptedBallots.getCount();
};

const submitBallot = async (
  _,
  args: {
    studentNumber: Number;
    encryptedBallot: string;
  },
  contextValue: MyContext
) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);

  // TODO: Change this to use provided student number, saving it and making sure only one vote made
  /*
      // Check whether the user has already voted or not
      const uid = contextValue.authTokenDecoded.uid;
      const { customClaims } = await auth.getUser(uid);
      if ("voted" in customClaims && customClaims.voted === true) {
          throw new GraphQLError('You have already voted', {
              extensions: {
                  code: 'FORBIDDEN',
                  http: { status: 403 },
              },
          });
      }
      */

  // Submit ballot
  await contextValue.dataSources.encryptedBallots.submitBallot(
    args.encryptedBallot
  );

  /*
      // Update claims
      contextValue.dataSources.users.updateClaimsForUser(uid, { voted: true });
      */

  return null;
};

const addDecryptedBallot = async (
  _,
  args: {
    timestampUTC: Number;
    selectedChoices: SelectedOption[];
  },
  contextValue: MyContext
) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  // TODO: Check if voting is closed
  
  // Add ballot
  await contextValue.dataSources.decryptedBallots.addDecryptedBallot(args.timestampUTC, args.selectedChoices);

  return null;
};

const deleteBallots = async (_, __, contextValue: MyContext) => {
  // Sensitive action, need to verify whether they are authorized
  const auth = getAuth();
  await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
  validateIfAdmin(contextValue.authTokenDecoded);

  // Double-check if user is actually admin, since this is quite destructive
  const uid = contextValue.authTokenDecoded.uid;
  const { customClaims } = await auth.getUser(uid);
  if (!("admin" in customClaims && customClaims.admin === true)) {
    throw new GraphQLError("Not sufficient permissions", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }

  // Delete ballots
  await Promise.all([
    contextValue.dataSources.encryptedBallots.deleteAll(),
    contextValue.dataSources.decryptedBallots.deleteAll(),
  ]);

  return null;
};

export {
  getEncryptedBallots,
  getDecryptedBallots,
  getEncryptedBallotCount,
  getDecryptedBallotCount,
  submitBallot,
  addDecryptedBallot,
  deleteBallots,
};
