const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/profile/company_details_screen.dart', 'utf8');

c = c.substring(0, c.indexOf('  Widget _buildIncorporationDetails(BuildContext context) {')) +
`  Widget _buildIncorporationDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailCard('CIN', widget.entity.cin.isNotEmpty ? widget.entity.cin : '-', context, showCopy: widget.entity.cin.isNotEmpty),
        _buildDetailCard('Date of Incorporation', widget.entity.incorporationDate != null ? DateFormat('dd MMM yyyy').format(widget.entity.incorporationDate!) : '-', context, showCopy: widget.entity.incorporationDate != null),
        _buildDetailCard('PAN', widget.entity.pan.isNotEmpty ? widget.entity.pan : '-', context, showCopy: widget.entity.pan.isNotEmpty),
        _buildDetailCard('TAN', widget.entity.tan.isNotEmpty ? widget.entity.tan : '-', context, showCopy: widget.entity.tan.isNotEmpty),
        _buildDetailCard('GSTIN', widget.entity.gstin.isNotEmpty ? widget.entity.gstin : '-', context, showCopy: widget.entity.gstin.isNotEmpty),
        _buildDetailCard('MSME / Udyam Number', widget.entity.msme.isNotEmpty ? widget.entity.msme : '-', context, showCopy: widget.entity.msme.isNotEmpty),
        _buildDetailCard('ISO Certification', widget.entity.iso, context),
        _buildDetailCard('FSSAI License', widget.entity.fssai.isNotEmpty ? widget.entity.fssai : '-', context, showCopy: widget.entity.fssai.isNotEmpty),
        _buildDetailCard('Certificate of Incorporation (COI)', widget.entity.coi, context, showCopy: false),
        _buildDetailCard('Digital Signature Certificate (DSC)', widget.entity.dsc, context, showCopy: false),
      ],
    );
  }
` + c.substring(c.indexOf('  Widget _buildApplicationTracker(BuildContext context) {'));

fs.writeFileSync('crm_app/lib/features/profile/company_details_screen.dart', c);
