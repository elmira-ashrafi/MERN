import mongoose from "mongoose";
import User from "../../models/user.js";
import { paginate, pagedResponse } from "../../utils/pagination.js";

export const listUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (search && typeof search === "string" && search.trim()) {
      // escaped so a user typing "a.b" cannot turn into a wildcard
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(safe, "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { phoneNumber: pattern }];
    }

    if (role && ["Requester", "Provider", "Admin"].includes(role)) {
      filter.role = role;
    }

    const { page, skip, limit } = paginate(req);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requesterProfile.location.country", "name")
        .populate("requesterProfile.location.province", "name")
        .populate("requesterProfile.location.city", "name")
        .exec(),
      User.countDocuments(filter).exec(),
    ]);

    return res.status(200).json(pagedResponse(users, page, total, limit));
  } catch (err) {
    return next(err);
  }
};

/*
 * Grants or revokes the Provider role. Admin is deliberately not settable here — promoting an
 * admin requires shell access through scripts/makeAdmin.js, never a request.
 */
export const setUserProviderRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isProvider } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: "user not found" });
    }

    const user = await User.findById(id).exec();

    if (!user) {
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    const shouldBeProvider = isProvider === true || isProvider === "true";

    if (shouldBeProvider && !user.role.includes("Provider")) {
      user.role.push("Provider");
    } else if (!shouldBeProvider) {
      user.role = user.role.filter((role) => role !== "Provider");
    }

    await user.save();

    return res.status(200).json({ ok: true, message: `roles updated: ${user.role.join(", ")}` });
  } catch (err) {
    return next(err);
  }
};
