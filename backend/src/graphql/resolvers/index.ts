import { getPositionResolver, getPositionsResolver } from "./positions.js";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        positions: getPositionsResolver,
        position: getPositionResolver,
    },
};

export default resolvers;