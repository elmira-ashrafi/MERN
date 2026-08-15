import AppError from "./appError.js"

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", 'image/png', 'image/webp'];
export const ALLOWED_DOC_MIMES = ['application/pdf', "image/jpeg", 'image/png', 'image/webp'];

export function validateImageMime(file) {
    if(!file || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        throw new AppError("only jpg, png and webp are allowed", 400);
    }
}

export function validateDocMime(file) {
    if(!file || !ALLOWED_DOC_MIMES.includes(file.mimetype)) {
        throw new AppError("only pdf, jpg, png and webp are allowed", 400);
    }
}

//multer fileFilter built from one of the allowlists above
export function mimeFilter(allowedMimes, message) {
    return (req, file, cb) => {
        if(allowedMimes.includes(file.mimetype)) return cb(null, true);
        cb(new AppError(message, 400));
    }
}
