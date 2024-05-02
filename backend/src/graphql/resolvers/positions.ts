const getPositionsResolver = (_, __, contextValue) => contextValue.dataSources.positions.getPositions();
const getPositionResolver = (_, args, contextValue) => contextValue.dataSources.positions.getPosition(args.id);

export { getPositionResolver, getPositionsResolver };