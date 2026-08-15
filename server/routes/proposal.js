import express from "express"
import multer from "multer"
import { requireAuth } from "../controllers/auth.js"
import { createtProposal, getProposal, getAllProposals, editProposal, deleteProposal, acceptProposal } from "../controllers/proposal.js"
import { ALLOWED_IMAGE_MIMES } from "../utils/fileValidations.js"
import AppError from "../utils/appError.js"
import { postImageUploadMiddleware } from "../services/upload.service.js"
import mongoose from "mongoose"

const error = "only jpg, png and webp images are allowed"

const router = express.Router();

router.post(
  '/submit-proposal',
  (req, res, next)=> {
    req.proposalId = new mongoose.Types.ObjectId()
    next()
  },
  postImageUploadMiddleware('proposalImages'), 
  requireAuth, 
  createtProposal
);
router.post('/delete-proposal', requireAuth, deleteProposal);
router.get('/get-proposal/:proposalId', requireAuth, getProposal);
router.get('/my-proposals/', requireAuth, getAllProposals);
router.patch('/edit-proposal/:proposalId', postImageUploadMiddleware('proposalImages'), requireAuth, editProposal);
router.post('/accept-proposal', requireAuth, acceptProposal);

export default router