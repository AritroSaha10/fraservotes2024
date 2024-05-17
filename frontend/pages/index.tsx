import Image from "next/image";
import { Inter } from "next/font/google";
import { GoogleAuthProvider, getAuth, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import auth from "@/lib/firebase/auth";
import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import { useEffect, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      router.push("/login")
    }
  }, [router])

  return (
    <></>
  );
}
