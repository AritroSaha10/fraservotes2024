import dynamic from "next/dynamic";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import createApolloClient from "@/lib/apollo/client";
import { ApolloProvider } from "@apollo/client";

const FirebaseAuthProvider = dynamic(() =>
  import("@/components/FirebaseAuthContext").then((mod) => mod.FirebaseAuthProvider),
);
const GoogleOAuthProvider = dynamic(() => import("@react-oauth/google").then((mod) => mod.GoogleOAuthProvider));

export default function App({ Component, pageProps }: AppProps) {
  const client = createApolloClient();

  return (
    <ApolloProvider client={client}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GCLOUD_CLIENT_ID ?? ""}>
        <FirebaseAuthProvider>
          <Component {...pageProps} />
        </FirebaseAuthProvider>
      </GoogleOAuthProvider>
    </ApolloProvider>
  );
}
