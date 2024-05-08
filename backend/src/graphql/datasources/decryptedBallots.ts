import { MongoDataSource } from 'apollo-datasource-mongodb'
import { DecryptedBallotDocument, SelectedOption } from '../../models/decryptedBallot';

export default class DecryptedBallots extends MongoDataSource<DecryptedBallotDocument> {
    addDecryptedBallot(timestampUTC: number, selectedChoices: SelectedOption[]) {
        return this.model.create({ 
            timestampUTC,
            selectedOptions: selectedChoices
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