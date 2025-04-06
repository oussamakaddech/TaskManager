const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Pour hacher les mots de passe

// Inscription
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Utilisateur déjà existant' });

        user = new User({
            email,
            password: await bcrypt.hash(password, 10), // Hacher le mot de passe
        });
        await user.save();

        res.status(201).json({ message: 'Utilisateur enregistré' });
    } catch (err) {
        console.error('Erreur lors de l’inscription:', err);
        res.status(500).json({ message: 'Erreur serveur lors de l’inscription' });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Erreur lors de la connexion:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
});

module.exports = router;