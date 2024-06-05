import type { DecodedIdToken } from "firebase-admin/auth";

import type Candidates from "@datasources/candidates";
import type ConfigDataSource from "@datasources/config";
import type DecryptedBallots from "@datasources/decryptedBallots";
import type EncryptedBallots from "@datasources/encryptedBallots";
import type Positions from "@datasources/positions";
import type ResultsDataSource from "@datasources/results";
import type Users from "@datasources/users";
import type VotingStatuses from "@datasources/votingStatuses";

export default interface ApolloGQLContext {
    authTokenDecoded: DecodedIdToken;
    authTokenRaw: string;
    dataSources: {
        positions: Positions;
        candidates: Candidates;
        users: Users;
        encryptedBallots: EncryptedBallots;
        decryptedBallots: DecryptedBallots;
        votingStatuses: VotingStatuses;
        config: ConfigDataSource;
        results: ResultsDataSource;
    };
}
