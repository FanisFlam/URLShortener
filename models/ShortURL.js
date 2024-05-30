const mongoose = require('mongoose');

const ShortURLSchema = mongoose.Schema({
    original_url: {type: String, required: true},
    short_url: {type: Number, required: true}
});

module.exports = mongoose.model('ShortURL', ShortURLSchema);