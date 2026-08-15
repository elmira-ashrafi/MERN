import fs from "fs/promises"
import path from "path"

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function removeFile(filePath) {
    if(!filePath) return;

    try{
        await fs.unlink(filePath);
    } catch (err) {
        if(err.code !== "ENOENT") throw err;
    }
}

export async function removeFiles(filePaths = []) {
    await Promise.all(filePaths.filter(Boolean).map(p => removeFile(p)));
}

export async function removeDirIfEmpty(dirPath) {
    if(!dirPath) return;

    try {
        const files = await fs.readdir(dirPath)

        if(files.length === 0) {
            await fs.rmdir(dirPath)
        }
    } catch {}
}

export async function removeDir(dirPath) {
    if(!dirPath) return;

    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch {}
}

export function toPosixPath(p) {
    return p.split(path.sep).join('/');
}
