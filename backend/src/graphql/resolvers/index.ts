import { getCandidateResolver, getCandidatesResolver } from "./candidate.js";
import { getPositionResolver, getPositionsResolver } from "./positions.js";
import { getUserResolver, getUsersResolver } from "./user.js";
import { deleteBallots, getBallotCount, getEncryptedBallots, submitBallot } from "./voting.js";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        positions: getPositionsResolver,
        position: getPositionResolver,
        candidates: getCandidatesResolver,
        candidate: getCandidateResolver,
        users: getUsersResolver,
        user: getUserResolver,
        encryptedBallots: getEncryptedBallots,
        ballotCount: getBallotCount,
    },
    Mutation: {
        submitBallot,
        deleteBallots,
    },
    Candidate: {
        position(parent, args, contextValue) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString())
        }
    }
};

export default resolvers;