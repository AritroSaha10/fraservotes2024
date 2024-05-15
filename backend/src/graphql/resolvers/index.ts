import { MyContext } from "../../index.js";
import { getCandidateResolver, getCandidatesResolver } from "./candidate.js";
import { getConfigResolver, updateConfig } from "./config.js";
import { getPositionResolver, getPositionsResolver } from "./positions.js";
import { getUserResolver, getUsersResolver } from "./user.js";
import { addDecryptedBallot, deleteBallots, getDecryptedBallotCount, getDecryptedBallots, getEncryptedBallotCount, getEncryptedBallots, submitBallot } from "./voting.js";
import { clearVotingStatusesResolver, getCompletedVotingStatusesCountResolver, getVotingStatusResolver, getVotingStatusesCountResolver, getVotingStatusesResolver } from "./votingStatus.js";

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
        votingStatusesCount: getVotingStatusesCountResolver,
        completedVotingStatusesCount: getCompletedVotingStatusesCountResolver,
        config: getConfigResolver,
    },
    Mutation: {
        submitBallot,
        addDecryptedBallot,
        deleteBallots,
        resetVotingStatuses: clearVotingStatusesResolver,
        updateConfig,
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
        candidates(parent, _, contextValue: MyContext) {
            return Promise.all(parent.candidates.map((candidateId: any) => 
                contextValue.dataSources.candidates.getCandidate(candidateId.toString())
            ));
        }
    }
};

export default resolvers;