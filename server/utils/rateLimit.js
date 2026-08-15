import AppError from "./appError.js"

/*
 * Small in-process fixed-window limiter. Enough to stop a single client hammering the
 * expensive endpoints (bcrypt, SMTP); a multi-instance deployment needs a shared store.
 */
export function rateLimit({windowMs, max, keyGenerator = req => req.ip, message = "too many requests. please try again later"}) {

    const hits = new Map();

    function sweep(now) {
        for(const [key, entry] of hits) {
            if(entry.expiresAt <= now) hits.delete(key);
        }
    }

    return (req, res, next) => {
        const now = Date.now();

        // keep the map from growing without bound on a long running process
        if(hits.size > 5000) sweep(now);

        const key = String(keyGenerator(req));
        const entry = hits.get(key);

        if(!entry || entry.expiresAt <= now) {
            hits.set(key, {count: 1, expiresAt: now + windowMs});
            return next();
        }

        entry.count += 1;

        if(entry.count > max) {
            res.set("Retry-After", String(Math.ceil((entry.expiresAt - now) / 1000)));
            return next(new AppError(message, 429));
        }

        return next();
    }
}
