import mongoose, { Schema } from "mongoose";
import locationSchema from "./schemas/location.js";
import category from "./category.js";

const requestSchema = new Schema(
    {
        requester: {type: Schema.Types.ObjectId, ref: "User", required: true, index: true},
        title: {type: String, required: true, trim: true},
        description: {type: String, default: ''},
        location: {type: locationSchema, required: true},
        locationSource: {type: String, enum: ["default", "custom"], default: "default"},
        requestImages: {
            type: [
                {
                    url: {type: String, required: true, trim: true},
                    alt: {type: String, trim: true}
                }
            ], 
            validate: {
                validator: v => !v || v.length <= 5, 
                message: "maximum 5 images allowed"
            }, 
            default: []
        },
        adminStatus: {type: String, enum: ['pending', 'approved', 'rejected'], default: "pending", required: true, index: true},
        adminNote: {type: String, default: undefined},
        status: {type: String, enum: ["open", "assigned", "close"], default: "open", index: true },
        proposalCount: {type: Number, default: 0, min: 0},
        category: {type: Schema.Types.ObjectId, ref: "Category", required: true, index: true},
        
        //quick access
        acceptedProposal: {type: Schema.Types.ObjectId, ref: "Proposal", default: undefined},
        categoryType: {type: String, enum: ['product', 'service'], required: true, index: true},
        categoryAncestors: [{type: Schema.Types.ObjectId, ref: "Category", index: true}],
        categorySlugPath: {type: String, required: true, index: true}
    },
    {timestamps: true}
)

//filters searched mostly from user profile
requestSchema.index({requester: 1, category: 1, status: 1, createdAt: -1});
requestSchema.index({requester: 1, status: 1, createdAt: -1});

//filters searched from archive requests
requestSchema.index({category: 1, status: 1, "location.city": 1, createdAt: -1});
requestSchema.index({category: 1, "location.city": 1, createdAt: -1});
requestSchema.index({status: 1, "location.city": 1, createdAt: -1});

export default mongoose.model("Request", requestSchema)