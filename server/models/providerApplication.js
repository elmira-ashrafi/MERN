import mongoose, { Schema } from "mongoose";
import locationSchema from "./schemas/location.js";

const providerApplicationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true, 
            unique: true
        },
        businessLocation: {type: locationSchema, required: true},
        businessCategories: [{type: Schema.Types.ObjectId, ref: "Category"}],
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },
        uploadedDocs: [{
            url: {type: String, required: true, trim: true},
            originalName: {type: String, required: true, trim: true},
            mimeType: {type: String, required: true, trim: true},
            size: {type: Number, required: true},
            uploadedAt: {type: Date, default: Date.now}
        }],
        adminNote: {type: String, default: ""},
        reviewedBy: {type: Schema.Types.ObjectId, ref: "User"},
        reviewedAt: {type: Date}
    },
    {timestamps: true}
)

export default mongoose.model("ProviderApplication", providerApplicationSchema);