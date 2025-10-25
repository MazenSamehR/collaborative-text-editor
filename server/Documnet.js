const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  _id: String,
  name: {
    type: String,
    default: "Untitled document",
  },
  data: {
    type: Object,
    default: {},
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
