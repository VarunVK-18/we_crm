const regexStr = "^[a-zA-Z0-9\\\\s\\\\.,\\\\-\\\\/&'()]{20,}$";
console.log("regexStr:", regexStr);
const regex = new RegExp(regexStr);
console.log("regex:", regex);
console.log("Matches ' ':", regex.test(' '));
