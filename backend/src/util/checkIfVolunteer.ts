import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Checks whether user is volunteer through claims
 * @param decodedToken Decoded JWT, assumes already verified
 * @returns Whether the user is an volunteer or not
 */
export default function checkIfVolunteer(decodedToken: DecodedIdToken) {
    return "volunteer" in decodedToken && decodedToken["volunteer"] === true;
}