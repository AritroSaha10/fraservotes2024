import type { MyContext } from "src";

const getPositionsResolver = (_: any, __: any, contextValue: MyContext) => contextValue.dataSources.positions.getPositions();
const getPositionResolver = (_: any, args: any, contextValue: MyContext) => contextValue.dataSources.positions.getPosition(args.id);

export { getPositionResolver, getPositionsResolver };