import mongoose from "mongoose"
import Request from "../models/request.js"
import Category from "../models/category.js"
import Country from "../models/country.js"
import Province from "../models/province.js"
import City from "../models/city.js"
import Proposal from "../models/proposal.js"
import { processPostImages, postImagesDir } from "../services/upload.service.js"
import { removeFiles, removeDir } from "../utils/fsHelpers.js"
import { absolutePathFromUploadUrl } from "../config/paths.js"
import { seprateImages } from "../utils/imageValidation.js"

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const ARCHIVE_PAGE_SIZE = 20;

/*
 * Resolves the three location ids into a stored location, verifying that city belongs to
 * province and province belongs to country. Returns an AppError-shaped message on failure.
 */
async function resolveLocation({locationSource, userCountry, userProvince, userCity, profileLocation}) {

    for(const value of [userCountry, userProvince, userCity]) {
        if(!mongoose.isValidObjectId(value)) {
          return {error: "invalid location"};
        }
    }

    if(locationSource === 'default') {
        if(!profileLocation) return {error: "submit your location first"};

        const { country, province, city } = profileLocation;

        if(!country.equals(userCountry) || !province.equals(userProvince) || !city.equals(userCity)) {
            return {error: "location mismatch"};
        }

        return {location: profileLocation};
    }

    if(locationSource !== 'custom') return {error: "invalid location"};

    // a custom location is attacker supplied, so the hierarchy has to be checked against the db
    const city = await City.findOne({_id: userCity, province: userProvince, isActive: true}).exec();
    if(!city) return {error: "city not found"};

    const province = await Province.findOne({_id: userProvince, country: userCountry, isActive: true}).exec();
    if(!province) return {error: "province not found"};

    const country = await Country.findOne({_id: userCountry, isActive: true}).exec();
    if(!country) return {error: "country not found"};

    return {location: {country: userCountry, province: userProvince, city: userCity}};
}

