import { Document, Schema, model } from 'mongoose';

// Position interface
interface PositionDocument extends Document {
    name: string;
    spotsAvailable: number;
}

// Position Schema
const positionSchema = new Schema<PositionDocument>({
    name: { type: String, required: true },
    spotsAvailable: { type: Number, required: true }
});

// Position Model
const Position = model<PositionDocument>('Position', positionSchema);

export default Position;
