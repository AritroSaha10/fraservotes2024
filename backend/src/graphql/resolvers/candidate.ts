import type ApolloGQLContext from "@util/apolloGQLContext";

const getCandidatesResolver = (_: any, __: any, contextValue: ApolloGQLContext) =>
    contextValue.dataSources.candidates.getCandidates();
const getCandidateResolver = (_: any, args: { id: string }, contextValue: ApolloGQLContext) =>
    contextValue.dataSources.candidates.getCandidate(args.id);

export { getCandidateResolver, getCandidatesResolver };
