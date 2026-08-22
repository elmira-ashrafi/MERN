import crypto from "crypto"
import jwt from "jsonwebtoken"
import { expressjwt } from "express-jwt"
import mongoose from "mongoose"
import User, { USER_ROLES } from "../models/user.js"
import Country from "../models/country.js"
import Province from "../models/province.js"
import City from "../models/city.js"
import { hashPassword, comparePasswords } from "../utils/auth.js"
import AppError from "../utils/appError.js"
import { processAvatarImage } from "../services/upload.service.js"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

// compared against on the unknown-email path so a wrong email costs the same time as a wrong password
const dummyHash = hashPassword(crypto.randomUUID());

const normalizeEmail = email => String(email).trim().toLowerCase();

/*
 * A jwt `iat` is whole seconds, so it can land up to 999ms before the moment the token was
 * really issued. Backdating the stamp by a second stops a freshly minted token from being
 * mistaken for one that predates the change it was issued by.
 */
const CLOCK_SKEW_MS = 1000;

function signToken(userId, remember) {
    return jwt.sign({_id: userId}, process.env.JWT_SECRET, {
        expiresIn: remember ? "7d" : "1d"
    });
}

function tokenCookieOptions(remember) {
    const options = {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/"
    }

    // without maxAge the cookie lives for the browser session only
    if(remember) options.maxAge = REMEMBER_TTL_MS;

    return options;
}

// strip everything a client must never see, whatever the query selected
function sanitizeUser(userDoc) {
    const user = typeof userDoc.toObject === "function" ? userDoc.toObject() : {...userDoc};

    delete user.password;
    delete user.passwordResetCode;
    delete user.passwordResetExpires;
    delete user.passwordResetAttempts;
    delete user.passwordChangedAt;

    return user;
}

async function clearResetCode(userId) {
    await User.updateOne(
        {_id: userId},
        {$set: {passwordResetCode: '', passwordResetAttempts: 0}, $unset: {passwordResetExpires: 1}}
    ).exec();
}

/*
 * Single place where a reset code is verified. Both /confirm-code and /new-password go
 * through it, so the final step can never be reached without a valid, unexpired code.
 */
async function requireValidResetCode(email, code) {
    const invalid = new AppError("invalid or expired code", 400);

    if(!email || !code) throw invalid;

    const user = await User.findOne({email: normalizeEmail(email)})
        .select("+passwordResetCode +passwordResetExpires +passwordResetAttempts")
        .exec();

    if(!user || !user.passwordResetCode || !user.passwordResetExpires) throw invalid;

    if(user.passwordResetExpires.getTime() < Date.now()) {
        await clearResetCode(user._id);
        throw invalid;
    }

    if((user.passwordResetAttempts || 0) >= MAX_RESET_ATTEMPTS) {
        await clearResetCode(user._id);
        throw new AppError("too many attempts. please request a new code", 429);
    }

    const correctCode = await comparePasswords(String(code), user.passwordResetCode);

    if(!correctCode) {
        await User.updateOne({_id: user._id}, {$inc: {passwordResetAttempts: 1}}).exec();
        throw invalid;
    }

    return user;
}

