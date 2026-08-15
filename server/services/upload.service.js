import fs from "fs/promises"
import path from "path"
import multer from "multer"
import sharp from "sharp"
import crypto from "crypto"
import AppError from "../utils/appError.js"
import { uploadRoot, uploadUrlFromRelative } from "../config/paths.js"
import { ensureDir, removeFiles, removeDir, removeDirIfEmpty } from "../utils/fsHelpers.js"
import { ALLOWED_IMAGE_MIMES, ALLOWED_DOC_MIMES, validateImageMime, validateDocMime, mimeFilter } from "../utils/fileValidations.js"

function makeId() {
    return crypto.randomBytes(12).toString("hex");
}

function memoryUploader({maxFiles, maxSize, fileFilter}) {
    return multer({
        storage: multer.memoryStorage(),
        fileFilter,
        limits: {
            files: maxFiles,
            fileSize: maxSize
        }
    })
}

async function saveOptimizedImage({ buffer, outputPath, width= 1600, height= 1600, quality= 82, fit= "inside" }) {
    await sharp(buffer).rotate().resize({width, height, fit, withoutEnlargement: true}).webp({ quality }).toFile(outputPath)
}

async function saveAvatarImage({buffer, outputPath}) {
    await sharp(buffer).rotate().resize({width: 400, height: 400, fit: "cover", position: "center"}).webp({ quality: 84 }).toFile(outputPath);
}

async function saveRawFile({buffer, outputPath}) {
    await fs.writeFile(outputPath, buffer)
}

export function postImageUploadMiddleware(fieldName) {
  return memoryUploader({
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
    fileFilter: mimeFilter(ALLOWED_IMAGE_MIMES, "only jpg, png and webp are allowed")
  }).array(fieldName, 5)
}

export function avatarUploadMiddleware() {
    return memoryUploader({
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024,
        fileFilter: mimeFilter(ALLOWED_IMAGE_MIMES, "only jpg, png and webp are allowed")
    }).single("avatar")
}

export const ALLOWED_CSV_MIMES = ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"];

export function csvUploadMiddleware() {
    return memoryUploader({
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024,
        fileFilter: mimeFilter(ALLOWED_CSV_MIMES, "upload a .csv file")
    }).single("file")
}

export function providerDocsUploadMiddleware() {
    return memoryUploader({
        maxFiles: 10,
        maxSize: 10 * 1024 * 1024,
        fileFilter: mimeFilter(ALLOWED_DOC_MIMES, "only pdf, jpg, png and webp are allowed")
    }).array("businessDocs", 10);
}

export function postImagesDir(postType, postId) {
  return path.join(uploadRoot, `${postType}s`, String(postId));
}

export async function processPostImages({ files, postId, postType }) {
    const savedFilesPath = [];
    const imageDocs = [];

    if(!files.length) return {savedFilesPath, imageDocs};

    files.forEach(validateImageMime);

    const targetDir = postImagesDir(postType, postId);
    await ensureDir(targetDir);

    try {
        for (const file of files) {

            const fileName = `${postType}-${makeId()}.webp`;
            const absolutePath = path.join(targetDir, fileName);

            await saveOptimizedImage({ buffer: file.buffer, outputPath: absolutePath });

            savedFilesPath.push(absolutePath);

            imageDocs.push({
                url: uploadUrlFromRelative(`${postType}s/${postId}/${fileName}`),
                alt: file.originalname
            })
        }

        return {savedFilesPath, imageDocs}

    } catch (err) {
        await removeFiles(savedFilesPath);
        await removeDir(targetDir);
        throw err;
    }
}

export async function processAvatarImage({ file, userId }) {

    validateImageMime(file);

    const targetDir = path.join(uploadRoot, 'users', "profiles", String(userId));
    await ensureDir(targetDir);

    const fileName = `avatar.webp`;
    const absolutePath = path.join(targetDir, fileName);

    // drop whatever the previous avatar was stored as
    await removeFiles([
        path.join(targetDir, "avatar.jpeg"),
        path.join(targetDir, "avatar.jpg"),
        path.join(targetDir, "avatar.png"),
        path.join(targetDir, "avatar.webp")
    ])

    await saveAvatarImage({buffer: file.buffer, outputPath: absolutePath});

    return {
        url: uploadUrlFromRelative(`users/profiles/${userId}/${fileName}`),
        absolutePath
    }
}

export async function processProviderDocs({ files, applicationId }) {

    const savedPaths = [];
    const businessDocs = []

    if(!files.length) return {businessDocs, savedPaths};

    const targetDir = path.join(uploadRoot, 'provider-applications', String(applicationId));
    await ensureDir(targetDir);

    try {
        for(const file of files) {
            validateDocMime(file)

            let fileName;
            let absolutePath;
            let finalMimeType = file.mimetype;

            if(finalMimeType.startsWith('image/')) {
                fileName = `doc-${makeId()}.webp`;
                absolutePath = path.join(targetDir, fileName)
                // tracked before the write so a half written file is still cleaned up on failure
                savedPaths.push(absolutePath);
                await saveOptimizedImage({buffer: file.buffer, outputPath: absolutePath})
                finalMimeType = "image/webp"
            } else if (finalMimeType === "application/pdf") {
                fileName = `doc-${makeId()}.pdf`;
                absolutePath = path.join(targetDir, fileName);
                savedPaths.push(absolutePath);
                await saveRawFile({buffer: file.buffer, outputPath: absolutePath});
            } else {
                throw new AppError("unsupported file type", 400);
            }

            businessDocs.push({
                url: uploadUrlFromRelative(`provider-applications/${applicationId}/${fileName}`),
                originalName: file.originalname,
                mimeType: finalMimeType,
                size: file.size
            })
        }

        return { businessDocs, savedPaths };
    } catch (err) {
        await removeFiles(savedPaths)
        /*
         * Only if nothing else is left: a re-application reuses the id of the previous one, so
         * this directory can still hold documents the stored application record points at.
         */
        await removeDirIfEmpty(targetDir)
        throw err;
    }
}
