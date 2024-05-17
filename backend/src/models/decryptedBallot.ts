import { Document, ObjectId, Schema, model } from 'mongoose';

// Ballot interface
export interface SelectedOption {
    position: ObjectId;
    candidates: ObjectId[];
}

export interface DecryptedBallotDocument extends Document {
    encryptedBallotId: ObjectId;
    selectedOptions: SelectedOption[];
}

// Ballot Schema
const selectedOptionSchema = new Schema<SelectedOption>({
    position: { type: Schema.ObjectId, ref: "Position", required: true },
    candidates: [{ type: Schema.ObjectId, ref: "Candidate", required: true }],
}, { _id : false })

const decryptedBallotSchema = new Schema<DecryptedBallotDocument>({
    encryptedBallotId: { type: Schema.ObjectId, ref: "Encrypted Ballot", required: true },
    selectedOptions: {type: [selectedOptionSchema], required: true },
});

// Encrypted Ballot Model
const DecryptedBallot = model<DecryptedBallotDocument>('Decrypted Ballot', decryptedBallotSchema);

export default DecryptedBallot;
