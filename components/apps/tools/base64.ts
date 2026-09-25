export function encodeBase64(s:string):string{return btoa(unescape(encodeURIComponent(s)))}
export function decodeBase64(s:string):string|null{try{return decodeURIComponent(escape(atob(s)))}catch{return null}}
