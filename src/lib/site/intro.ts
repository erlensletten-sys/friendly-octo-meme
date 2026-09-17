/**
 * Nøkkelen som sier at åpningen alt er vist i denne fanen. Deles mellom
 * åpningen selv og det lille skriptet i <head> som skjuler plassholderen før
 * første bilde tegnes.
 */
export const INTRO_SESSION_KEY = "iwc:intro";

/** Kjøres inline i <head>, før noe tegnes. Må holde seg til ES5 og try/catch. */
export const introBootScript = `try{if(sessionStorage.getItem(${JSON.stringify(
  INTRO_SESSION_KEY,
)})==="1")document.documentElement.setAttribute("data-intro","seen")}catch(e){}`;
