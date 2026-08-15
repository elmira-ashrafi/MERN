import mongoose, { Schema } from "mongoose";

const provinceSchema = new Schema(
    {
        country: {type: Schema.Types.ObjectId, ref: "Country", required: true, index: true},
        name: {type: String, required: true, trim: true},
        code: {type: String, required: true, trim: true, uppercase: true},
        isActive: {type: Boolean, default: true},
        order: {type: Number, default: 0}
    },
    {timestamps: true}
)

provinceSchema.index({name: 1, country: 1}, {unique: true});
provinceSchema.index({code: 1, country: 1}, {unique: true});

export default mongoose.model('Province', provinceSchema);