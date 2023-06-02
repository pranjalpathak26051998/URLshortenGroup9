
function isValid (data) {
    if(typeof data !== "string" || data.trim().length == "") return false
    else return true
}

function validString(input){
    return (/^[a-zA-Z]+$/.test(input))
}




module.exports.isValid = isValid
module.exports.validString = validString

