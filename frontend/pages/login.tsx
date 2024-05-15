import { useEffect, useState } from "react";

import Head from "next/head";
import router from "next/router";

import { Typography } from "@material-tailwind/react";
import { GoogleLogin } from "@react-oauth/google";
import {
    GoogleAuthProvider,
    ParsedToken,
    browserLocalPersistence,
    setPersistence,
    signInWithCredential,
    signInWithPopup,
    signInWithRedirect,
    signOut,
} from "firebase/auth";

import auth from "@/lib/firebase/auth";

import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import isUndefinedOrNull from "@/util/undefinedOrNull";
import GoogleButton from "react-google-button";
import { generate } from "random-words";
import { generateVolunteerKey } from "@/util/volunteerKey";

export default function Login() {
    const [loggingIn, setLoggingIn] = useState(false);

    const authProvider = new GoogleAuthProvider();
    authProvider.setCustomParameters({
        // login_hint: "000000@pdsb.net",
        // hd: "pdsb.net", // Only allows users part of pdsb.net organization
        prompt: 'consent',
    });

    const redirectBasedOnRoles = async (claims: ParsedToken) => {
        // Don't allow users to access if they don't have valid authorization.
        if (!isUndefinedOrNull(claims.admin) && claims.admin === true) {
            await router.push("/admin");
        } else if (!isUndefinedOrNull(claims.volunteer) && claims.volunteer === true) {
            // Generate a code and store into local storage
            await generateVolunteerKey();
            await router.push("/voting");
        } else {
            await Promise.all([signOut(auth), router.push("/no-access")]);
        }
    }

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
            alert("Something went wrong while signing you in. Please try again.")
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
    }, [user, loaded]);

    return (
        <Layout
            name="Login"
            className="flex flex-col items-center justify-center"
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

                <GoogleButton onClick={() => { logIn() }} />
            </div>
        </Layout>
    );
}