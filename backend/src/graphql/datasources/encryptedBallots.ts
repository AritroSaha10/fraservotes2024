import { MongoDataSource } from 'apollo-datasource-mongodb'
import { EncryptedBallotDocument } from "../../models/encryptedBallot";

export default class EncryptedBallots extends MongoDataSource<EncryptedBallotDocument> {
    submitBallot(encryptedBallot: string) {
        return this.model.create({ 
            timestampUTC: Math.floor(new Date().getTime() / 1000),
            encryptedBallot
        });
    }

    getBallotCount() {
        return this.model.countDocuments();
    }

    getEncryptedBallots() {
        return this.model.find().exec();
    }

    deleteBallots() {
        return this.model.deleteMany({});
    }
}