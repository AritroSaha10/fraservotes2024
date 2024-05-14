import { useEffect } from "react";

import Head from "next/head";
import { useRouter } from "next/router";

import Footer from "@/components/Footer";
import { m } from "framer-motion";

import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import isUndefinedOrNull from "@/util/undefinedOrNull";
import { signOut } from "firebase/auth";
import auth from "@/lib/firebase/auth";
// import AdminRestrictedPage from "@/components/admin/AdminRestrictedPage";
// import { ComplexNavbar as AdminNavbar } from "@/components/admin/Navbar";
// import { ComplexNavbar as UserNavbar } from "@/components/user/Navbar";

const transition = { ease: [0.6, 0.01, 0.0, 0.9] };

const contentVariants = {
    initial: { y: 200, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -200, opacity: 0 },
    transition: { duration: 0.4, ...transition },
};

export default function Layout({
    name,
    children,
    noAnim,
    className,
    userProtected,
    adminProtected,
}: {
    name: string;
    children: any;
    noAnim?: boolean;
    className?: string;
    userProtected?: boolean;
    adminProtected?: boolean;
}) {
    const { user, loaded } = useFirebaseAuth();
    const router = useRouter();

    const title = `${name} | FraserVotes`;
    const description = adminProtected
        ? "The digital voting platform for John Fraser S.S."
        : "An admin page for FraserVotes.";

    useEffect(() => {
        if (loaded) {
            if (userProtected) {
                if (user === null) {
                    router.push("/401");
                } else {
                    (async () => {
                        const { claims } = await user?.getIdTokenResult();
                        const notAdmin = isUndefinedOrNull(claims.admin) || claims.admin === false;
                        const notVolunteer = isUndefinedOrNull(claims.volunteer) || claims.volunteer === false;
                        if (notAdmin && notVolunteer) {
                            await Promise.all([signOut(auth), router.push("/no-access")]);
                        }
                    })()
                }
            }

            if (adminProtected) {
                if (user === null) {
                    router.push("/401");
                } else {
                    (async () => {
                        const { claims } = await user?.getIdTokenResult();
                        if (isUndefinedOrNull(claims.admin) || claims.admin === false) {
                            await router.push("/403")
                        }
                    })()
                }
            }
        }
    }, [user, loaded]);

    let navbar: JSX.Element | null = null;
    // if (adminProtected) {
    //     navbar = <AdminNavbar />;
    // } else if (userProtected) {
    //     navbar = <UserNavbar />;
    // }

    const backgroundGradient = adminProtected
        ? "from-[#fbc7d4]/25 to-[#9796f0]/25"
        : "from-[#91EAE4]/30 via-[#86A8E7]/30 to-[#7F7FD5]/30";

    return (
        <div
            className={`flex flex-col min-h-screen bg-gradient-to-br ${backgroundGradient} overflow-hidden`}
            key={name}
        >
            <Head>
                <title>{title}</title>
                <meta
                    name="description"
                    content={description}
                />

                {userProtected && (
                    <meta
                        name="referrer"
                        content="no-referrer"
                    />
                )}

                <meta
                    property="og:title"
                    content={title}
                />
                <meta
                    property="og:description"
                    content={description}
                />
                <meta
                    property="og:type"
                    content="website"
                />

                <meta
                    name="twitter:card"
                    content="summary_large_image"
                />
                <meta
                    property="twitter:title"
                    content={title}
                />
                <meta
                    property="twitter:description"
                    content={description}
                />
            </Head>

            {navbar !== null && navbar}

            <m.div
                initial={noAnim ? undefined : contentVariants.initial}
                animate={noAnim ? undefined : contentVariants.animate}
                exit={noAnim ? undefined : contentVariants.exit}
                transition={noAnim ? undefined : contentVariants.transition}
                className={`flex-grow ${className}`}
            >
                {adminProtected ? (
                    // <AdminRestrictedPage key={router.pathname}>{children}</AdminRestrictedPage>
                    children
                ) : (
                    children
                )}
            </m.div>

            {(userProtected || adminProtected) && <Footer />}
        </div>
    );
}