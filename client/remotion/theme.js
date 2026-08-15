// Shared with client/public/css/styles.css (.bg-cat) and Bootstrap's --bs-primary
export const COLORS = {
    primary: "#0d6efd",
    primaryDark: "#084298",
    accent: "rgb(197, 226, 255)",
    accentHover: "rgb(144, 191, 237)",
    ink: "#1a1a2e",
    white: "#ffffff",
    success: "#198754",
};

export const FPS = 30;
export const CHAPTER_FRAMES = 90;
export const CHAPTERS = [
    { key: "ask", label: "1. What do you need?", start: 0 * CHAPTER_FRAMES },
    { key: "post", label: "2. Post a request", start: 1 * CHAPTER_FRAMES },
    { key: "proposals", label: "3. Providers respond", start: 2 * CHAPTER_FRAMES },
    { key: "match", label: "4. Pick & get it done", start: 3 * CHAPTER_FRAMES },
];
export const TOTAL_FRAMES = CHAPTERS.length * CHAPTER_FRAMES;
