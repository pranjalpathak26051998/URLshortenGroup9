const mongoose = require('mongoose');
const validator = require('validator');
// Define the schema for the URL model
const urlSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  longUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        if (!validator.isURL(value)) {
            throw new Error('Invalid URL');
          }
      },
      message: 'Invalid URL'
    }
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  }},
  { timestamps: true }
);

// Create the URL model
const urlModel = mongoose.model('URL', urlSchema);

module.exports = urlModel;
