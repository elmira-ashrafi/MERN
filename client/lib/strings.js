export function trimChars (text, charsLength = 15, more = "...") {

    if(typeof text !== "string") return null;

    if(text.length <= charsLength) return text;

    return text.slice(0, charsLength) + more;

}
