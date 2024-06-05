import { MongoDataSource } from "apollo-datasource-mongodb";

import type { EncryptedBallotDocument } from "@models/encryptedBallot";

export default class EncryptedBallots extends MongoDataSource<EncryptedBallotDocument> {
    submitBallot(encryptedBallot: string) {
        return this.model.create({
            timestampUTC: Math.floor(new Date().getTime() / 1000),
            encryptedBallot,
        });
    }

    getCount() {
        return this.model.countDocuments();
    }

    getAll() {
        return this.model.find().exec();
    }

    deleteAll() {
        return this.model.deleteMany({});
    }
}
