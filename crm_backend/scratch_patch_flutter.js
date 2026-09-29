const fs = require('fs');
const path = 'c:\\projects\\we_crm\\crm_app\\lib\\features\\profile\\company_details_screen.dart';
let c = fs.readFileSync(path, 'utf8');

// 1. Add _buildFinancialDetails
const financialDetailsMethod = `
  Widget _buildFinancialDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailCard('Company Type', widget.entity.companyType, context),
        _buildDetailCard('Authorised Capital', widget.entity.authorisedCapital, context),
        _buildDetailCard('Paid-up Capital', widget.entity.paidupCapital, context),
        
        if (widget.entity.bankDetails != null && widget.entity.bankDetails!.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Bank Details', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF312E81))),
          const SizedBox(height: 12),
          _buildDetailCard('Bank Name', widget.entity.bankDetails!['bankName']?.toString() ?? '', context),
          _buildDetailCard('Account Number', widget.entity.bankDetails!['accountNumber']?.toString() ?? '', context),
          _buildDetailCard('IFSC Code', widget.entity.bankDetails!['ifscCode']?.toString() ?? '', context),
          _buildDetailCard('Account Type', widget.entity.bankDetails!['accountType']?.toString() ?? '', context),
        ],

        if (widget.entity.companyType.isEmpty && widget.entity.authorisedCapital.isEmpty && widget.entity.paidupCapital.isEmpty && widget.entity.bankDetails == null)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Text(
                'No financial details available.',
                style: GoogleFonts.outfit(color: Colors.grey[500]),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildIncorporationDetails`;
c = c.replace('  Widget _buildIncorporationDetails', financialDetailsMethod);

// 2. Add Tab
const tab1 = `                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTabIndex = 1),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: AnimatedDefaultTextStyle(
                                duration: const Duration(milliseconds: 300),
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: _selectedTabIndex == 1 ? AppTheme.deepTeal : Colors.grey[500],
                                ),
                                child: const Text('Application Tracker'),
                              ),
                            ),
                          ),
                        ),
                      ),`;
const tab2 = `                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTabIndex = 1),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: AnimatedDefaultTextStyle(
                                duration: const Duration(milliseconds: 300),
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: _selectedTabIndex == 1 ? AppTheme.deepTeal : Colors.grey[500],
                                ),
                                child: const Text('Tracker'),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTabIndex = 2),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: AnimatedDefaultTextStyle(
                                duration: const Duration(milliseconds: 300),
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: _selectedTabIndex == 2 ? AppTheme.deepTeal : Colors.grey[500],
                                ),
                                child: const Text('Financials'),
                              ),
                            ),
                          ),
                        ),
                      ),`;
// Update font size of the first tab too
c = c.replace(tab1, tab2);
c = c.replace(`fontSize: 14,
                                color: _selectedTabIndex == 0 ? AppTheme.deepTeal : Colors.grey[500],
                                ),
                                child: const Text('Incorporation Details'),`, `fontSize: 12,
                                color: _selectedTabIndex == 0 ? AppTheme.deepTeal : Colors.grey[500],
                                ),
                                child: const Text('Incorporation'),`);

// 3. Indicator alignment
const alignOld = `alignment: _selectedTabIndex == 0 ? Alignment.centerLeft : Alignment.centerRight,`;
const alignNew = `alignment: _selectedTabIndex == 0 ? Alignment.centerLeft : _selectedTabIndex == 1 ? Alignment.center : Alignment.centerRight,`;
c = c.replace(alignOld, alignNew);
c = c.replace(`width: constraints.maxWidth / 2,`, `width: constraints.maxWidth / 3,`);

// 4. Swipe logic
const swipeOld = `                  if (details.primaryVelocity != null) {
                    if (details.primaryVelocity! > 0) {
                      // Swiped Right -> Go to Incorporation Details (index 0)
                      if (_selectedTabIndex == 1) {
                        setState(() => _selectedTabIndex = 0);
                      }
                    } else if (details.primaryVelocity! < 0) {
                      // Swiped Left -> Go to Application Tracker (index 1)
                      if (_selectedTabIndex == 0) {
                        setState(() => _selectedTabIndex = 1);
                      }
                    }
                  }`;
const swipeNew = `                  if (details.primaryVelocity != null) {
                    if (details.primaryVelocity! > 0) {
                      if (_selectedTabIndex > 0) {
                        setState(() => _selectedTabIndex--);
                      }
                    } else if (details.primaryVelocity! < 0) {
                      if (_selectedTabIndex < 2) {
                        setState(() => _selectedTabIndex++);
                      }
                    }
                  }`;
c = c.replace(swipeOld, swipeNew);

// 5. Container render
const renderOld = `                  child: _selectedTabIndex == 0 
                        ? Container(key: const ValueKey(0), child: _buildIncorporationDetails(context)) 
                        : Container(key: const ValueKey(1), child: _buildApplicationTracker(context)),`;
const renderNew = `                  child: _selectedTabIndex == 0 
                        ? Container(key: const ValueKey(0), child: _buildIncorporationDetails(context)) 
                        : _selectedTabIndex == 1 
                          ? Container(key: const ValueKey(1), child: _buildApplicationTracker(context))
                          : Container(key: const ValueKey(2), child: _buildFinancialDetails(context)),`;
c = c.replace(renderOld, renderNew);

fs.writeFileSync(path, c, 'utf8');
console.log('Patched Flutter UI!');
