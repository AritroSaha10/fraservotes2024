import dynamic from "next/dynamic";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import createApolloClient from "@/lib/apollo/client";
import { ApolloProvider } from "@apollo/client";
import { AnimatePresence, LazyMotion, domMax } from "framer-motion";
import { ThemeProvider } from "@material-tailwind/react";

const FirebaseAuthProvider = dynamic(() =>
  import("@/components/FirebaseAuthContext").then(
    (mod) => mod.FirebaseAuthProvider
  )
);

export default function App({ Component, pageProps }: AppProps) {
  const client = createApolloClient();

  return (
    <ThemeProvider>
      <ApolloProvider client={client}>
          <FirebaseAuthProvider>
            <LazyMotion features={domMax}>
              <AnimatePresence mode="wait">
                <Component {...pageProps} />
              </AnimatePresence>
            </LazyMotion>
          </FirebaseAuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}
