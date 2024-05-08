import express from 'express';
import cors from 'cors';

import gql from "graphql-tag";
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4';
import resolvers from './graphql/resolvers/index.js';
import { readFileSync, readdirSync } from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import { hello } from './routes/hello.js';
import Positions from './graphql/datasources/positions.js';
import mongoose from 'mongoose';
import Position from './models/position.js';

import 'dotenv/config'
import Candidates from './graphql/datasources/candidates.js';
import Candidate from './models/candidate.js';

import { initializeApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { GraphQLError } from 'graphql';
import Users from './graphql/datasources/users.js';
import EncryptedBallots from './graphql/datasources/encryptedBallots.js'
import createServiceAccount from './util/createServiceAccount.js';
import EncryptedBallot from './models/encryptedBallot.js';
import DecryptedBallots from './graphql/datasources/decryptedBallots.js';
import DecryptedBallot from './models/decryptedBallot.js';
import checkIfAdmin from './util/checkIfAdmin.js';
import checkIfVolunteer from './util/checkIfVolunteer.js';
import VotingStatuses from './graphql/datasources/votingStatuses.js';
import VotingStatus from './models/votingStatus.js';

export interface MyContext {
    authTokenDecoded: DecodedIdToken,
    authTokenRaw: string,
    dataSources: {
        positions: Positions,
        candidates: Candidates,
        users: Users,
        encryptedBallots: EncryptedBallots,
        decryptedBallots: DecryptedBallots,
        votingStatuses: VotingStatuses
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();
mongoose.connect(process.env.MONGODB_CONNECTION_STR);

initializeApp({
    credential: createServiceAccount()
})
const auth = getAuth();

// Middleware
app.use(cors());
app.use(express.json());

// Import GraphQL type definitions
const rawTypeDefs = readdirSync(path.join(__dirname, "./graphql/schemas")).sort((a, b) => {
    if (a.includes("schema.graphql")) return -1;
    if (b.includes("schema.graphql")) return 1;
    return a.localeCompare(b)
}).map((file) =>
    readFileSync(path.join(__dirname, "./graphql/schemas", file), {
        encoding: "utf-8",
    })
).join("\n\n");
const typeDefs = gql(rawTypeDefs);

// Setup Apollo GraphQL server
const server = new ApolloServer<MyContext>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    status400ForVariableCoercionErrors: true
});
await server.start();
app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            const authToken = (req.headers.authorization || "").replace("Bearer ", "");

            let decodedToken: DecodedIdToken = null;
            try {
                decodedToken = await auth.verifyIdToken(authToken);
                if (!(checkIfAdmin(decodedToken) || checkIfVolunteer(decodedToken))) {
                    throw new GraphQLError('Not a volunteer or admin', {
                        extensions: {
                            code: 'FORBIDDEN',
                            http: { status: 403 },
                        },
                    });
                }
            } catch (e) {
                if ("code" in e) {
                    if (!["auth/id-token-expired", "auth/id-token-invalid", "auth/id-token-revoked", "auth/argument-error"].includes(e.code)) {
                        console.log(e)
                        console.error("Error while authenticating user: " + e)
                    }

                    throw new GraphQLError('Could not authenticate user', {
                        extensions: {
                            code: 'UNAUTHENTICATED',
                            http: { status: 401 },
                        },
                    });
                } else {
                    console.log(e)
                    console.error("Error while authenticating user: " + e)

                    throw new GraphQLError('Could not authenticate user', {
                        extensions: {
                            code: 'SERVER_ERROR',
                            http: { status: 500 },
                        },
                    });
                }
            }

            return {
                authTokenDecoded: decodedToken,
                authTokenRaw: authToken,
                dataSources: {
                    // @ts-ignore
                    positions: new Positions({ modelOrCollection: Position }),
                    // @ts-ignore
                    candidates: new Candidates({ modelOrCollection: Candidate }),
                    users: new Users(),
                    encryptedBallots: new EncryptedBallots({ modelOrCollection: EncryptedBallot }),
                    decryptedBallots: new DecryptedBallots({ modelOrCollection: DecryptedBallot }),
                    votingStatuses: new VotingStatuses({ modelOrCollection: VotingStatus }),
                }
            };
        }
    }),
);

// Set up REST routes
app.get("/", hello);

// Start Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`GraphQL server available at: http://localhost:${PORT}/graphql`);
});