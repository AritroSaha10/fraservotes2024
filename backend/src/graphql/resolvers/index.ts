import { getCandidateResolver, getCandidatesResolver } from "./candidate.js";
import { getPositionResolver, getPositionsResolver } from "./positions.js";

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        positions: getPositionsResolver,
        position: getPositionResolver,
        candidates: getCandidatesResolver,
        candidate: getCandidateResolver,
    },
    Candidate: {
        position(parent, args, contextValue) {
            return contextValue.dataSources.positions.getPosition(parent.position.toString())
        }
    }
};

export default resolvers;