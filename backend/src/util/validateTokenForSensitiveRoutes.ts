import { Auth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";

import { GraphQLError } from "graphql";

/**
 * Throws a GraphQL error if user's token does not meet standards for
 * sensitive routes (i.e. not revoked & less than 2 minutes old)
 * @param auth Reference to Firebase Auth object
 * @param authTokenRaw Raw JWT
 */
export default async function validateTokenForSensitiveRoutes(auth: Auth, authTokenRaw: string) {
    let decodedToken: DecodedIdToken;
    try {
        decodedToken = await auth.verifyIdToken(authTokenRaw, true);
    } catch (e: any) {
        if ("code" in e) {
            if (
                ![
                    "auth/expired-id-token",
                    "auth/invalid-id-token",
                    "auth/revoked-id-token",
                    "auth/user-disabled",
                ].includes(e.code)
            ) {
                console.error("Error while authenticating user: " + e);
            }

            throw new GraphQLError("Could not authenticate user", {
                extensions: {
                    code: "UNAUTHENTICATED",
                    http: { status: 401 },
                },
            });
        } else {
            console.error("Error while authenticating user: " + e);

            throw new GraphQLError("Could not authenticate user", {
                extensions: {
                    code: "SERVER_ERROR",
                    http: { status: 500 },
                },
            });
        }
    }

    // Ensure token is very fresh (max. 5 minutes old)
    const currTimestampUTC = Math.floor(new Date().getTime() / 1000);
    if (currTimestampUTC - decodedToken.iat > 5 * 60) {
        console.debug(
            "Timestamps for old token",
            currTimestampUTC,
            decodedToken.iat,
            currTimestampUTC - decodedToken.iat,
        );
        throw new GraphQLError("Token is too old", {
            extensions: {
                code: "UNAUTHENTICATED",
                http: { status: 401 },
            },
        });
    }
}
