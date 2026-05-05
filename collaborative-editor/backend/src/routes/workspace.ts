import express from 'express';
import Workspace from '../models/Workspace';
import File from '../models/File';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user!.userId },
        { 'members.user': req.user!.userId }
      ]
    }).populate('owner members.user');

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    const workspace = new Workspace({
      name,
      description,
      owner: req.user!.userId,
      members: [{
        user: req.user!.userId,
        role: 'owner'
      }]
    });

    await workspace.save();
    await workspace.populate('owner members.user');

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner members.user')
      .populate({
        path: 'files',
        match: { isFolder: false }
      });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      member => member.user._id.toString() === req.user!.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/members', async (req: AuthRequest, res) => {
  try {
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isOwner = workspace.owner.toString() === req.user!.userId;
    if (!isOwner) {
      return res.status(403).json({ message: 'Only owner can add members' });
    }

    workspace.members.push({
      user: userId,
      role: role || 'editor',
      joinedAt: new Date()
    });

    await workspace.save();
    await workspace.populate('members.user');

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
