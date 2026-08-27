// src/models/Word.js

const mongoose = require('mongoose');

/**
 * Sub-schema: a single definition within a meaning.
 * Not given its own model/collection — it only ever exists
 * nested inside a meaning, never queried independently.
 */
const definitionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Definition text is required'],
            trim: true
        },
        examples: {
            type: [String],
            default: []
        }
    },
    { _id: false } // no need for a separate ID on each definition
);

/**
 * Sub-schema: one part-of-speech grouping (e.g. "adjective"),
 * containing one or more definitions.
 */
const meaningSchema = new mongoose.Schema(
    {
        partOfSpeech: {
            type: String,
            required: [true, 'Part of speech is required'],
            trim: true,
            lowercase: true
        },
        definitions: {
            type: [definitionSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'Each meaning must have at least one definition'
            }
        }
    },
    { _id: false }
);

/**
 * Main schema: a single dictionary word entry.
 */
const wordSchema = new mongoose.Schema(
    {
        word: {
            type: String,
            required: [true, 'Word is required'],
            trim: true,
            lowercase: true,   // normalize storage: "Happy" and "happy" are the same entry
            unique: true       // one document per word (automatically indexed)
        },

        pronunciation: {
            uk: { type: String, default: '' },
            us: { type: String, default: '' }
        },

        audio: {
            uk: { type: String, default: '' },
            us: { type: String, default: '' }
        },

        meanings: {
            type: [meaningSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'A word must have at least one meaning'
            }
        },

        synonyms: {
            type: [String],
            default: []
        },

        antonyms: {
            type: [String],
            default: []
        },

        relatedWords: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true // adds createdAt / updatedAt automatically
    }
);

module.exports = mongoose.model('Word', wordSchema);