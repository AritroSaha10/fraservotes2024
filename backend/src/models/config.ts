import mongoose, { Document } from "mongoose";

export interface ConfigDocument extends Document {
    isOpen: boolean;
    publicKey: string | null;
}

const configSchema = new mongoose.Schema<ConfigDocument>({
    isOpen: {
        type: Boolean,
        required: true,
        default: false,
    },
    publicKey: {
        type: String,
        required: false,
    },
});

const Config = mongoose.model("Config", configSchema);

export default Config;
