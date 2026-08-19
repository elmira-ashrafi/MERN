export function trimChars (text, charsLength = 15, more = "...") {

  if(typeof text !== "string") return null;

  if(text.length <= charsLength) return text;

  return text.slice(0, charsLength) + more;

}

export function getErrorMessage(err) {
  if(typeof err === 'string') return err;
  if(err?.message) return err.message;
  return "something failed! please try again later";
}