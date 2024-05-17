import { MongoDataSource } from 'apollo-datasource-mongodb'
import { DecryptedBallotDocument, SelectedOption } from '../../models/decryptedBallot';
import { ObjectId } from 'mongodb';

export default class DecryptedBallots extends MongoDataSource<DecryptedBallotDocument> {
    addDecryptedBallot(encryptedBallotId: ObjectId, selectedChoices: SelectedOption[]) {
        return this.model.create({ 
            encryptedBallotId,
            selectedOptions: selectedChoices
        });
    }

    addOrUpdateDecryptedBallot(encryptedBallotId: ObjectId, selectedOptions: SelectedOption[]) {
        return this.model.findOneAndUpdate(
            { encryptedBallotId },
            { selectedOptions },
            { new: true, upsert: true }
        )
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