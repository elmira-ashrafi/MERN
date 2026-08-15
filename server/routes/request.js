import express from "express"
import mongoose from "mongoose";
import {
    getCats,
    createRequest,
    getUserRequests,
    editRequest,
    deleteReuqest,
    getReuqest,
    getAllRequests
} from "../controllers/request.js"
import { requireAuth, optionalSigning } from "../controllers/auth.js";
import { postImageUploadMiddleware } from "../services/upload.service.js";

const router = express.Router();

router.get('/get-cats', getCats);

router.post(
  '/create-request',
  requireAuth,
  (req, res, next) => {
    req.requestId = new mongoose.Types.ObjectId();
    next();
  },
  postImageUploadMiddleware('requestImages'),
  createRequest
);

router.get('/my-requests', requireAuth, getUserRequests);
router.patch('/edit-request/:id', requireAuth, postImageUploadMiddleware('requestImages'), editRequest);
router.post('/delete-request', requireAuth, deleteReuqest);

router.get('/get-requests', getAllRequests);
router.get('/get-request/:id', optionalSigning, getReuqest);

export default router
