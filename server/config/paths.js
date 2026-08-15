import path from "path"
import { fileURLToPath } from "url"

const __dirPath = path.dirname(fileURLToPath(import.meta.url));

//resolved from this file, not from cwd, so the server works whatever directory it is started in
export const serverRoot = path.resolve(__dirPath, "..");

const configuredUploadDir = process.env.UPLOAD_DIR || "uploads";

export const uploadRoot = path.isAbsolute(configuredUploadDir)
    ? configuredUploadDir
    : path.resolve(serverRoot, configuredUploadDir);

export const UPLOAD_URL_PREFIX = "/uploads/";

//build the public url of a stored file
export function uploadUrlFromRelative(relativePath) {
    return UPLOAD_URL_PREFIX + String(relativePath).split(path.sep).join("/").replace(/^\/+/, "");
}

//map a public /uploads/... url back onto disk, refusing anything that escapes the upload root
export function absolutePathFromUploadUrl(url) {
    if(typeof url !== "string" || !url.startsWith(UPLOAD_URL_PREFIX)) return null;

    const resolved = path.resolve(uploadRoot, url.slice(UPLOAD_URL_PREFIX.length));
    const root = path.resolve(uploadRoot);

    if(resolved !== root && !resolved.startsWith(root + path.sep)) return null;

    return resolved;
}
