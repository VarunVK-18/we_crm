const express = require('express');
const router = express.Router();
const { checkUser, permit } = require('../middleware/rbac');
const { getTeams, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');

router.get('/', checkUser, permit('admin', 'client_manager', 'filling_staff', 'account_manager'), getTeams);
router.post('/', checkUser, permit('admin'), createTeam);
router.put('/:id', checkUser, permit('admin'), updateTeam);
router.delete('/:id', checkUser, permit('admin'), deleteTeam);

module.exports = router;
