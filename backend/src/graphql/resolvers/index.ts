import type { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";

import { getCandidateResolver, getCandidatesResolver } from "./candidate";
import { getConfigResolver, updateConfig } from "./config";
import { getPositionResolver, getPositionsResolver } from "./positions";
import { deleteAllResultsResolver, getAllResultsResolver, getResultResolver } from "./results";
import { getUserResolver, getUsersResolver } from "./user";
import {
    addDecryptedBallot,
    deleteBallots,
    getDecryptedBallotCount,
    getDecryptedBallots,
    getEncryptedBallotCount,
    getEncryptedBallots,
    saveDecryptedBallots,
    submitBallot,
} from "./voting";
import {
    clearVotingStatusesResolver,
    getCompletedVotingStatusesCountResolver,
    getVotingStatusResolver,
    getVotingStatusesCountResolver,
    getVotingStatusesResolver,
} from "./votingStatus";

import type ApolloGQLContext from "@util/apolloGQLContext";

// Resolvers define how to fetch the types defined in your schema.
const resolvers: GraphQLResolverMap<ApolloGQLContext> = {
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
        allResults: getAllResultsResolver,
        result: getResultResolver,
    },
    Mutation: {
        submitBallot,
        addDecryptedBallot,
        deleteBallots,
        resetVotingStatuses: clearVotingStatusesResolver,
        updateConfig,
        saveDecryptedBallots,
        deleteAllResults: deleteAllResultsResolver,
    },
    Candidate: {
        position(parent: any, _: any, contextValue) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString());
        },
    },
    SelectedBallotOption: {
        position(parent: any, _: any, contextValue) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString());
        },
        candidates(parent: any, _: any, contextValue) {
            return Promise.all(
                parent.candidates.map((candidateId: any) =>
                    contextValue.dataSources.candidates.getCandidate(candidateId.toString()),
                ),
            );
        },
    },
    ResultPosition: {
        position(parent: any, _: any, contextValue) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString());
        },
    },
    ResultCandidate: {
        candidate(parent: any, _: any, contextValue) {
            return contextValue.dataSources.candidates.getCandidate(parent.candidate.toString());
        },
    },
};

export default resolvers;
