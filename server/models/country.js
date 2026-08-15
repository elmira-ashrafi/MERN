import mongoose, { Schema } from "mongoose";

const countrySchema = new Schema(
    {
        name: {type: String, required: true, trim: true},
        code: {type: String, required: true, trim: true, uppercase: true},
        isActive: {type: Boolean, default: true},
        order: {type: Number, default: 0}
    },
    {timestamps: true}
)

countrySchema.index({code: 1}, {unique: true});
countrySchema.index({name: 1}, {unique: true});

export default mongoose.model('Country', countrySchema);