import { getAuth } from "firebase-admin/auth";

import { GraphQLError } from "graphql";

import type ApolloGQLContext from "@util/apolloGQLContext";
import checkIfAdmin, { validateIfAdmin } from "src/util/checkIfAdmin";
import validateTokenForSensitiveRoutes from "src/util/validateTokenForSensitiveRoutes";

const getUsersResolver = async (_: any, __: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.users.getUsers();
};

const getUserResolver = async (_: any, args: any, contextValue: ApolloGQLContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    if (!(checkIfAdmin(contextValue.authTokenDecoded) || contextValue.authTokenDecoded.uid === args.uid)) {
        throw new GraphQLError("Not sufficient permissions", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }

    return contextValue.dataSources.users.getUser(args.uid);
};

export { getUserResolver, getUsersResolver };
