import { MongoDataSource } from "apollo-datasource-mongodb";
import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";

import type { PositionDocument } from "@models/position";

export default class Positions extends MongoDataSource<PositionDocument> {
    async getPosition(id: ObjectId | string) {
        const data = await this.findOneById(id);
        if (data === null || data === undefined) {
            throw new GraphQLError("No position exists with the given ID.", {
                extensions: {
                    code: "NOT_FOUND",
                    http: { status: 404 },
                },
            });
        }

        return data;
    }

    getPositions() {
        return this.model!.find().exec();
    }
}
