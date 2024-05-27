import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";

import cors from "cors";
import "dotenv/config";
import express from "express";
import { readFileSync, readdirSync } from "fs";
import { GraphQLError } from "graphql";
import gql from "graphql-tag";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import Candidates from "./graphql/datasources/candidates";
import ConfigDataSource from "./graphql/datasources/config";
import DecryptedBallots from "./graphql/datasources/decryptedBallots";
import EncryptedBallots from "./graphql/datasources/encryptedBallots";
import Positions from "./graphql/datasources/positions";
import ResultsDataSource from "./graphql/datasources/results";
import Users from "./graphql/datasources/users";
import VotingStatuses from "./graphql/datasources/votingStatuses";

import resolvers from "./graphql/resolvers/index";

import Candidate from "./models/candidate";
import Config from "./models/config";
import DecryptedBallot from "./models/decryptedBallot";
import EncryptedBallot from "./models/encryptedBallot";
import Position from "./models/position";
import Results from "./models/results";
import VotingStatus from "./models/votingStatus";

import checkIfAdmin from "./util/checkIfAdmin";
import checkIfVolunteer from "./util/checkIfVolunteer";
import createServiceAccount from "./util/createServiceAccount";

import { hello } from "./routes/hello";

import morgan from 'morgan';

export interface MyContext {
    authTokenDecoded: DecodedIdToken;
    authTokenRaw: string;
    dataSources: {
        positions: Positions;
        candidates: Candidates;
        users: Users;
        encryptedBallots: EncryptedBallots;
        decryptedBallots: DecryptedBallots;
        votingStatuses: VotingStatuses;
        config: ConfigDataSource;
        results: ResultsDataSource;
    };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();
mongoose.connect(process.env.MONGODB_CONNECTION_STR ?? "");

initializeApp({
    credential: createServiceAccount(),
});
const auth = getAuth();

// Middleware
app.use(cors());
app.use(express.json());

// Import GraphQL type definitions
const rawTypeDefs = readdirSync(path.join(__dirname, "./graphql/schemas"))
    .sort((a, b) => {
        if (a.includes("schema.graphql")) return -1;
        if (b.includes("schema.graphql")) return 1;
        return a.localeCompare(b);
    })
    .map((file) =>
        readFileSync(path.join(__dirname, "./graphql/schemas", file), {
            encoding: "utf-8",
        }),
    )
    .join("\n\n");
const typeDefs = gql(rawTypeDefs);

// Setup Apollo GraphQL server
const server = new ApolloServer<MyContext>({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    status400ForVariableCoercionErrors: true,
    introspection: process.env.NODE_ENV !== "production",
});
await server.start();
app.enable("trust proxy");
app.use(morgan(':date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms'));
app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => {
            const authToken = (req.headers.authorization || "").replace("Bearer ", "");

            let decodedToken: DecodedIdToken | null = null;
            try {
                decodedToken = await auth.verifyIdToken(authToken);
                if (!(checkIfAdmin(decodedToken) || checkIfVolunteer(decodedToken))) {
                    throw new GraphQLError("Not a volunteer or admin", {
                        extensions: {
                            code: "FORBIDDEN",
                            http: { status: 403 },
                        },
                    });
                }
            } catch (e: any) {
                if ("code" in e) {
                    if (
                        ![
                            "auth/id-token-expired",
                            "auth/id-token-invalid",
                            "auth/id-token-revoked",
                            "auth/argument-error",
                        ].includes(e.code)
                    ) {
                        console.log(e);
                        console.error("Error while authenticating user: " + e);
                    }

                    throw new GraphQLError("Could not authenticate user", {
                        extensions: {
                            code: "UNAUTHENTICATED",
                            http: { status: 401 },
                        },
                    });
                } else {
                    console.log(e);
                    console.error("Error while authenticating user: " + e);

                    throw new GraphQLError("Could not authenticate user", {
                        extensions: {
                            code: "SERVER_ERROR",
                            http: { status: 500 },
                        },
                    });
                }
            }

            return {
                authTokenDecoded: decodedToken,
                authTokenRaw: authToken,
                dataSources: {
                    positions: new Positions({ modelOrCollection: Position }),
                    candidates: new Candidates({ modelOrCollection: Candidate }),
                    users: new Users(),
                    encryptedBallots: new EncryptedBallots({ modelOrCollection: EncryptedBallot }),
                    decryptedBallots: new DecryptedBallots({ modelOrCollection: DecryptedBallot }),
                    votingStatuses: new VotingStatuses({ modelOrCollection: VotingStatus }),
                    config: new ConfigDataSource({ modelOrCollection: Config }),
                    results: new ResultsDataSource({ modelOrCollection: Results }),
                },
            };
        },
    }),
);

// Set up REST routes
app.get("/", hello);

// Start Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`GraphQL server available at: http://localhost:${PORT}/graphql`);
});
