const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getAllTickets, 
  getUserTickets, 
  updateTicket 
} = require('../controllers/ticketController');

// Support Ticket routes
router.post('/tickets', createTicket);
router.get('/tickets', getAllTickets);
router.get('/tickets/user/:userId', getUserTickets);
router.put('/tickets/:id', updateTicket);

module.exports = router;
