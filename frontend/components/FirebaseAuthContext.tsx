import { ReactNode, createContext, useContext, useEffect, useState } from "react";

import router from "next/router";

import { User as firebaseUser, onAuthStateChanged, signOut } from "firebase/auth";

import auth from "@/lib/firebase/auth";
import { clearVolunteerKey } from "@/util/volunteerKey";

type User = firebaseUser | null;
type ContextState = { user: User; loaded: boolean };
type Props = { children?: ReactNode };

const FirebaseAuthContext = createContext<ContextState | undefined>(undefined);

const FirebaseAuthProvider: React.FC<Props> = ({ children }: Props) => {
    const [user, setUser] = useState<User>(null);
    const [loaded, setLoaded] = useState(false);
    const value = { user, loaded };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (newUser) => {
            // Only allow people to join with student accounts
            if (newUser !== null && !newUser?.email?.includes("@pdsb.net")) {
                newUser.delete().then(() => {
                    alert(
                        "Please sign in with your student account (@pdsb.net). You have automatically been signed out.",
                    );
                });
                return;
            }

            setUser(newUser);
            setLoaded(true);

            // Check whether their account exists / hasn't been deleted
            // If it has been, make them sign in again
            if (newUser !== null) {
                newUser
                    ?.getIdTokenResult(true)
                    .then(() => {})
                    .catch(() => {
                        alert("Sorry, something went wrong. Please try signing in again.");
                        router.push("/").then(() => {
                            signOut(auth)
                                .then(() => {})
                                .catch(() => {});
                        });
                    });
            } else {
                // This should always be cleared when signed out so a new one can be generated on sign-in
                clearVolunteerKey();
            }
        });
        return unsubscribe;
    }, []);

    return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
};

function useFirebaseAuth() {
    const context = useContext(FirebaseAuthContext);
    if (context === undefined) {
        throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
    }
    return { user: context.user, loaded: context.loaded };
}

export { FirebaseAuthProvider, useFirebaseAuth };
