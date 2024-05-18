import type { MyContext } from "src/";

const getCandidatesResolver = (_: any, __: any, contextValue: MyContext) =>
    contextValue.dataSources.candidates.getCandidates();
const getCandidateResolver = (_: any, args: any, contextValue: MyContext) =>
    contextValue.dataSources.candidates.getCandidate(args.id);

export { getCandidateResolver, getCandidatesResolver };
