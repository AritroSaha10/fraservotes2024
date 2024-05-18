import { useEffect, useState } from "react";

import Head from "next/head";
import router from "next/router";

import { Typography } from "@material-tailwind/react";
import {
    GoogleAuthProvider,
    ParsedToken,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import GoogleButton from "react-google-button";

import auth from "@/lib/firebase/auth";
import isUndefinedOrNull from "@/util/undefinedOrNull";

import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import Layout from "@/components/Layout";

export default function Login() {
    const [loggingIn, setLoggingIn] = useState(false);

    const authProvider = new GoogleAuthProvider();
    authProvider.setCustomParameters({
        login_hint: "000000@pdsb.net",
        hd: "pdsb.net", // Only allows users part of pdsb.net organization
        prompt: "consent",
    });

    const redirectBasedOnRoles = async (claims: ParsedToken) => {
        // Don't allow users to access if they don't have valid authorization.
        if (!isUndefinedOrNull(claims.admin) && claims.admin === true) {
            await router.push("/admin");
        } else if (!isUndefinedOrNull(claims.volunteer) && claims.volunteer === true) {
            await router.push("/volunteer/check-in");
        } else {
            await Promise.all([signOut(auth), router.push("/no-access")]);
        }
    };

    const logIn = async () => {
        // Prompt user to log in
        setLoggingIn(true);

        try {
            const res = await signInWithPopup(auth, authProvider);
            if (res.user === null || res.user === undefined) {
                alert("Something went wrong when signing you in. Please try again.");
                return;
            }

            const { claims } = await res.user.getIdTokenResult();
            await redirectBasedOnRoles(claims);
        } catch (e) {
            console.error(e);
            alert("Something went wrong while signing you in. Please try again.");
        } finally {
            setLoggingIn(false);
        }
    };

    const { user, loaded } = useFirebaseAuth();

    useEffect(() => {
        if (user !== null && loaded && !loggingIn) {
            alert("You are already signed in. Redirecting...");
            user.getIdTokenResult().then(({ claims }) => redirectBasedOnRoles(claims));
        }
    }, [user, loaded, loggingIn]);

    return (
        <Layout
            name="Login"
            className="flex flex-col items-center justify-center"
            description="The login page for FraserVotes. Please note that this only works with PDSB accounts."
        >
            <Head>
                <meta
                    name="referrer"
                    content="strict-origin-when-cross-origin"
                    key="referrer-policy"
                />
            </Head>

            <div className="flex flex-col items-center justify-center p-8 pb-6 bg-white rounded-lg shadow-md max-w-md">
                <Typography
                    variant="h3"
                    color="black"
                    className="text-center mb-2"
                >
                    Log into FraserVotes
                </Typography>

                <GoogleButton
                    onClick={() => {
                        logIn();
                    }}
                />
            </div>
        </Layout>
    );
}
