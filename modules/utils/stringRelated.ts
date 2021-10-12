function serialize(str: string){
    return str.toLowerCase().replace(" ", "_");
}

function deserialize(str: string){
    return str.split("_").map(x=>x.charAt(0).toUpperCase() + x.substr(1)).join(" ");
}

// https://www.geeksforgeeks.org/edit-distance-dp-5/
function editDist(str1 :string , str2 : string, m : number, n : number) : number
{
     
    // If first string is empty, the
    // only option is to insert all
    // characters of second string leto first
    if (m == 0)
        return n;
 
    // If second string is empty, the only
    // option is to remove all characters
    // of first string
    if (n == 0)
        return m;
 
    // If last characters of two strings are
    // same, nothing much to do. Ignore last
    // characters and get count for remaining
    // strings.
    if (str1[m - 1] == str2[n - 1])
        return editDist(str1, str2, m - 1, n - 1);
 
    // If last characters are not same, consider all
    // three operations on last character of first
    // string, recursively compute minimum cost for all
    // three operations and take minimum of three
    // values.
    return 1 +
    Math.min(editDist(str1, str2, m, n - 1), // Insert
        editDist(str1, str2, m - 1, n), // Remove
        editDist(str1, str2, m - 1, n - 1)); // Replace
}


export {editDist, deserialize, serialize};