const {readChosenJson,MAX_JSON_BYTES}=require('./chosen-json-reader.cjs');
const readReviewDraft=filePath=>readChosenJson(filePath,'review draft');
module.exports={readReviewDraft,MAX_RECIPE_BYTES:MAX_JSON_BYTES};
