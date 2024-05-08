import { MyContext } from "../../index.js";
import { getCandidateResolver, getCandidatesResolver } from "./candidate.js";
import { getPositionResolver, getPositionsResolver } from "./positions.js";
import { getUserResolver, getUsersResolver } from "./user.js";
import { addDecryptedBallot, deleteBallots, getDecryptedBallotCount, getDecryptedBallots, getEncryptedBallotCount, getEncryptedBallots, submitBallot } from "./voting.js";
import { clearVotingStatusesResolver, getVotingStatusResolver, getVotingStatusesResolver } from "./votingStatus.js";

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
        decryptedBallots: getDecryptedBallots,
        encryptedBallotCount: getEncryptedBallotCount,
        decryptedBallotCount: getDecryptedBallotCount,
        votingStatuses: getVotingStatusesResolver,
        votingStatus: getVotingStatusResolver,
        resetVotingStatuses: clearVotingStatusesResolver
    },
    Mutation: {
        submitBallot,
        addDecryptedBallot,
        deleteBallots,
    },
    Candidate: {
        position(parent, _, contextValue: MyContext) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString())
        }
    },
    SelectedBallotOption: {
        position(parent, _, contextValue: MyContext) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString())
        },
        candidate(parent, _, contextValue: MyContext) {
            return contextValue.dataSources.candidates.getCandidate(parent.candidate.toString())
        }
    }
};

export default resolvers;