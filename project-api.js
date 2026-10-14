
import express from 'express';
import { db } from './database.js';

const router = express.Router();

const validStatuses = ['Planned', 'In Progress', 'Completed'];

function validateProject(name, status) {
    return (
        typeof name === 'string' &&
        name.trim().length >= 1 &&
        name.trim().length <= 80 &&
        validStatuses.includes(status)
    );
}

// GET all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await db.list();
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// CREATE a project
router.post('/projects', async (req, res) => {
    try {
        const { name, status } = req.body ?? {};

        if (!validateProject(name, status)) {
            return res.status(400).json({
                error: 'Valid project name and status are required.'
            });
        }

        // Save the project in Supabase PostgreSQL
        const project = await db.create({
            name: name.trim(),
            status
        });

        console.log('Project saved in Supabase:', project);
        return res.status(201).json(project);
    } catch (error) {
        console.error('Error saving project:', error);
        return res.status(500).json({
            error: 'Failed to save project'
        });
    }
});

// UPDATE a project
router.put('/projects/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, status } = req.body ?? {};

        if (!Number.isSafeInteger(id) || id < 1 ||
            !validateProject(name, status)) {
            return res.status(400).json({
                error: 'Valid project ID, name and status are required.'
            });
        }

        const project = await db.update(id, {
            name: name.trim(),
            status
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        return res.status(200).json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({
            error: 'Failed to update project'
        });
    }
});

// DELETE a project
router.delete('/projects/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const deleted = await db.remove(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Project not found' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({
            error: 'Failed to delete project'
        });
    }
});

export default router;
