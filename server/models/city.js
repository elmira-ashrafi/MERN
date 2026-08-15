import mongoose, { Schema } from "mongoose";

const citySchema = new Schema(
    {
        province: {type: Schema.Types.ObjectId, ref: "Province", required: true, index: true},
        name: {type: String, required: true, trim: true},
        code: {type: String, required: true, trim: true, uppercase: true},
        isActive: {type: Boolean, default: true},
        order: {type: Number, default: 0}
    },
    {timestamps: true}
)

citySchema.index({name: 1, province: 1}, {unique: true});
citySchema.index({code: 1, province: 1}, {unique: true});

export default mongoose.model('City', citySchema);