import type ApolloGQLContext from "@util/apolloGQLContext";

const getPositionsResolver = (_: any, __: any, contextValue: ApolloGQLContext) =>
    contextValue.dataSources.positions.getPositions();
const getPositionResolver = (_: any, args: any, contextValue: ApolloGQLContext) =>
    contextValue.dataSources.positions.getPosition(args.id);

export { getPositionResolver, getPositionsResolver };
