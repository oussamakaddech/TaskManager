const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    tags: [{ type: String }], // Nouveau champ pour les tags
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, // Nouveau champ pour la priorité
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);