function validateText({title, description}) {
    if(typeof title !== "string" || !title.trim()) return "title is required";
    if(title.trim().length > MAX_TITLE_LENGTH) return `title must be at most ${MAX_TITLE_LENGTH} characters`;
    if(description && String(description).length > MAX_DESCRIPTION_LENGTH) {
        return `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
    }
    return null;
}

async function removeRequestFiles(requestImages, requestId, partial = false) {
  const paths = (requestImages || []).map(img => absolutePathFromUploadUrl(img.url)).filter(Boolean);

  await removeFiles(paths);
  if(!partial) await removeDir(postImagesDir('request', requestId));
}

export const getCats = async (req, res, next) => {
    try {
        const categories = await Category.find({isActive: true}).sort({slugPath: 1}).exec()

        return res.status(200).json({ok: true, message: categories});
    } catch(err) {
        return next(err);
    }
}

export const createRequest = async (req, res, next) => {

    const files = req.files || [];

    try {
        const {requestTitle: title, requestDesc: description, requestLocationSource: locationSource, requestCountry, requestProvince, requestCity, category} = req.body

        const textError = validateText({title, description});
        if(textError) return res.status(400).json({ok: false, message: textError});

        if(!mongoose.isValidObjectId(category)) {
            return res.status(400).json({ok: false, message: "invalid category"});
        }

        const currentUser = req.currentUser;

        const {location, error} = await resolveLocation({
            locationSource,
            userCountry: requestCountry,
            userProvince: requestProvince,
            userCity: requestCity,
            profileLocation: currentUser.requesterProfile?.location
        });

        if(error) return res.status(400).json({ok: false, message: error});

        const userCategory = await Category.findOne({_id: category, isActive: true}).exec();

        if(!userCategory) {
            return res.status(400).json({ok: false, message: "invalid category"});
        }

        // nothing is written to disk until every field above has been accepted
        const {imageDocs} = await processPostImages({files, postId: req.requestId, postType: 'request'});

        try {
            // the document id has to match the directory the images were written into
            const request = await new Request({
                _id: req.requestId,
                requester: currentUser._id,
                title: title.trim(),
                description,
                location,
                locationSource,
                requestImages: imageDocs,
                adminStatus: "pending",
                status: "open",
                category,
                categoryType: userCategory.type,
                categoryAncestors: userCategory.ancestors,
                categorySlugPath: userCategory.slugPath
            }).save()

            return res.status(201).json({ok: true, message: request._id});

        } catch(err) {
            // the row never landed, so the images it referenced must not survive either
            await removeDir(postImagesDir('request', req.requestId));
            throw err;
        }

    } catch(err) {
        return next(err);
    }
}

export const getUserRequests = async (req, res, next) => {
    try {
        const requests = await Request.find({requester: req.auth._id}).sort({createdAt: -1}).exec()

        return res.status(200).json({ok: true, message: requests});

    } catch (err){
        return next(err);
    }
}

export const deleteReuqest = async (req, res, next) => {
  try {
    const {_id} = req.body

    if(!mongoose.isValidObjectId(_id)) {
      return res.status(400).json({ok: false, message: "request not found"})
    }

    const request = await Request.findOne({_id, requester: req.auth._id}).exec();

    if(!request) {
      return res.status(404).json({ok: false, message: "request not found"})
    }

    await Request.deleteOne({_id: request._id}).exec();

    await removeRequestFiles(request.requestImages, _id);

    return res.status(200).json({ok: true, message: 'request deleted successfully!'});

  } catch(err) {
    return next(err);
  }
}

export const editRequest = async (req, res, next) => {
    try {
      const { id: _id } = req.params;
      const files = req.files || [];
      const {requestTitle: title, requestDesc: description, category, requestLocationSource, requestCountry, requestProvince, requestCity, existingImages} = req.body

      if(!mongoose.isValidObjectId(_id)) {
        return res.status(400).json({ok: false, message: "invalid reuqest"});
      }

      const textError = validateText({title, description});
      if(textError) return res.status(400).json({ok: false, message: textError});

      if(!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ok: false, message: "invalid category"});
      }

      const currentUser = req.currentUser

      const {location, error} = resolveLocation({
        locationSource: requestLocationSource, 
        userCountry: requestCountry,
        userProvince: requestProvince,
        userCity: requestCity,
        profileLocation: currentUser.requesterProfile?.location
      })

      if(error) return res.status(400).json({ok: false, message: error});

      const {imageDocs} = await processPostImages({files, postId: _id, postType: 'request'});

      const request = await Request.findOne({_id, requester: currentUser._id}).exec();

      if(!request) {
        return res.status(404).json({ok: false, message: "request not found"});
      }

      const {keepingImages, removingImages} = seprateImages(existingImages, request.requestImages)
      
      const requestImages = [...keepingImages, ...imageDocs]

      const userCategory = await Category.findOne({_id: category, isActive: true}).exec();

      if(!userCategory) {
        return res.status(400).json({ok: false, message: "invalid category"});
      }

      await Request.updateOne(
        {_id}, 
        {
          title, 
          description,
          requestImages,
          category: userCategory._id, 
          categoryType: userCategory.type,
          categoryAncestors: userCategory.ancestors,
          categorySlugPath: userCategory.slugPath,
          adminStatus: "pending"
        })

        await removeRequestFiles(removingImages, _id, true);

      return res.status(200).json({ok: true, message: request._id});

    } catch(err) {
      console.log(err)
      return next(err);
    }
}

export const getReuqest = async (req, res, next) => {
    try {
        const { id } = req.params

        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ok: false, message: "invalid request"});
        }

        const currentRequest = await Request.findById(id)
            .populate("location.country", "name")
            .populate("location.province", "name")
            .populate("location.city", "name")
            .populate("category", 'name type')
            .exec()

        if(!currentRequest) {
            return res.status(404).json({ok: false, message: "request not found"});
        }

        const isOwner = String(currentRequest.requester) === String(req.auth?._id);

        if(!isOwner && currentRequest.adminStatus !== "approved") {
            return res.status(404).json({ok: false, message: "request not found"});
        }

        const requestResponse = currentRequest.toObject();

        if(isOwner && currentRequest.adminStatus === 'approved' && currentRequest.proposalCount > 0) {
          requestResponse.submitedProposals = await Proposal.find({request: id}).populate('provider', 'name avatar providerProfile.businessLocation').exec();
        }

        return res.status(200).json({ok: true, message: requestResponse})

    } catch (err) {
        return next(err);
    }
}

export const getAllRequests = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const { category, city, categoryType } = req.query;

        // the public archive only ever exposes approved, still-open requests
        const filter = {adminStatus: "approved", status: "open"};

        if(category && mongoose.isValidObjectId(category)) filter.categoryAncestors = category;
        if(city && mongoose.isValidObjectId(city)) filter["location.city"] = city;
        if(categoryType === "product" || categoryType === "service") filter.categoryType = categoryType;

        const [requests, total] = await Promise.all([
            Request.find(filter)
                .sort({createdAt: -1})
                .skip((page - 1) * ARCHIVE_PAGE_SIZE)
                .limit(ARCHIVE_PAGE_SIZE)
                .populate("location.city", "name")
                .select("title description requester requestImages categorySlugPath categoryType proposalCount location createdAt")
                .exec(),
            Request.countDocuments(filter).exec()
        ]);

        return res.status(200).json({
            ok: true,
            message: requests,
            page,
            pages: Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE)),
            total
        });

    } catch(err) {
        return next(err);
    }
}
