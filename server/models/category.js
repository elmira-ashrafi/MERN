import mongoose, { Schema } from "mongoose"

const categorySchema = new Schema({
    name: {type: String, required: true, trim: true},
    type: {type: String, enum: ["product", "service"], required: true},
    slug: {type: String, trim: true},
    slugPath: {type: String, index: true, unique: true},
    parent: {type: Schema.Types.ObjectId, ref: "Category", default: null, index: true},
    ancestors: [{type: Schema.Types.ObjectId, ref: "Category", index: true}],
    isActive: {type: Boolean, default: true, index: true}
},
{timestamps: true}
);

function toSlug(s) {
    return String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\/]+/g, '')
    .replace(/\-\-+/g, "-")
}

categorySchema.pre("validate", async function () {
    // fall back to the name so a category can be created without an explicit slug
    this.slug = toSlug(this.slug || this.name);

    if(!this.parent) {
        this.ancestors = [];
        this.slugPath = `${this.type}/${this.slug}`
        return;
    }

    // the model is registered as "Category" — mongoose model names are case sensitive
    const parent = await mongoose.model('Category').findById(this.parent).select("slugPath ancestors type");

    if(!parent) throw new Error("parent category not found");
    if(this.type !== parent.type) throw new Error("category type should match parent type");

    this.ancestors = [...(parent.ancestors || []), parent._id];
    this.slugPath = `${parent.slugPath}/${this.slug}`
})

categorySchema.index({type: 1, slugPath: 1}, {unique: true});

export default mongoose.model('Category', categorySchema);
