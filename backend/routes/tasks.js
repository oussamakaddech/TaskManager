const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // Protège toutes les routes avec le middleware d'authentification

// Récupérer toutes les tâches de l'utilisateur connecté
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user });
        res.json(tasks);
    } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des tâches' });
    }
});

// Ajouter une nouvelle tâche
router.post('/', async (req, res) => {
    const { title, description, dueDate, tags, priority } = req.body;

    // Validation des champs obligatoires
    if (!title) {
        return res.status(400).json({ message: 'Le titre de la tâche est requis' });
    }

    const task = new Task({
        title,
        description: description || '', // Valeur par défaut si non fourni
        dueDate: dueDate ? new Date(dueDate) : null, // Convertir en Date ou null
        tags: tags || [], // Tags par défaut à un tableau vide
        priority: priority || 'medium', // Priorité par défaut à "medium"
        user: req.user, // Associer à l'utilisateur connecté
    });

    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Erreur lors de la création de la tâche:', err);
        res.status(400).json({ message: 'Erreur lors de la création de la tâche: ' + err.message });
    }
});

// Mettre à jour une tâche
router.put('/:id', async (req, res) => {
    const { title, description, dueDate, status, tags, priority } = req.body;

    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user });
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

        // Mise à jour des champs uniquement s'ils sont fournis
        task.title = title !== undefined ? title : task.title;
        task.description = description !== undefined ? description : task.description;
        task.status = status !== undefined ? status : task.status;
        task.dueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate;
        task.tags = tags !== undefined ? tags : task.tags;
        task.priority = priority !== undefined ? priority : task.priority;

        // Validation spécifique
        if (task.title === '') {
            return res.status(400).json({ message: 'Le titre ne peut pas être vide' });
        }
        if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
            return res.status(400).json({ message: 'La priorité doit être "low", "medium" ou "high"' });
        }
        if (task.status && !['pending', 'completed'].includes(task.status)) {
            return res.status(400).json({ message: 'Le statut doit être "pending" ou "completed"' });
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la tâche:', err);
        res.status(400).json({ message: 'Erreur lors de la mise à jour de la tâche: ' + err.message });
    }
});

// Supprimer une tâche
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user });
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

        const result = await Task.deleteOne({ _id: req.params.id, user: req.user });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }

        res.json({ message: 'Tâche supprimée avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression: ' + err.message });
    }
});

module.exports = router;