import { GraphQLError } from "graphql";
import { MyContext } from "../..";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "../../util/validateTokenForSensitiveRoutes.js";
import { validateIfAdmin } from "../../util/checkIfAdmin.js";
import { SelectedOption } from "../../models/decryptedBallot";
import { isPGPEncrypted } from "../../util/isPGPEncrypted";

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
        studentNumber: number;
        encryptedBallot: string;
    },
    contextValue: MyContext
) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);

    // Confirm voting is open
    const { isOpen: votingIsOpen } = await contextValue.dataSources.config.get()
    if (!votingIsOpen) {
        throw new GraphQLError("Voting is not open", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }

    // Make sure student hasn't voted yet
    const votingStatus =
        await contextValue.dataSources.votingStatuses.getVotingStatusByStudentNumber(
            args.studentNumber
        );
    
    if (votingStatus === null) {
        throw new GraphQLError("Student number is not valid", {
            extensions: {
                code: "NOT_FOUND",
                http: { status: 404 },
            },
        });
    }
    if (votingStatus.voted) {
        throw new GraphQLError("Student has already voted", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }

    // Confirm that ballot is PGP encrypted
    if (!(await isPGPEncrypted(args.encryptedBallot))) {
        throw new GraphQLError("Encrypted ballot string is not a valid PGP message", {
            extensions: {
                code: "BAD_REQUEST",
                http: { status: 404 },
            },
        });
    }

    // Submit ballot
    await contextValue.dataSources.encryptedBallots.submitBallot(
        args.encryptedBallot
    );

    // Update voting status
    await contextValue.dataSources.votingStatuses.updateVotingStatus(
        args.studentNumber,
        true
    );

    return null;
};

const addDecryptedBallot = async (
    _,
    args: {
        timestampUTC: number;
        selectedChoices: SelectedOption[];
    },
    contextValue: MyContext
) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    // Confirm voting is closed
    const { isOpen: votingIsOpen } = await contextValue.dataSources.config.get()
    if (votingIsOpen) {
        throw new GraphQLError("Voting is open, must be closed before decryption", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }

    // Add ballot
    await contextValue.dataSources.decryptedBallots.addDecryptedBallot(
        args.timestampUTC,
        args.selectedChoices
    );

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

    // Confirm voting is closed
    const { isOpen: votingIsOpen } = await contextValue.dataSources.config.get()
    if (votingIsOpen) {
        throw new GraphQLError("Voting is open, must be closed to delete ballots", {
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
