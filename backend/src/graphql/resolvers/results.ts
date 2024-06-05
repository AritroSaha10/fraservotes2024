import { getAuth } from "firebase-admin/auth";

import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import type ApolloGQLContext from "@util/apolloGQLContext";

import { validateIfAdmin } from "src/util/checkIfAdmin";
import validateTokenForSensitiveRoutes from "src/util/validateTokenForSensitiveRoutes";

const getAllResultsResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.results.getAllResults();
};

const getResultResolver = async (_: any, args: { id: string }, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);

    if (args.id !== null && args.id !== undefined) {
        return contextValue.dataSources.results.getResult(ObjectId.createFromHexString(args.id));
    } else {
        throw new GraphQLError("ID must be provided", {
            extensions: {
                code: "BAD_REQUEST",
                http: { status: 400 },
            },
        });
    }
};

const deleteAllResultsResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
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

    await contextValue.dataSources.results.deleteAllResults();
    return null;
};

export { getAllResultsResolver, getResultResolver, deleteAllResultsResolver };
