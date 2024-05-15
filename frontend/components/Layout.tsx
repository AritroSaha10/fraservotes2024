import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from "react";

import Head from "next/head";
import { useRouter } from "next/router";

import Footer from "@/components/Footer";
import { m } from "framer-motion";

import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import isUndefinedOrNull from "@/util/undefinedOrNull";
import { signOut } from "firebase/auth";
import auth from "@/lib/firebase/auth";
import LoadingSpinner from "./LoadingSpinner";
import { Typography } from "@material-tailwind/react";
import { UnauthorizedComponent } from "@/pages/401";
import { ForbiddenComponent } from "@/pages/403";
import { NoAccessComponent } from "@/pages/no-access";
import useIsRouterLoading from "./useIsRouterLoading";
import AdminNavbar from "./admin/AdminNavbar";
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

enum AUTH_STATUS {
  LOADING,
  UNAUTHORIZED,
  FORBIDDEN,
  NO_ACCESS,
  OK,
}

interface LayoutProps extends PropsWithChildren {
  name: string;
  children?: ReactNode;
  noAnim?: boolean;
  className?: string;
  userProtected?: boolean;
  adminProtected?: boolean;
}

export default function Layout({
  name,
  children,
  noAnim,
  className,
  userProtected,
  adminProtected,
}: LayoutProps) {
  const { user, loaded } = useFirebaseAuth();
  const router = useRouter();
  const isRouterLoading = useIsRouterLoading();

  const [authorizationStatus, setAuthorizedStatus] = useState<AUTH_STATUS>(
    (userProtected || adminProtected) ? AUTH_STATUS.LOADING : AUTH_STATUS.OK
  );

  const title = `${name} | FraserVotes`;
  const description = adminProtected
    ? "The digital voting platform for John Fraser S.S."
    : "An admin page for FraserVotes.";

  useEffect(() => {
    if (loaded && (!isRouterLoading)) {
      if (userProtected || adminProtected) {
        if (user === null) {
          setAuthorizedStatus(AUTH_STATUS.UNAUTHORIZED);
        } else {
          (async () => {
            const { claims } = await user?.getIdTokenResult();
            const notAdmin =
              isUndefinedOrNull(claims.admin) || claims.admin === false;
            const notVolunteer =
              isUndefinedOrNull(claims.volunteer) || claims.volunteer === false;

            if (notAdmin && notVolunteer) {
              await signOut(auth);
              setAuthorizedStatus(AUTH_STATUS.NO_ACCESS);
            } else if (adminProtected && notAdmin) {
              setAuthorizedStatus(AUTH_STATUS.FORBIDDEN);
            } else {
                // Either they're a volunteer/admin accessing volunteer page,
                // or admin accessing admin page
                setAuthorizedStatus(AUTH_STATUS.OK);
            }
          })();
        }
      } else {
        setAuthorizedStatus(AUTH_STATUS.OK);
      }
    } else {
      setAuthorizedStatus(AUTH_STATUS.LOADING);
    }
  }, [user, loaded, isRouterLoading]);

  let navbar: JSX.Element | null = null;
  if (adminProtected) {
      navbar = <AdminNavbar />;
  }

  const backgroundGradient = adminProtected
    ? "from-[#fbc7d4]/25 to-[#9796f0]/25"
    : "from-[#91EAE4]/30 via-[#86A8E7]/30 to-[#7F7FD5]/30";

  const innerComponent = (() => {
    switch (authorizationStatus) {
      case AUTH_STATUS.LOADING: {
        return (
          <div className="flex flex-row items-center justify-center flex-grow w-screen gap-4 p-4">
            <LoadingSpinner />
            <Typography variant="h2" className="text-center">
              Loading...
            </Typography>
          </div>
        );
      }
      case AUTH_STATUS.UNAUTHORIZED: {
        return <UnauthorizedComponent />;
      }
      case AUTH_STATUS.FORBIDDEN: {
        return <ForbiddenComponent />;
      }
      case AUTH_STATUS.NO_ACCESS: {
        return <NoAccessComponent />;
      }
      case AUTH_STATUS.OK: {
        return children;
      }
    }
  })();

  return (
    <div
      className={`flex flex-col min-h-screen bg-gradient-to-br ${backgroundGradient} overflow-hidden`}
      key={name}
    >
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {userProtected && <meta name="referrer" content="no-referrer" />}

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
      </Head>

      {navbar !== null && navbar}

      <m.div
        initial={noAnim ? undefined : contentVariants.initial}
        animate={noAnim ? undefined : contentVariants.animate}
        exit={noAnim ? undefined : contentVariants.exit}
        transition={noAnim ? undefined : contentVariants.transition}
        className={`flex-grow ${className}`}
      >
        {innerComponent}
      </m.div>

      {(userProtected || adminProtected) && <Footer showLink={adminProtected} />}
    </div>
  );
}
