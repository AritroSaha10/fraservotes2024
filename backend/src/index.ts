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

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { GraphQLError } from 'graphql';

export interface MyContext {
    authToken: DecodedIdToken
    dataSources: {
        positions: Positions,
        candidates: Candidates
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();
mongoose.connect(process.env.MONGODB_CONNECTION_STR);

const serviceAccount = cert({
    projectId: process.env.GCP_PROJECT_ID,
    privateKey: process.env.GCP_PRIVATE_KEY,
    clientEmail: process.env.GCP_CLIENT_EMAIL,
});

initializeApp({
    credential: serviceAccount
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
            } catch (e) {
                if ("code" in e) {
                    if (!["auth/expired_id_token", "auth/invalid_id_token", "auth/revoked_id_token", "auth/argument-error"].includes(e.code)) {
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
                authToken: decodedToken,
                dataSources: {
                    // @ts-ignore
                    positions: new Positions({ modelOrCollection: Position }),
                    // @ts-ignore
                    candidates: new Candidates({ modelOrCollection: Candidate }),
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