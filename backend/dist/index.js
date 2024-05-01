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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5050;
const app = express();
app.use(cors());
app.use(express.json());
const rawTypeDefs = readdirSync(path.join(__dirname, "./graphql/schemas")).sort((a, b) => {
    if (a.includes("schema.graphql"))
        return -1;
    if (b.includes("schema.graphql"))
        return 1;
    return a.localeCompare(b);
}).map((file) => readFileSync(path.join(__dirname, "./graphql/schemas", file), {
    encoding: "utf-8",
})).join("\n\n");
const typeDefs = gql(rawTypeDefs);
const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
// Note you must call `start()` on the `ApolloServer`
// instance before passing the instance to `expressMiddleware`
await server.start();
app.use('/graphql', cors(), express.json(), expressMiddleware(server));
// Regular REST routes
app.get("/", hello);
// start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`GraphQL server available at: http://localhost:${PORT}/graphql`);
});
