import type { MyContext } from "src/";
import { getAuth } from "firebase-admin/auth";
import validateTokenForSensitiveRoutes from "src/util/validateTokenForSensitiveRoutes";
import { validateIfAdmin } from "src/util/checkIfAdmin";
import type { ConfigDocument } from "src/models/config";
import { GraphQLError } from "graphql";

interface ConfigInput {
    isOpen: boolean | null | undefined;
    publicKey: string | null | undefined;
}

const getConfigResolver = (_: any, __: any, contextValue: MyContext) => contextValue.dataSources.config.get();

const updateConfig = async (_: any, args: { newConfig: ConfigInput }, contextValue: MyContext) => {
    // Sensitive action, need to verify whether they are authorized
    const auth = getAuth();
    await validateTokenForSensitiveRoutes(auth, contextValue.authTokenRaw);
    validateIfAdmin(contextValue.authTokenDecoded);

    // Double-check if user is actually admin, since this is quite important
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

    let newConfig: ConfigDocument | null | undefined;
    // Set public key first since it's required to open voting
    if (args.newConfig.publicKey !== undefined && args.newConfig.publicKey !== null) {
        newConfig = await contextValue.dataSources.config.updatePublicKey(args.newConfig.publicKey);
    }
    if (args.newConfig.isOpen !== undefined && args.newConfig.isOpen !== null) {
        newConfig = await contextValue.dataSources.config.updateVotingOpen(args.newConfig.isOpen);
    }

    // Just return old config if nothing changed
    if (newConfig === undefined || newConfig === null) {
        newConfig = await contextValue.dataSources.config.get();
    }

    return newConfig;
};

export { getConfigResolver, updateConfig };

