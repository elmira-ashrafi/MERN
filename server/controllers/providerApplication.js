import path from "path"
import mongoose from "mongoose"
import ProviderApplication from "../models/providerApplication.js"
import Category from "../models/category.js"
import Country from "../models/country.js"
import Province from "../models/province.js"
import City from "../models/city.js"
import { processProviderDocs } from "../services/upload.service.js"
import { removeFiles, removeDir } from "../utils/fsHelpers.js"
import { uploadRoot, absolutePathFromUploadUrl } from "../config/paths.js"

//form-data sends repeated fields as an array and a single one as a string
function toIdArray(value) {
    if(Array.isArray(value)) return value;
    if(typeof value === "string" && value.trim()) return value.split(",").map(v => v.trim()).filter(Boolean);
    return [];
}

function applicationDocsDir(applicationId) {
    return path.join(uploadRoot, "provider-applications", String(applicationId));
}

export const getMyProviderApplication = async (req, res, next) => {
    try {
        const application = await ProviderApplication.findOne({user: req.auth._id})
            .populate("businessLocation.country", "name")
            .populate("businessLocation.province", "name")
            .populate("businessLocation.city", "name")
            .populate("businessCategories", "name slugPath type")
            .exec();

        return res.status(200).json({ok: true, message: application});
    } catch(err) {
        return next(err);
    }
}

/*
 * Business documents are KYC material, so they are not under the public static mount.
 * They are streamed only to the applicant who uploaded them, or to an admin.
 */
export const getProviderApplicationDoc = async (req, res, next) => {
    try {
        const { fileName } = req.params;
        const notFound = () => res.status(404).json({ok: false, message: "not found"});

        if(!/^doc-[a-f0-9]{24}\.(webp|pdf)$/.test(fileName)) return notFound();

        const isAdmin = req.currentUser.role.includes("Admin");
        const { applicationId } = req.query;

        const query = isAdmin && mongoose.isValidObjectId(applicationId)
            ? {_id: applicationId}
            : {user: req.auth._id};

        const application = await ProviderApplication.findOne(query).exec();
        if(!application) return notFound();

        // the name has to belong to this application, not just look well formed
        const doc = (application.uploadedDocs || []).find(uploaded => path.basename(uploaded.url) === fileName);
        if(!doc) return notFound();

        const absolutePath = absolutePathFromUploadUrl(doc.url);
        if(!absolutePath) return notFound();

        res.type(doc.mimeType);
        return res.sendFile(absolutePath);

    } catch(err) {
        return next(err);
    }
}

export const submitProviderApplication = async (req, res, next) => {
    try {
        const {userCountry, userProvince, userCity} = req.body;
        const businessCategories = toIdArray(req.body.businessCategories);
        const files = req.files || [];

        for(const value of [userCountry, userProvince, userCity]) {
            if(!mongoose.isValidObjectId(value)) {
                return res.status(400).json({ok: false, message: "invalid location"});
            }
        }

        if(!businessCategories.length) {
            return res.status(400).json({ok: false, message: "select at least one field"});
        }

        if(businessCategories.some(id => !mongoose.isValidObjectId(id))) {
            return res.status(400).json({ok: false, message: "invalid field"});
        }

        if(!files.length) {
            return res.status(400).json({ok: false, message: "upload at least one business document"});
        }

        const existing = await ProviderApplication.findOne({user: req.auth._id}).exec();

        if(existing && existing.status === "pending") {
            return res.status(400).json({ok: false, message: "your application is already being reviewed"});
        }

        if(existing && existing.status === "approved") {
            return res.status(400).json({ok: false, message: "you are already a provider"});
        }

        // location hierarchy has to hold, the ids come straight from the client
        const city = await City.findOne({_id: userCity, province: userProvince, isActive: true}).exec();
        if(!city) return res.status(400).json({ok: false, message: "city not found"});

        const province = await Province.findOne({_id: userProvince, country: userCountry, isActive: true}).exec();
        if(!province) return res.status(400).json({ok: false, message: "province not found"});

        const country = await Country.findOne({_id: userCountry, isActive: true}).exec();
        if(!country) return res.status(400).json({ok: false, message: "country not found"});

        const categoryCount = await Category.countDocuments({_id: {$in: businessCategories}, isActive: true}).exec();
        if(categoryCount !== businessCategories.length) {
            return res.status(400).json({ok: false, message: "invalid field"});
        }

        // reuse the row so the one-application-per-user index still holds on a re-application
        const applicationId = existing?._id || new mongoose.Types.ObjectId();

        // nothing is written to disk until every field above has been accepted
        const {businessDocs} = await processProviderDocs({files, applicationId});

        try {
            const previousDocs = existing?.uploadedDocs || [];

            await ProviderApplication.findOneAndUpdate(
                {_id: applicationId},
                {
                    $set: {
                        user: req.auth._id,
                        businessLocation: {country: userCountry, province: userProvince, city: userCity},
                        // the admin turns these into a provider profile on approval
                        businessCategories,
                        status: "pending",
                        uploadedDocs: businessDocs,
                        adminNote: ""
                    },
                    $unset: {reviewedBy: 1, reviewedAt: 1}
                },
                {upsert: true, new: true, setDefaultsOnInsert: true}
            ).exec();

            // the superseded documents of a previous attempt are no longer referenced
            await removeFiles(previousDocs.map(doc => absolutePathFromUploadUrl(doc.url)).filter(Boolean));

            return res.status(201).json({ok: true, message: "your application has been submitted for review"});

        } catch(err) {
            // the row never landed, so the documents it referenced must not survive either
            if(!existing) await removeDir(applicationDocsDir(applicationId));
            throw err;
        }

    } catch(err) {
        return next(err);
    }
}
