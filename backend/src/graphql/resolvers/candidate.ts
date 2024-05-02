const getCandidatesResolver = (_, __, contextValue) => contextValue.dataSources.candidates.getCandidates();
const getCandidateResolver = (_, args, contextValue) => contextValue.dataSources.candidates.getCandidate(args.id);

export { getCandidateResolver, getCandidatesResolver };