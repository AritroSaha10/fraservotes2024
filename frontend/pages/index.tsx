import Image from "next/image";
import { Inter } from "next/font/google";
import { GoogleAuthProvider, getAuth, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import auth from "@/lib/firebase/auth";
import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const provider = new GoogleAuthProvider();
  const { user, loaded } = useFirebaseAuth();
  const [token, setToken] = useState("");

  useEffect(() => {
    provider.setCustomParameters({
      hd: "pdsb.net"
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (user !== null && loaded) {
        setToken(await user.getIdToken());
      }
    })();
  })

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      {(user !== null && loaded) ? (
        <div className="w-3/4">
          <p>Name: {user.displayName}</p>
          <p>Email: {user.email}</p>
          <p className="break-all">Token: {token}</p>
          <button onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </div>
      ) : (
        <button onClick={() => signInWithPopup(auth, provider)}>
          Sign In
        </button>
      )}
    </main>
  );
}
