import getTokenSafely from "@/lib/auth/getTokenSafely";

interface DecodedToken {
    admin?: boolean;
    volunteer?: boolean;
    aud: string;
    auth_time: number;
    email: string;
    email_verified: boolean;
    exp: number;
    firebase: {
        identities: { [key: string]: string[] };
        sign_in_provider: string;
    };
    iat: number;
    iss: string;
    name: string;
    picture: string;
    sub: string;
    user_id: string;
}

/**
 * @description Same as getTokenSafely, except it decodes the JWT for you.
 */
export default async function getDecodedTokenSafely() {
    const token = await getTokenSafely();

    // Credit to https://stackoverflow.com/a/38552302
    // We don't need to worry about a tampered JWT since
    // this is directly from Firebase
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split("")
            .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
    );

    return JSON.parse(jsonPayload) as DecodedToken;
}
