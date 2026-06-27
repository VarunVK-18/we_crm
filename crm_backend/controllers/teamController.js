const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get all teams for admin's company
// @route   GET /api/teams
const getTeams = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const teams = await Team.find({ company_id })
      .populate('manager_id', 'owner_name email role _id')
      .populate('members', 'owner_name email role _id phone')
      .lean();
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new team
// @route   POST /api/teams
const createTeam = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { name, manager_id, members = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required.' });
    }

    const team = await Team.create({ company_id, name: name.trim(), manager_id: manager_id || null, members });
    const populated = await Team.findById(team._id)
      .populate('manager_id', 'owner_name email role _id')
      .populate('members', 'owner_name email role _id phone');

    res.status(201).json({ success: true, team: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A team with this name already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update team (name, manager, members)
// @route   PUT /api/teams/:id
const updateTeam = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;
    const { name, manager_id, members } = req.body;

    const team = await Team.findOne({ _id: id, company_id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    if (name !== undefined) team.name = name.trim();
    if (manager_id !== undefined) team.manager_id = manager_id || null;
    if (members !== undefined) team.members = members;

    await team.save();
    const populated = await Team.findById(team._id)
      .populate('manager_id', 'owner_name email role _id')
      .populate('members', 'owner_name email role _id phone');

    res.json({ success: true, team: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;

    const team = await Team.findOneAndDelete({ _id: id, company_id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    res.json({ success: true, message: 'Team deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTeams, createTeam, updateTeam, deleteTeam };
