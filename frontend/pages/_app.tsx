import type { AppProps } from "next/app";
import dynamic from "next/dynamic";

import { ApolloProvider } from "@apollo/client";
import { ThemeProvider } from "@material-tailwind/react";
import { AnimatePresence, LazyMotion, domMax } from "framer-motion";

import createApolloClient from "@/lib/apollo/client";

import "@/styles/globals.css";

const FirebaseAuthProvider = dynamic(() =>
    import("@/components/FirebaseAuthContext").then((mod) => mod.FirebaseAuthProvider),
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
