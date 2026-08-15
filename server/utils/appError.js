export default class AppError extends Error {
    constructor (message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = String(statusCode).startsWith("4") ? "failed" : "error";
        this.isOperational = true;
    }
}