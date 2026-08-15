import mongoose from "mongoose";
import ProviderApplication from "../../models/providerApplication.js";
import User from "../../models/user.js";
import { paginate, pagedResponse } from "../../utils/pagination.js";

const APPLICATION_STATUSES = ["pending", "approved", "rejected"];

export const listProviderApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (APPLICATION_STATUSES.includes(status)) filter.status = status;

    const { page, skip, limit } = paginate(req);

    const [applications, total] = await Promise.all([
      ProviderApplication.find(filter)
        // oldest first, so the review queue is first in first out
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email phoneNumber role")
        .populate("businessCategories", "name slugPath type")
        .populate("businessLocation.country", "name")
        .populate("businessLocation.province", "name")
        .populate("businessLocation.city", "name")
        .populate("reviewedBy", "name")
        .exec(),
      ProviderApplication.countDocuments(filter).exec(),
    ]);

    return res.status(200).json(pagedResponse(applications, page, total, limit));
  } catch (err) {
    return next(err);
  }
};

/*
 * Approving is what actually turns a Requester into a Provider: it grants the role and copies
 * the claimed location and categories onto the user, whose pre-save hook then denormalises the
 * category ancestors used for archive filtering.
 */
export const setProviderApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "application not found" });
    }

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ ok: false, message: "invalid status" });
    }

    if (status === "rejected" && (typeof adminNote !== "string" || !adminNote.trim())) {
      return res.status(400).json({ ok: false, message: "tell the applicant why it was rejected" });
    }

    const application = await ProviderApplication.findById(id).exec();

    if (!application) {
      return res.status(404).json({ ok: false, message: "application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ ok: false, message: "this application has already been reviewed" });
    }

    const user = await User.findById(application.user).exec();

    if (!user) {
      return res.status(400).json({ ok: false, message: "the applicant no longer exists" });
    }

    if (status === "approved") {
      if (!user.role.includes("Provider")) user.role.push("Provider");

      user.providerProfile = {
        businessLocation: application.businessLocation,
        businessCategories: application.businessCategories,
      };

      await user.save();
    }

    application.status = status;
    application.adminNote = typeof adminNote === "string" ? adminNote.trim() : "";
    application.reviewedBy = req.currentUser._id;
    application.reviewedAt = new Date();

    await application.save();

    return res.status(200).json({ ok: true, message: `application ${status}` });
  } catch (err) {
    return next(err);
  }
};
