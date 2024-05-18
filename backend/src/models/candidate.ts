import { Document, Schema, model } from 'mongoose';
import type { ObjectId } from 'mongoose';

// Candidate interface
export interface CandidateDocument extends Document {
    fullName: string
    position: ObjectId
    biography: string
    grade: number
    picture: string
    campaignVideo: string
}

// Candidate Schema
const candidateSchema = new Schema<CandidateDocument>({
    fullName: { type: String, required: true },
    position: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    biography: { type: String, required: true },
    grade: { type: Number, required: true },
    picture: { type: String, required: true },
    campaignVideo: { type: String, required: true },
});

// Candidate Model
const Candidate = model<CandidateDocument>('Candidate', candidateSchema);

export default Candidate;
