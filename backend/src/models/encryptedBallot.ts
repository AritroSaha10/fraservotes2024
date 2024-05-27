import { Document, Schema, model } from "mongoose";

// Ballot interface
export interface EncryptedBallotDocument extends Document {
    timestampUTC: number;
    encryptedBallot: string;
}

// Ballot Schema
const encryptedBallotSchema = new Schema<EncryptedBallotDocument>({
    timestampUTC: { type: Number, required: true },
    encryptedBallot: { type: String, required: true },
});

// Encrypted Ballot Model
const EncryptedBallot = model<EncryptedBallotDocument>("Encrypted Ballot", encryptedBallotSchema);

export default EncryptedBallot;
