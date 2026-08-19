import mongoose, { mongo } from "mongoose";
import Request from "../models/request.js";
import Proposal from "../models/proposal.js";
import { postImagesDir, processPostImages } from "../services/upload.service.js";
import { seprateImages } from "../utils/imageValidation.js";
import { removeDir, removeFiles } from "../utils/fsHelpers.js";
import { absolutePathFromUploadUrl } from "../config/paths.js";

const PROPOSAL_CONTENT_MAX_LENGTH = 1000

function validateText(content) {
  if(typeof content !== "string" || !content.trim()) return "proposal content is required"
  if(content.length > PROPOSAL_CONTENT_MAX_LENGTH) return `proposal content must be less than ${PROPOSAL_CONTENT_MAX_LENGTH} character`
  return null;
}

async function removeProposalFiles(images, proposalId, partial = false) {
  const paths = (images || []).map(img => absolutePathFromUploadUrl(img.url)).filter(Boolean);

  await removeFiles(paths);
  if(!partial) await removeDir(postImagesDir('proposal', proposalId));
}

export const createtProposal = async (req, res, next) => {
  try {
    const { requestId, proposalContent, proposalPrice: price, provider } = req.body

    const contentError = validateText(proposalContent)
    if(contentError) return res.status(400).json({ok: false, message: contentError})
      
    const proposalImagesFiles = req.files || [];

    const {imageDocs} = await processPostImages({files: proposalImagesFiles, postId: req.proposalId, postType: 'proposal'});

    if(!mongoose.isValidObjectId(requestId)) return res.status(400).json({ok: false, message: "invalid request"})

    const requestExists = await Request.findOne({_id: requestId, provider}).exec()

    if(requestExists) return res.status(400).json({ok: false, message: 'you have submited proposal on this request'});

    const request = await Request.findOne({_id: requestId}).exec()

    if(!request) return res.status(404).json({ok: false, message: 'request not found'})

    if(String(request.requester) === String(provider)) return res.status(400).json({ok: false, message: "you can't submit proposal on your own requests"});

    const proposal = await new Proposal({
      _id: req.proposalId,
      provider,
      proposalContent,
      price,
      proposalImages: imageDocs,
      request: requestId,
      status: 'pending'
    }).save()

    await Request.updateOne({_id: requestId}, {$inc: {proposalCount: 1}}).exec()

    return res.status(201).json({ok: true, message: proposal._id});

  } catch(err) {
    if(err?.code === 11000) {
      return res.status(400).json({ok: false, message: "same proposal on same request exists"})
    }
    next(err)
  }
}

export const getProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params

    if(!mongoose.isValidObjectId(proposalId)) return res.status(400).json({ok: true, message: "invalid proposal"})

    const proposal = await Proposal.findOne({_id: proposalId}).populate('request', 'title requester acceptedProposal').exec()

    if(!proposal) return res.status(404).json({ok: true, message: "proposal not found"});

    if(!proposal.provider.equals(req.currentUser._id) && !proposal.request.requester.equals(req.currentUser._id)) {
      return res.status(400).json({ok: false, message: "ineligible access"});
    }

    return res.status(200).json({ok: true, message: proposal})
  } catch(err) {
    next(err)
  }
}

export const getAllProposals = async (req, res, next) => {
  try {
    
    const {_id} = req.currentUser

    const userProposals = await Proposal.find({provider: _id}).sort({createdAt: -1}).exec()

    return res.status(200).json({ok: true, message: userProposals});

  } catch(err) {
    next(err)
  }
}

export const editProposal = async (req, res, next) => {
  try{  
    const {proposalContent, proposalPrice: price, provider, existingImages} = req.body
    const {proposalId: _id} = req.params

    const contentError = validateText(proposalContent)
    if(contentError) return res.status(400).json({ok: false, message: contentError})

    if(!mongoose.isValidObjectId(_id)) return res.status(400).json({ok: false, message: "invalid proposal"})

    const proposal = await Proposal.findOne({_id, provider: req.currentUser._id}).exec()

    if(!proposal) return res.status(404).json({ok: false, message:"proposal not found"})

    const {keepingImages, removingImages} = seprateImages(existingImages, proposal.proposalImages)

    const {imageDocs} = await processPostImages({files: req.files, postId: _id, postType: "proposal"})

    const proposalImages = [...keepingImages, ...imageDocs]

    await Proposal.updateOne({_id}, {proposalContent, price, proposalImages})

    await removeProposalFiles(removingImages, _id, true);

    return res.status(200).json({ok: true, message: proposal._id})

  } catch(err) {
    next(err)
  }
}

export const deleteProposal = async (req, res, next) => {
  try {
    
    const {_id} = req.body

    if(!mongoose.isValidObjectId(_id)) return res.status(400).json({ok: false, message: 'invalid proposal'})

    const proposal = await Proposal.findOne({_id, provider: req.currentUser._id}).exec()

    if(!proposal) return res.status(404).json({ok: false, message: "proposal not found"})

    const isActiveProposal = await Request.findOne({acceptedProposal: _id}).exec()

    if(isActiveProposal) return res.status(400).json({ok: false, message: "your proposal is active on a reuqest. please finish that first!"});

    await Proposal.deleteOne({_id}).exec()

    await removeProposalFiles(proposal.proposalImages, _id);

    const linkedReuqest = await Request.findOneAndUpdate({_id: proposal.request}, {$inc: {proposalCount: -1}})

    return res.status(200).json({ok: true, message: "proposal deleted successfully"});

  } catch(err) {
    next(err)
  }
}

export const acceptProposal = async (req, res, next) => {
  try {
    const {proposal, request} = req.body

    if(!mongoose.isValidObjectId(proposal) || !mongoose.isValidObjectId(request)) {
      return res.status(400).json({ok: false, message: "invalid data"});
    }

    const currentProposal = await Proposal.exists({_id: proposal, request}).exec();

    if(!currentProposal) return res.status(400).json({ok: false, message: "invalid proposal"})

    await Request.updateOne({_id: request}, {acceptedProposal: proposal, status: "assigned"}).exec();
    await Proposal.updateOne({_id: proposal, request}, {status: "accepted"}).exec();

    return res.status(200).json({ok: true, message: "proposal accepted successfully"});

  } catch(err) {
    next(err)
  }
}