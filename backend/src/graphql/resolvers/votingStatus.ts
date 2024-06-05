import { getAuth } from "firebase-admin/auth";

import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import type ApolloGQLContext from "@util/apolloGQLContext";

import { validateIfAdmin } from "src/util/checkIfAdmin";
import validateTokenForSensitiveRoutes from "src/util/validateTokenForSensitiveRoutes";

interface VotingStatusFilter {
    _id: string;
    studentNumber: number;
}

const getVotingStatusesResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.votingStatuses.getVotingStatuses();
};

const getVotingStatusResolver = async (_: any, args: { filter: VotingStatusFilter }, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);

    if (args.filter._id !== null && args.filter._id !== undefined) {
        return contextValue.dataSources.votingStatuses.getVotingStatusById(
            ObjectId.createFromHexString(args.filter._id),
        );
    } else if (args.filter.studentNumber !== null && args.filter.studentNumber !== undefined) {
        const res = await contextValue.dataSources.votingStatuses.getVotingStatusByStudentNumber(
            args.filter.studentNumber,
        );
        return res;
    } else {
        throw new GraphQLError("No options in filter provided", {
            extensions: {
                code: "BAD_REQUEST",
                http: { status: 400 },
            },
        });
    }
};

const getVotingStatusesCountResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.votingStatuses.getVotingStatusesCount();
};

const getCompletedVotingStatusesCountResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.votingStatuses.getCompletedVotingStatusesCount();
};

const clearVotingStatusesResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    // Double-check if user is actually admin, since this is quite destructive
    const uid = contextValue.authTokenDecoded.uid;
    const { customClaims } = await auth.getUser(uid);
    if (!(customClaims !== undefined && "admin" in customClaims && customClaims.admin === true)) {
        throw new GraphQLError("Not sufficient permissions", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }

    await contextValue.dataSources.votingStatuses.clearVotingStatuses();
    return null;
};

export {
    getVotingStatusesResolver,
    getVotingStatusesCountResolver,
    getVotingStatusResolver,
    clearVotingStatusesResolver,
    getCompletedVotingStatusesCountResolver,
};
