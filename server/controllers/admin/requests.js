import mongoose from "mongoose";
import Request from "../../models/request.js";
import { paginate, pagedResponse } from "../../utils/pagination.js";

const ADMIN_STATUSES = ["pending", "approved", "rejected"];

export const listRequests = async (req, res, next) => {
  try {
    const { adminStatus, status } = req.query;
    const filter = {};

    if (ADMIN_STATUSES.includes(adminStatus)) filter.adminStatus = adminStatus;
    if (["open", "assigned", "close"].includes(status)) filter.status = status;

    const { page, skip, limit } = paginate(req);

    const [requests, total] = await Promise.all([
      Request.find(filter)
        // pending first, then oldest first: the moderation queue reads top to bottom
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("requester", "name email")
        .populate("location.country", "name")
        .populate("location.province", "name")
        .populate("location.city", "name")
        .exec(),
      Request.countDocuments(filter).exec(),
    ]);

    return res.status(200).json(pagedResponse(requests, page, total, limit));
  } catch (err) {
    return next(err);
  }
};

export const countRequestsByStatus = async (req, res, next) => {
  try {
    const rows = await Request.aggregate([{ $group: { _id: "$adminStatus", count: { $sum: 1 } } }]);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const row of rows) {
      if (row._id in counts) counts[row._id] = row.count;
    }

    return res.status(200).json({ ok: true, message: counts });
  } catch (err) {
    return next(err);
  }
};

/*
 * The only thing that can move a request off "pending". Without it every submitted request
 * stays invisible, because the public archive only lists approved ones.
 */
export const setRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminStatus, adminNote } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "request not found" });
    }

    if (!ADMIN_STATUSES.includes(adminStatus)) {
      return res.status(400).json({ ok: false, message: "invalid status" });
    }

    if (adminStatus === "rejected" && (typeof adminNote !== "string" || !adminNote.trim())) {
      return res.status(400).json({ ok: false, message: "tell the requester why it was rejected" });
    }

    const request = await Request.findById(id).exec();

    if (!request) {
      return res.status(404).json({ ok: false, message: "request not found" });
    }

    request.adminStatus = adminStatus;
    request.adminNote = typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined;

    await request.save();

    return res.status(200).json({ ok: true, message: `request ${adminStatus}` });
  } catch (err) {
    return next(err);
  }
};