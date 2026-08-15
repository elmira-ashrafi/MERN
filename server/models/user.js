import mongoose, { Schema } from "mongoose";
import locationSchema from "./schemas/location.js";
import Category from "./category.js";

export const USER_ROLES = ["Requester", "Provider", "Admin"];

const providerSchema = new Schema({
    businessLocation: {type: locationSchema, default: undefined},
    businessCategories: [{type: Schema.Types.ObjectId, ref: "Category"}],
    businessCategoryAncestors: [{type: Schema.Types.ObjectId, ref: "Category"}],
},
{
    _id: false
}
)

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: undefined
    },
    password: {
        type: String,
        required: true,
        // never comes back from a query unless explicitly asked for with .select("+password")
        select: false
    },
    avatar: {
        type: String,
        default: "/images/avatar.webp"
    },
    role: {
        type: [String],
        default: ["Requester"],
        enum: USER_ROLES
    },
    requesterProfile: {
        location: {type: locationSchema, default: undefined}
    },
    providerProfile: {
        type: providerSchema,
        default: undefined
    },
    passwordResetCode: {
        type: String,
        default: '',
        select: false
    },
    passwordResetExpires: {
        type: Date,
        default: undefined,
        select: false
    },
    passwordResetAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    passwordChangedAt: {
        type: Date,
        default: undefined,
        select: false
    }
},
{ timestamps: true }
)

// sparse so the many users without a phone number do not collide on ""/undefined
userSchema.index({phoneNumber: 1}, {unique: true, sparse: true});

userSchema.pre("save", async function () {
  if (!this.providerProfile) return;

  const cats = this.providerProfile.businessCategories || [];

  // remove cache if don't have category
  if (cats.length === 0) {
    this.providerProfile.businessCategoryAncestors = [];
    return;
  }

  // just when changed
  const changed =
    this.isModified("providerProfile.businessCategories") ||
    this.isModified("providerProfile");

  if (!changed) return;

  // set new categories
  const categoryDocs = await Category.find({ _id: { $in: cats }, isActive: true }).select("_id ancestors");
  const set = new Set();

  for (const c of categoryDocs) {
    set.add(String(c._id));
    for (const a of c.ancestors || []) set.add(String(a));
  }

  this.providerProfile.businessCategoryAncestors = Array.from(set).map((id) => new mongoose.Types.ObjectId(id));
});


export default mongoose.model("User", userSchema);
