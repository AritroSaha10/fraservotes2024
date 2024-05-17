import { Document, Schema, model, ObjectId } from 'mongoose';

// ResultCandidate interface
export interface ResultCandidateDocument extends Document {
    candidate: ObjectId;
    votes: number;
}

// ResultPosition interface
export interface ResultPositionDocument extends Document {
    position: ObjectId;
    candidates: ResultCandidateDocument[];
}

// Results interface
export interface ResultsDocument extends Document {
    positions: ResultPositionDocument[];
    timestamp: number;
}

// ResultCandidate Schema
const resultCandidateSchema = new Schema<ResultCandidateDocument>({
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    votes: { type: Number, required: true, default: 0 }
}, { _id: false });

// ResultPosition Schema
const resultPositionSchema = new Schema<ResultPositionDocument>({
    position: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
    candidates: [resultCandidateSchema]
}, { _id: false });

// Results Schema
const resultsSchema = new Schema<ResultsDocument>({
    positions: [resultPositionSchema],
    timestamp: { type: Number, required: true }
});

// Results Model
const Results = model<ResultsDocument>('Results', resultsSchema);

export default Results;
