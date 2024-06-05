import { MongoDataSource } from "apollo-datasource-mongodb";
import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";

import type { CandidateDocument } from "@models/candidate";

export default class Candidates extends MongoDataSource<CandidateDocument> {
    async getCandidate(id: ObjectId | string) {
        const data = await this.findOneById(id);
        if (data === null || data === undefined) {
            throw new GraphQLError("No candidate exists with the given ID.", {
                extensions: {
                    code: "NOT_FOUND",
                    http: { status: 404 },
                },
            });
        }

        return data;
    }

    getCandidates() {
        return this.model!.find().exec();
    }
}
