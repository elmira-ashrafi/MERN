/*
 * Absolute base used by getServerSideProps only — it runs on the Next server and cannot use
 * the relative /api path the browser goes through. The browser always uses relative paths so
 * that cookies stay same-origin.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";
