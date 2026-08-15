import Proposal from "../../models/proposal.js";
import { paginate, pagedResponse } from "../../utils/pagination.js";

const PROPOSAL_STATUSES = ["pending", "accepted", "rejected", "withdrawn"];

/*
 * Read only. Nothing in the app creates a proposal yet — providers submitting them is not
 * built — so this list is empty until that feature lands.
 */
export const listProposals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (PROPOSAL_STATUSES.includes(status)) filter.status = status;

    const { page, skip, limit } = paginate(req);

    const [proposals, total] = await Promise.all([
      Proposal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("provider", "name email")
        .populate("request", "title")
        .exec(),
      Proposal.countDocuments(filter).exec(),
    ]);

    return res.status(200).json(pagedResponse(proposals, page, total, limit));
  } catch (err) {
    return next(err);
  }
};
