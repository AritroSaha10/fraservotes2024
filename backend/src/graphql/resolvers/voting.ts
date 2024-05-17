import { GraphQLError } from "graphql";
import { MyContext } from "../..";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "../../util/validateTokenForSensitiveRoutes.js";
import { validateIfAdmin } from "../../util/checkIfAdmin.js";
import { SelectedOption } from "../../models/decryptedBallot";
import { isPGPEncrypted } from "../../util/isPGPEncrypted.js";
import { PositionDocument } from "../../models/position";
import { CandidateDocument } from "../../models/candidate";
import { Types } from "mongoose";
import Results, { ResultsDocument } from "../../models/results.js";

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
        encryptedBallotId: string;
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
        new Types.ObjectId(args.encryptedBallotId),
        args.selectedChoices
    );

    return null;
};

const saveDecryptedBallots = async (
    _,
    args: {
        newDecryptedBallots: {
            encryptedBallotId: string;
            selectedChoices: SelectedOption[];
        }[]
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

    // Save all of the decrypted ballots to DB
    const decryptedBallotsInfo = await Promise.all(args.newDecryptedBallots.map(async ballot => {
        try {
            // Check whether encrypted ballot ID actually exists
            const encryptedBallotId = new Types.ObjectId(ballot.encryptedBallotId);
            const encryptedBallot = await contextValue.dataSources.encryptedBallots.findOneById(ballot.encryptedBallotId);
            if (encryptedBallot === null) {
                throw "Encrypted ballot ID does not exist";
            }

            // Add a new ballot, or update one that may already reference an encrypted ballot
            const res = await contextValue.dataSources.decryptedBallots.addOrUpdateDecryptedBallot(encryptedBallotId, ballot.selectedChoices);
            return {
                decryptedId: String(res.id),
                ballot
            };
        } catch (e) {
            console.error("Error while decrypting ballot:", e, "Ballot:", ballot)
            return null;
        }
    }));

    const failedSavesCount = decryptedBallotsInfo.filter(info => info === null).length;
    console.log(`${failedSavesCount}/${decryptedBallotsInfo.length} failed saving, counting all that were saved`);

    // Aggregate all of the data by position and candidate
    const positions = await contextValue.dataSources.positions.getPositions() as PositionDocument[];
    const candidates = await contextValue.dataSources.candidates.getCandidates() as CandidateDocument[];

    // Basically need to make an object where the key is the position ID, and the value is another object
    // That object has the candidate ID as a key and the count as the value
    // No keys are allowed to be added later on to prevent malicious actor from messing with backend and voting for
    // a person who isn't even running for a certain position
    let aggregatedData = positions.reduce((acc, position) => {
        acc[position.id] = candidates.reduce((acc, candidate) => {
            if (candidate.position.toString() === position._id.toString()) acc[candidate.id] = 0;
            return acc;
        }, {});
        return acc;
    }, {});

    // Now actually aggregate everything
    const successfulDecryptedBallots = decryptedBallotsInfo.filter(info => info !== null);
    successfulDecryptedBallots.forEach(info => {
        info.ballot.selectedChoices.forEach(choice => {
            // Confirm if position and candidate IDs are valid
            const positionId = choice.position.toString();
            if (!(positionId in aggregatedData)) {
                console.error("Given position is unknown / does not exist", positionId);
                return;
            }

            choice.
                candidates.
                // Just take the first few that fall under the spots available, nothing else matters
                slice(0, positions.filter(pos => pos.id === positionId)[0].spotsAvailable).
                forEach(candidateId => {
                    console.log(positionId, candidateId)
                    if (!(candidateId.toString() in aggregatedData[positionId])) {
                        console.error("Given candidate cannot be found for given position", positionId, candidateId.toString());
                    } else {
                        aggregatedData[positionId][candidateId.toString()]++;
                    }
            })
        });
    });

    console.log("Results:", aggregatedData)

    // Convert to Results schema and then save
    const convertedPositionsData = Object.keys(aggregatedData).map(positionId => {
        const candidates = Object.keys(aggregatedData[positionId]).map(candidateId => ({
            candidate: new Types.ObjectId(candidateId),
            votes: aggregatedData[positionId][candidateId]
        }));

        return {
            position: new Types.ObjectId(positionId),
            candidates
        };
    });

    const results: ResultsDocument = new Results({
        positions: convertedPositionsData,
        timestamp: Math.floor(Date.now() / 1000)
    });
    await results.save();

    return results.id;
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
    saveDecryptedBallots,
    deleteBallots,
};