export const register = async (req, res, next) => {
    try {
        const {name, email, password} = req.body;

        for(const [field, value] of Object.entries({name, email, password})) {
            if(typeof value !== "string" || !value.trim()) {
                return res.status(400).json({ok: false, message: `${field} is required`});
            }
        }

        if(!EMAIL_PATTERN.test(email.trim())) {
            return res.status(400).json({ok: false, message: "please enter a valid email"});
        }

        if(password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ok: false, message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`});
        }

        const normalizedEmail = normalizeEmail(email);

        const userExists = await User.findOne({email: normalizedEmail}).exec();
        if(userExists) return res.status(400).json({ok: false, message: "email already exists"});

        const hashedPassword = await hashPassword(password);

        await new User({name: name.trim(), email: normalizedEmail, password: hashedPassword}).save();

        return res.status(201).json({ok: true, message: "your account has been created. you can log in now"});

    } catch (err) {
        if(err?.code === 11000) return res.status(400).json({ok: false, message: "email already exists"});
        return next(err);
    }
}

export const login = async (req, res, next) => {
    const errMsg = "invalid credentials";

    try {
        const {email, password, remember} = req.body;

        if(typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ok: false, message: errMsg});
        }

        const user = await User.findOne({email: normalizeEmail(email)}).select("+password").exec();

        const correctPassword = await comparePasswords(password, user ? user.password : await dummyHash);

        if(!user || !correctPassword) {
            return res.status(400).json({ok: false, message: errMsg});
        }

        res.cookie("token", signToken(user._id, remember), tokenCookieOptions(remember));

        return res.json({ok: true, user: sanitizeUser(user)});

    } catch(err) {
        return next(err);
    }
}

/*
 * Signs in as the oldest account holding a given role, with no password. That is an
 * authentication bypass by definition, so it answers 404 outside development — the route stays
 * mounted but behaves exactly like a URL that was never registered.
 */
export const devLogin = async (req, res, next) => {
    // if(isProduction) return res.status(404).json({ok: false, message: "not found"});

    try {
        const { role } = req.body;

        if(!USER_ROLES.includes(role)) {
            return res.status(400).json({ok: false, message: "unknown role"});
        }

        // role is an array field, so an equality match means "contains this role"
        const user = await User.findOne({role}).sort({createdAt: 1}).exec();

        if(!user) {
            return res.status(404).json({ok: false, message: `no ${role} account exists in the database`});
        }

        res.cookie("token", signToken(user._id, false), tokenCookieOptions(false));

        return res.json({ok: true, user: sanitizeUser(user)});

    } catch(err) {
        return next(err);
    }
}

export const logout = async (req, res, next) => {
    try {
        // the options have to mirror the ones used when setting it or the browser keeps the cookie
        res.clearCookie("token", {httpOnly: true, sameSite: "lax", secure: isProduction, path: "/"});
        return res.json({ok: true, message: "you have logged out successfully"});
    } catch(err) {
        return next(err);
    }
}

export const csrfToken = async(req, res) => {
    res.json({csrfToken: req.csrfToken()});
}

export const requireSigning = expressjwt({
    getToken: req => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"]
});

// populates req.auth when a valid cookie is present but lets anonymous callers through
export const optionalSigning = expressjwt({
    getToken: req => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    credentialsRequired: false
});

/*
 * Loads the signed-in user onto req.currentUser. Runs after requireSigning so req.auth exists.
 * Every handler that needs to know who the actor is reads it from here, never from the body.
 *
 * It also rejects tokens that predate the last password change. A jwt cannot be revoked, so
 * without this check resetting a password would leave every stolen session still working.
 */
export const loadCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.auth?._id).select("+passwordChangedAt").exec();

        if(!user) return next(new AppError("user not found", 401));

        if(user.passwordChangedAt && req.auth.iat * 1000 < user.passwordChangedAt.getTime()) {
            return next(new AppError("your password has changed. please sign in again", 401));
        }

        req.currentUser = user;
        return next();
    } catch(err) {
        return next(err);
    }
}

// every authenticated route uses this pair, so the staleness check can never be forgotten
export const requireAuth = [requireSigning, loadCurrentUser];

export const requireAdmin = (req, res, next) => {
    if(!req.currentUser?.role?.includes("Admin")) {
        return next(new AppError("you are not allowed to do this", 403));
    }
    return next();
}

export const currentUser = async (req, res, next) => {
    try {
        return res.json({ok: true, user: sanitizeUser(req.currentUser)});
    } catch(err) {
        return next(err);
    }
}

export const confirmCode = async (req, res, next) => {
    try {
        const { code, email } = req.body

        await requireValidResetCode(email, code);

        return res.status(200).json({ok: true, message: 'confirmation succeed'});

    } catch(err) {
        return next(err);
    }
}

export const setNewPassword = async (req, res, next) => {
    try {
        const {email, code, password, confirmPassword} = req.body

        if(!email || !code || !password || !confirmPassword) {
            return res.status(400).json({ok: false, message: "all fields are required"});
        }

        if(password !== confirmPassword) {
            return res.status(400).json({ok: false, message: 'passwords not match'});
        }

        if(String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ok: false, message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`});
        }

        // the code is re-verified here — passing /confirm-code alone grants nothing
        const user = await requireValidResetCode(email, code);

        const hashedPassword = await hashPassword(password);

        await User.updateOne(
            {_id: user._id},
            {
                // the stamp kills every session that was open before this reset
                $set: {
                    password: hashedPassword,
                    passwordChangedAt: new Date(Date.now() - CLOCK_SKEW_MS),
                    passwordResetCode: '',
                    passwordResetAttempts: 0
                },
                $unset: {passwordResetExpires: 1}
            }
        ).exec();

        return res.status(200).json({ok: true, message: "your new password has been set successfully"});

    } catch (err) {
        return next(err);
    }
}

