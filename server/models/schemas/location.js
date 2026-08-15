import{Schema} from "mongoose";

const locationSchema = new Schema(
    {
        country: {type: Schema.Types.ObjectId, ref: "Country", required: true},
        province: {type: Schema.Types.ObjectId, ref: "Province", required: true},
        city: {type: Schema.Types.ObjectId, ref: "City", required: true}
    },
    {_id: false}
)

export default locationSchema