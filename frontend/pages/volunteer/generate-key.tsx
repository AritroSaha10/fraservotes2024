import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import Layout from "@/components/Layout";
import auth from "@/lib/firebase/auth";
import { generateVolunteerKey, getVolunteerKeyHash } from "@/util/volunteerKey";
import { Button, Typography } from "@material-tailwind/react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function VolunteerGenerateKey() {
    const { user, loaded } = useFirebaseAuth();
    const router = useRouter();

    useEffect(() => {
        if (user !== null && loaded) {
            if (getVolunteerKeyHash() !== null) {
                alert("A volunteer key already exists in this session. Please sign out and sign back in again to generate a new one.")
            } else {
                generateVolunteerKey().then(() => router.push("/volunteer/check-in"));
            }
        }
    }, [user, loaded, router]);

    return (
        <Layout name="Generate New Key" userProtected className="flex flex-col w-full h-full items-center justify-center">
            <Typography variant="h1">
                Generate Volunteer Key
            </Typography>
            <Typography variant="paragraph" className="lg:w-1/2 text-center mb-4">
                This page only works if you have not generated a code before. If you have, but still want to reset it, try signing out and signing back in.
            </Typography>
            <Button color="red" variant="filled" onClick={() => signOut(auth).then(() => router.push("/login"))}>
                Sign Out
            </Button>
        </Layout>
    )
}