import express from "express"
import { sendCodeToEmail } from '../controllers/mailer.js'
import { rateLimit } from "../utils/rateLimit.js"

const router = express.Router()

// every call costs a bcrypt hash plus an SMTP round trip, and can spam a real inbox
const sendEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "too many reset requests. please try again later"
});

router.post('/send-email', sendEmailLimiter, sendCodeToEmail);

export default router
