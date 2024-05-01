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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();
mongoose.connect(process.env.MONGODB_CONNECTION_STR);


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
const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
await server.start();
app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            return {
                dataSources: {
                    // @ts-ignore
                    positions: new Positions({ modelOrCollection: Position }),
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