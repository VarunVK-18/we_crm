const fs = require('fs');

const path = 'controllers/authController.js';
let content = fs.readFileSync(path, 'utf8');

const newRoute = `
// @route   POST /api/users/clients/opportunities/query
// @desc    Get paginated clients with dynamically computed opportunities
// @access  Private
const getClientsOpportunities = async (req, res) => {
  try {
    const { 
      recommendationPool = [], 
      page = 1, 
      limit = 10, 
      searchQuery = '', 
      filterCount = 'any', 
      filterCategory = 'all' 
    } = req.body;

    const userCompanyId = req.user ? req.user.company_id : req.query.company_id;
    const filter = { role: 'customer' };
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    if (req.user) {
      const role = req.user.role;
      if (role === 'client_manager') {
        filter.$or = [
          { assigned_to: req.user._id },
          { created_by: req.user._id }
        ];
      } else if (role === 'account_manager' || role === 'filling_staff') {
        filter.assigned_to = req.user._id;
      }
    }

    // Fetch base clients
    const clients = await User.find(filter)
      .select('name company_name email phone outsourced_services created_at assigned_to')
      .populate('assigned_to', 'owner_name email role')
      .lean();

    const clientIds = clients.map(c => c._id.toString());

    // Fetch all related orders and checklists in 2 bulk queries
    const orders = await ServiceOrder.find({ clientUid: { $in: clientIds } }).select('clientUid serviceType status stage').lean();
    const checklists = await Checklist.find({ client_id: { $in: clientIds } }).select('client_id service_name status stage').lean();

    // Group by client
    const ordersByClient = {};
    const checklistsByClient = {};
    
    orders.forEach(o => {
      if (!ordersByClient[o.clientUid]) ordersByClient[o.clientUid] = [];
      ordersByClient[o.clientUid].push(o);
    });
    
    checklists.forEach(c => {
      const cid = c.client_id.toString();
      if (!checklistsByClient[cid]) checklistsByClient[cid] = [];
      checklistsByClient[cid].push(c);
    });

    let totalPendingOpportunities = 0;
    
    // Process opportunities and filter
    const searchLower = searchQuery.toLowerCase().trim();
    const filteredClients = [];

    for (const client of clients) {
      const cid = client._id.toString();
      const clientOrders = ordersByClient[cid] || [];
      const clientChecklists = checklistsByClient[cid] || [];

      const weServices = [];
      clientOrders.forEach(o => {
        const matchingChecklist = clientChecklists.find(c => c.service_name === o.serviceType);
        weServices.push({
          serviceName: o.serviceType,
          status: matchingChecklist ? matchingChecklist.status : o.status,
          stage: matchingChecklist ? matchingChecklist.stage : o.stage
        });
      });
      clientChecklists.forEach(c => {
        if (!weServices.find(ws => ws.serviceName === c.service_name)) {
          weServices.push({ serviceName: c.service_name, status: c.status, stage: c.stage });
        }
      });

      const weDone = weServices.filter(s => s.status === 'completed' || s.status === 'complete' || s.stage === 'completed').map(s => s.serviceName);
      const outsourced = (client.outsourced_services || []).map(s => s.serviceName);
      const doneSet = new Set([...weDone, ...outsourced]);
      
      const primaryIncorpServices = ['Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship'];
      const hasPrimaryIncorp = primaryIncorpServices.some(s => doneSet.has(s));

      const opps = recommendationPool.filter(s => {
        if (doneSet.has(s.name)) return false;
        if (hasPrimaryIncorp && primaryIncorpServices.includes(s.name)) return false;
        return true;
      });

      client.opportunities = opps;
      const oppsCount = opps.length;

      // Apply Frontend Search Filters
      const matchSearch = !searchLower || 
        (client.name && client.name.toLowerCase().includes(searchLower)) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchLower)) ||
        (client.email && client.email.toLowerCase().includes(searchLower));
        
      if (!matchSearch) continue;

      let matchCount = true;
      if (filterCount === '>0') matchCount = oppsCount > 0;
      else if (filterCount === '1') matchCount = oppsCount === 1;
      else if (filterCount === '2') matchCount = oppsCount === 2;
      else if (filterCount === '3+') matchCount = oppsCount >= 3;
      
      if (!matchCount) continue;

      let matchCat = true;
      if (filterCategory !== 'all') {
        matchCat = opps.some(o => o.category === filterCategory);
      }
      if (!matchCat) continue;

      filteredClients.push(client);
      totalPendingOpportunities += oppsCount;
    }

    // Sort by creation date (newest first) or by something else? Let's do newest first
    filteredClients.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedClients = filteredClients.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(filteredClients.length / limit) || 1;

    res.json({
      clients: paginatedClients,
      totalPendingOpportunities,
      totalPages,
      currentPage: page,
      totalFilteredClients: filteredClients.length
    });
  } catch (error) {
    console.error('Error in getClientsOpportunities:', error);
    res.status(500).json({ message: 'Server error retrieving client opportunities' });
  }
};
`;

content = content.replace('module.exports = {', newRoute + '\nmodule.exports = {');
content = content.replace('module.exports = {', 'module.exports = {\n  getClientsOpportunities,');

fs.writeFileSync(path, content, 'utf8');
console.log('Added getClientsOpportunities');
