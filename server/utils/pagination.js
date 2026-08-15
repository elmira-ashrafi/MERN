const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

//reads ?page and ?limit off a request, clamped so a caller cannot ask for the whole collection
export function paginate(req, defaultLimit = DEFAULT_PAGE_SIZE) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const requested = parseInt(req.query.limit, 10) || defaultLimit;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));

    return { page, limit, skip: (page - 1) * limit };
}

// `message` stays the array so the shared handleFetch on the client keeps working
export function pagedResponse(rows, page, total, limit = DEFAULT_PAGE_SIZE) {
    return {
        ok: true,
        message: rows,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        total
    };
}
