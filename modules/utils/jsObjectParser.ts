interface ParsedJSObject {
    [index: string]: Record<string, unknown>
}

/**
 * Converts a JS Object string to a JSON String
 * @param content JS Object string we want to convert  
 */
function convertJsObjectString(content: string) {
    const regex0 = /export const [a-z-A-Z_0-9]* =/gm;
    const regex1 = /([_a-zA-Z0-9]+):/gm;
    const regex2 = /'([a-zA-Z_ 0-9\n]*)'/gm;
    const regex3 = /,[\s\n]*}/gm

    return content.replace(regex1, "\"$1\":").replace(regex0, "").replace(regex2, "\"$1\"").replace(regex3, "\n}").replace("};", "}");

}


/**
 * Converts a JS Object string to a JSON Object
 * @param content JS Object string we want to convert to a JSON Object
 */
function jsObjectToJson(content: string): ParsedJSObject {
    const objectString = convertJsObjectString(content);
    return JSON.parse(objectString) as ParsedJSObject;
}

/**
 * Converts a file containing a JS Object file to a JSON Object
 * @param link Link to the file that contains the JS Object 
 */
async function jsObjectFileToJson(link: string): Promise<ParsedJSObject> {
    const response = await fetch(link);
    return jsObjectToJson(await response.text());
}


export { jsObjectToJson, jsObjectFileToJson, convertJsObjectString }