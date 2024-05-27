import type { DecodedIdToken } from "firebase-admin/auth";

import { GraphQLError } from "graphql";

/**
 * Checks whether user is admin through claims
 * @param decodedToken Decoded JWT, assumes already verified
 * @returns Whether the user is an admin or not
 */
export default function checkIfAdmin(decodedToken: DecodedIdToken) {
    return "admin" in decodedToken && decodedToken["admin"] === true;
}

/**
 * Throws a GraphQL error if user is not admin
 * @param decodedToken Decoded JWT, assumes already verified
 */
export function validateIfAdmin(decodedToken: DecodedIdToken) {
    if (!checkIfAdmin(decodedToken)) {
        throw new GraphQLError("Not sufficient permissions", {
            extensions: {
                code: "FORBIDDEN",
                http: { status: 403 },
            },
        });
    }
}
