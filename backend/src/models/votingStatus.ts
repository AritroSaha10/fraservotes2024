import { Document, Schema, model } from 'mongoose';

export interface VotingStatusDocument extends Document {
    studentNumber: number,
    voted: boolean
}

const votingStatusSchema = new Schema<VotingStatusDocument>({
    studentNumber: { type: Number, required: true },
    voted: { type: Boolean, required: true }
});

const VotingStatus = model<VotingStatusDocument>('Voting Status', votingStatusSchema);

export default VotingStatus;
