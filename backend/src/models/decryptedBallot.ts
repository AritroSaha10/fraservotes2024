import { Document, ObjectId, Schema, model } from 'mongoose';

// Ballot interface
export interface SelectedOption {
    position: ObjectId;
    candidates: ObjectId[];
}

export interface DecryptedBallotDocument extends Document {
    timestampUTC: number;
    selectedOptions: SelectedOption[];
}

// Ballot Schema
const selectedOptionSchema = new Schema<SelectedOption>({
    position: { type: Schema.ObjectId, ref: "Position", required: true },
    candidates: [{ type: Schema.ObjectId, ref: "Candidate", required: true }],
}, { _id : false })

const decryptedBallotSchema = new Schema<DecryptedBallotDocument>({
    timestampUTC: { type: Number, required: true },
    selectedOptions: {type: [selectedOptionSchema], required: true },
});

// Encrypted Ballot Model
const DecryptedBallot = model<DecryptedBallotDocument>('Decrypted Ballot', decryptedBallotSchema);

export default DecryptedBallot;
