import { GraphQLError } from "graphql";
import { MyContext } from "../..";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "../../util/validateTokenForSensitiveRoutes.js";
import checkIfAdmin, { validateIfAdmin } from "../../util/checkIfAdmin.js";

const getUsersResolver = async (_, __, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    return contextValue.dataSources.users.getUsers();
}

const getUserResolver = async (_, args, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    if (!(checkIfAdmin(contextValue.authTokenDecoded) || contextValue.authTokenDecoded.uid === args.uid)) {
        throw new GraphQLError('Not sufficient permissions', {
            extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 },
            },
        });
    }

    return contextValue.dataSources.users.getUser(args.uid);
};

export { getUserResolver, getUsersResolver };