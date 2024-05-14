import Layout from "@/components/Layout";
import auth from "@/lib/firebase/auth";
import { Button } from "@material-tailwind/react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function AdminPage() {
    const router = useRouter();

    return (
        <Layout name="Admin page" adminProtected>
            <p>i&apos;m beyond cooked</p>

            <Button color="gray" size="lg" onClick={() => {
                // Redirect to non-auth page first before signing out to not flicker unauthorized
                router.push("/login").finally(() => signOut(auth))
            }}>
                Sign Out
            </Button>
        </Layout>
    )
}