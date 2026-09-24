const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/profile/company_details_screen.dart', 'utf8');

const oldStr = `        _buildDetailCard('ISO Certification', widget.entity.iso, context),
        _buildDetailCard('FSSAI License', widget.entity.fssai.isNotEmpty ? widget.entity.fssai : '-', context, showCopy: widget.entity.fssai.isNotEmpty),
        _buildDetailCard('Certificate of Incorporation (COI)', widget.entity.coi, context, showCopy: false),
        _buildDetailCard('Digital Signature Certificate (DSC)', widget.entity.dsc, context, showCopy: false),`;

const newStr = `        _buildDetailCard('ISO Certification', widget.entity.iso.isNotEmpty ? widget.entity.iso : '-', context, showCopy: widget.entity.iso.isNotEmpty),
        _buildDetailCard('FSSAI License', widget.entity.fssai.isNotEmpty ? widget.entity.fssai : '-', context, showCopy: widget.entity.fssai.isNotEmpty),
        _buildDetailCard('Certificate of Incorporation (COI)', widget.entity.coi.isNotEmpty ? widget.entity.coi : '-', context, showCopy: false),
        _buildDetailCard('Digital Signature Certificate (DSC)', widget.entity.dsc.isNotEmpty ? widget.entity.dsc : '-', context, showCopy: false),`;

c = c.replace(oldStr, newStr);
fs.writeFileSync('crm_app/lib/features/profile/company_details_screen.dart', c);
