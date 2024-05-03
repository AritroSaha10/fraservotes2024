import { MyContext } from "../..";

const getCandidatesResolver = (_, __, contextValue: MyContext) => contextValue.dataSources.candidates.getCandidates();
const getCandidateResolver = (_, args, contextValue: MyContext) => contextValue.dataSources.candidates.getCandidate(args.id);

export { getCandidateResolver, getCandidatesResolver };