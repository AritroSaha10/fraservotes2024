import { MyContext } from "../..";

const getPositionsResolver = (_, __, contextValue: MyContext) => contextValue.dataSources.positions.getPositions();
const getPositionResolver = (_, args, contextValue: MyContext) => contextValue.dataSources.positions.getPosition(args.id);

export { getPositionResolver, getPositionsResolver };