import { GraphQLError } from "graphql";
import { MyContext } from "../..";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "../../util/validateTokenForSensitiveRoutes.js";
import { validateIfAdmin } from "../../util/checkIfAdmin.js";

const getEncryptedBallots = async (_, __, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.encryptedBallots.getEncryptedBallots();
}

const getBallotCount = async (_, __, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.encryptedBallots.getBallotCount();
}

const submitBallot = async (_, args, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);

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

    // Submit ballot
    await contextValue.dataSources.encryptedBallots.submitBallot(args.encryptedBallot);

    // Update claims
    contextValue.dataSources.users.updateClaimsForUser(uid, { voted: true });

    return null;
};

const deleteBallots = async (_, args, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    // Double-check if user is actually admin, since this is quite destructive
    const uid = contextValue.authTokenDecoded.uid;
    const { customClaims } = await auth.getUser(uid);
    if (!("admin" in customClaims && customClaims.admin === true)) {
        throw new GraphQLError('Not sufficient permissions', {
            extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 },
            },
        });
    }

    // Delete ballots
    await contextValue.dataSources.encryptedBallots.deleteBallots();

    return null;
};

export { getEncryptedBallots, getBallotCount, submitBallot, deleteBallots };