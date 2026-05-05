import express from 'express';
import File from '../models/File';
import Workspace from '../models/Workspace';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as Y from 'yjs';
import { Types } from 'mongoose';

const router = express.Router();

router.use(authMiddleware);

router.get('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      member => member.user.toString() === req.user!.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const files = await File.find({
      workspace: req.params.workspaceId,
      isFolder: false
    }).populate('createdBy lastModifiedBy');

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const { name, content, language, path } = req.body;
    const workspaceId = req.params.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      member => member.user.toString() === req.user!.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const yjsDocId = `${workspaceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const file = new File({
      name,
      content: content || '',
      language: language || 'plaintext',
      path: path || `/${name}`,
      workspace: workspaceId,
      createdBy: req.user!.userId,
      lastModifiedBy: req.user!.userId,
      size: content?.length || 0,
      yjsDocId
    });

    await file.save();
    await workspace.updateOne({ $push: { files: file._id.toString() } });

    await file.populate('createdBy lastModifiedBy');
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('workspace')
      .populate('createdBy lastModifiedBy');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const workspace = await Workspace.findById(file.workspace._id);
    const isMember = workspace?.members.some(
      member => member.user.toString() === req.user!.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { content, name, language } = req.body;
    
    const file = await File.findById(req.params.id).populate('workspace');
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const workspace = await Workspace.findById(file.workspace);
    const isMember = workspace?.members.some(
      member => member.user.toString() === req.user!.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (content !== undefined) file.content = content;
    if (name !== undefined) file.name = name;
    if (language !== undefined) file.language = language;
    
    file.lastModifiedBy = req.user!.userId;
    file.size = file.content.length;

    await file.save();
    await file.populate('createdBy lastModifiedBy');

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const file = await File.findById(req.params.id).populate('workspace');
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const workspace = await Workspace.findById(file.workspace);
    const isOwner = workspace?.owner.toString() === req.user!.userId;
    const isAdmin = workspace?.members.some(
      member => member.user.toString() === req.user!.userId && member.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await File.findByIdAndDelete(req.params.id);
    await workspace?.updateOne({ $pull: { files: req.params.id } });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
