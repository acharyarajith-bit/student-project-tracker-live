
import express from 'express';
import { db } from './database.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static('public'));

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'API is running'
    });
  });

  // 2. Get all projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await db.list();
      res.status(200).json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        error: 'Could not load projects'
      });
    }
  });

  // 3. Add a project
  app.post('/api/projects', async (req, res) => {
    try {
      const { name, status } = req.body ?? {};

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: 'Project name is required'
        });
      }

      const validStatuses = [
        'Planned',
        'In Progress',
        'Completed'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid project status'
        });
      }

      const project = await db.create({
        name: name.trim(),
        status
      });

      res.status(201).json(project);
    } catch (error) {
      console.error('Add project error:', error);
      res.status(500).json({
        error: 'Could not add project'
      });
    }
  });

  // 4. Update a project
  app.put('/api/projects/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, status } = req.body ?? {};

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
          error: 'Invalid project ID'
        });
      }

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: 'Project name is required'
        });
      }

      const validStatuses = [
        'Planned',
        'In Progress',
        'Completed'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid project status'
        });
      }

      const project = await db.update(id, {
        name: name.trim(),
        status
      });

      if (!project) {
        return res.status(404).json({
          error: 'Project not found'
        });
      }

      res.status(200).json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        error: 'Could not update project'
      });
    }
  });

  // 5. Delete a project
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
          error: 'Invalid project ID'
        });
      }

      const deleted = await db.remove(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Project not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        error: 'Could not delete project'
      });
    }
  });

  return app;
}
