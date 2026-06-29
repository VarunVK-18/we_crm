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


// @desc    Get team service tracking stats (Checklist counts)
// @route   GET /api/teams/service-stats
const getTeamServiceStats = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { month, year } = req.query;

    // Default to current month and year if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1; // 1-12
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    let teamQuery = { company_id };
    if (req.user.role === 'client_manager') {
      teamQuery.manager_id = req.user._id;
    }

    const teams = await Team.find(teamQuery)
      .populate('manager_id', 'owner_name email')
      .populate('members', 'owner_name email role profile_image')
      .lean();

    const Checklist = require('../models/Checklist');

    // For each team, get members and their service counts
    for (const team of teams) {
      team.totalOngoing = 0;
      team.totalCompleted = 0;
      if (team.members && team.members.length > 0) {
        for (const member of team.members) {
          // Count checklists assigned to this member in the given date range
          const ongoingCount = await Checklist.countDocuments({
            company_id,
            assigned_to: member._id,
            status: { $ne: 'completed' },
            createdAt: { $gte: startDate, $lte: endDate }
          });
          const completedCount = await Checklist.countDocuments({
            company_id,
            assigned_to: member._id,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          });
          
          member.ongoingCount = ongoingCount;
          member.completedCount = completedCount;
          team.totalOngoing += ongoingCount;
          team.totalCompleted += completedCount;
        }
      }
    }

    res.json({ success: true, teams, month: targetMonth, year: targetYear });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTeamServiceStats, getTeams, createTeam, updateTeam, deleteTeam };