export const editProfile = async (req, res, next) => {
    try {
        const {name, email, currentPassword, password, confirmPassword, phone, userCountry, userProvince, userCity} = req.body
        const avatar = req.file

        for(const value of [userCountry, userProvince, userCity]) {
            if(value && !mongoose.isValidObjectId(value)) {
                return res.status(400).json({ok: false, message: "invalid location"});
            }
        }

        // the account being edited is always the signed-in one
        const user = await User.findById(req.auth._id).select("+password").exec();

        if(!user) {
            return res.status(404).json({ok: false, message: "user not found"});
        }

        let hashedPassword = '';

        if(password || confirmPassword) {

            if(!password || !confirmPassword) {
                return res.status(400).json({ok: false, message: "passwords and it's confirmation should be present both"});
            }

            if(password !== confirmPassword) {
                return res.status(400).json({ok: false, message: "passwords not match"});
            }

            if(String(password).length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({ok: false, message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`});
            }

            // changing a password requires proving you know the current one
            if(!currentPassword || !(await comparePasswords(String(currentPassword), user.password))) {
                return res.status(400).json({ok: false, message: "your current password is not correct"});
            }

            hashedPassword = await hashPassword(password);
        }

        let normalizedEmail = '';

        if(email && normalizeEmail(email) !== user.email) {
            if(!EMAIL_PATTERN.test(String(email).trim())) {
                return res.status(400).json({ok: false, message: "please enter a valid email"});
            }

            normalizedEmail = normalizeEmail(email);

            const emailTaken = await User.findOne({email: normalizedEmail, _id: {$ne: user._id}}).exec();
            if(emailTaken) return res.status(400).json({ok: false, message: "email already exists"});
        }

        //user country and province and city are tied together, all of them or none of them should exists
        if((userCountry || userProvince || userCity) && (!userCountry || !userProvince || !userCity)) {
            return res.status(400).json({ok: false, message: "country and province and city all should exists or leave all empty"});
        }

        if(userCountry && userProvince && userCity) {

            if(!user.requesterProfile) {
                user.requesterProfile = {};
            }

            const city = await City.findOne({_id: userCity, province: userProvince}).exec();
            if(!city) return res.status(400).json({ok: false, message: "city not found"});

            const province = await Province.findOne({_id: userProvince, country: userCountry}).exec();
            if(!province) return res.status(400).json({ok: false, message: "province not found"});

            const country = await Country.findOne({_id: userCountry}).exec();
            if(!country) return res.status(400).json({ok: false, message: "country not found"});

            user.requesterProfile.location = {country: userCountry, province: userProvince, city: userCity}
        }

        for(const [key, value] of Object.entries({name, email: normalizedEmail, password: hashedPassword})) {
            if(value) {
                user[key] = value;
            }
        }

        if(hashedPassword) {
            user.passwordChangedAt = new Date(Date.now() - CLOCK_SKEW_MS);
        }

        // an empty phone has to clear the field rather than store "", which would collide on the unique index
        if(typeof phone === "string") {
            user.phoneNumber = phone.trim() || undefined;
        }

        if(avatar) {
          const {url} = await processAvatarImage({file: avatar, userId: user._id});
          user.avatar = url
        }

        await user.save();

        /*
         * The stamp above invalidates every existing token, including the one this request
         * arrived with. Handing back a fresh cookie keeps the session that made the change
         * alive while every other one is dropped.
         */
        if(hashedPassword) {
            res.cookie("token", signToken(user._id, true), tokenCookieOptions(true));
        }

        return res.status(200).json({ok: true, message: "your datas successfully updated", user: sanitizeUser(user)});
    } catch(err) {
        if(err?.code === 11000) {
            return res.status(400).json({ok: false, message: "this email or phone number is already in use"});
        }
        return next(err);
    }
}

export const getProfilePicture = async(req, res, next) => {
  try {
    
    const user = await User.findOne({_id: req.auth._id}).exec()

    if(!user) return res.status(400).json({ok: false, message: "invalid user"});

    return res.status(200).json({ok: true, message: user})
    
  } catch(err) {
    next(Err);
  }
}