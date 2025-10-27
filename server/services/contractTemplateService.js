import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

class ContractTemplateService {
  constructor() {
    this.companyInfo = {
      name: 'MR PIKIPIKI TRADING COMPANY LIMITED',
      address: 'Dar es Salaam, Tanzania',
      phone: '+255 XXX XXX XXX',
      email: 'info@mrpikipiki.com',
      registration: 'Company Registration Number: XXXXXX',
      taxId: 'TIN: XXXXXX'
    };
  }

  // Generate professional contract PDF
  async generateContractPDF(contract, motorcycle, party) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting PDF generation...');
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          console.log('PDF generation completed, size:', pdfData.length);
          resolve(pdfData);
        });
        
        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

        // Header with company logo and info
        this.addHeader(doc);
        
        // Contract title
        this.addContractTitle(doc, contract);
        
        // Parties section
        this.addPartiesSection(doc, contract, motorcycle, party);
        
        // Vehicle details
        this.addVehicleDetails(doc, motorcycle);
        
        // Financial terms
        this.addFinancialTerms(doc, contract);
        
        // Terms and conditions
        this.addTermsAndConditions(doc, contract);
        
        // Signatures section
        this.addSignaturesSection(doc, contract);
        
        // Footer
        this.addFooter(doc);
        
        doc.end();
      } catch (error) {
        console.error('PDF generation catch error:', error);
        reject(error);
      }
    });
  }

  addHeader(doc) {
    // Company logo (if exists)
    const logoPath = path.join(process.cwd(), 'client', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 60, height: 60 });
    }
    
    // Company information
    doc.fontSize(16).font('Helvetica-Bold')
       .text(this.companyInfo.name, 120, 50);
    
    doc.fontSize(10).font('Helvetica')
       .text(this.companyInfo.address, 120, 75)
       .text(`Phone: ${this.companyInfo.phone}`, 120, 90)
       .text(`Email: ${this.companyInfo.email}`, 120, 105)
       .text(this.companyInfo.registration, 120, 120)
       .text(this.companyInfo.taxId, 120, 135);
    
    // Date
    doc.fontSize(10).font('Helvetica')
       .text(`Date: ${new Date().toLocaleDateString('en-TZ')}`, 400, 50);
  }

  addContractTitle(doc, contract) {
    doc.moveDown(3);
    doc.fontSize(18).font('Helvetica-Bold')
       .text(`${contract.type.toUpperCase()} AGREEMENT`, { align: 'center' });
    
    doc.fontSize(14).font('Helvetica-Bold')
       .text(`Contract No: ${contract.contractNumber}`, { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica')
       .text('This agreement is made and entered into on this day of ' + 
             new Date().toLocaleDateString('en-TZ') + 
             ' between the parties mentioned below.', { align: 'justify' });
  }

  addPartiesSection(doc, contract, motorcycle, party) {
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('PARTIES:');
    doc.moveDown(0.5);
    
    // Party A (Company)
    doc.fontSize(12).font('Helvetica-Bold').text('PARTY A:');
    doc.font('Helvetica').text(this.companyInfo.name);
    doc.text(this.companyInfo.address);
    doc.text(`Phone: ${this.companyInfo.phone}`);
    doc.text(`Email: ${this.companyInfo.email}`);
    
    doc.moveDown(1);
    
    // Party B (Customer/Supplier)
    doc.fontSize(12).font('Helvetica-Bold').text('PARTY B:');
    doc.font('Helvetica').text(party.name || party.fullName);
    if (party.address) doc.text(party.address);
    if (party.phone) doc.text(`Phone: ${party.phone}`);
    if (party.email) doc.text(`Email: ${party.email}`);
    if (party.idNumber) doc.text(`ID Number: ${party.idNumber}`);
  }

  addVehicleDetails(doc, motorcycle) {
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('VEHICLE DETAILS:');
    doc.moveDown(0.5);
    
    const vehicleInfo = [
      `Make: ${motorcycle.brand}`,
      `Model: ${motorcycle.model}`,
      `Year: ${motorcycle.year}`,
      `Chassis Number: ${motorcycle.chassisNumber}`,
      `Engine Number: ${motorcycle.engineNumber}`,
      `Color: ${motorcycle.color}`,
      `Mileage: ${motorcycle.mileage || 'N/A'} km`
    ];
    
    vehicleInfo.forEach(info => {
      doc.fontSize(12).font('Helvetica').text(info);
    });
  }

  addFinancialTerms(doc, contract) {
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('FINANCIAL TERMS:');
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica')
       .text(`Total Amount: ${contract.currency} ${contract.amount.toLocaleString()}`);
    
    doc.text(`Payment Method: ${contract.paymentMethod.replace('_', ' ').toUpperCase()}`);
    
    if (contract.paymentMethod === 'installment' && contract.installmentDetails) {
      const inst = contract.installmentDetails;
      doc.text(`Down Payment: ${contract.currency} ${inst.downPayment?.toLocaleString() || 'N/A'}`);
      doc.text(`Monthly Payment: ${contract.currency} ${inst.monthlyPayment?.toLocaleString() || 'N/A'}`);
      doc.text(`Duration: ${inst.duration || 'N/A'} months`);
      if (inst.interestRate) {
        doc.text(`Interest Rate: ${inst.interestRate}% per annum`);
      }
    }
  }

  addTermsAndConditions(doc, contract) {
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('TERMS AND CONDITIONS:');
    doc.moveDown(0.5);
    
    const standardTerms = [
      '1. The vehicle is sold in "as is" condition unless otherwise specified.',
      '2. All payments must be made in accordance with the agreed schedule.',
      '3. The buyer is responsible for all registration and insurance costs.',
      '4. Any modifications to this agreement must be made in writing and signed by both parties.',
      '5. This agreement is governed by the laws of Tanzania.',
      '6. Any disputes shall be resolved through arbitration or the courts of Tanzania.',
      '7. The seller warrants that they have clear title to the vehicle.',
      '8. The buyer agrees to inspect the vehicle before taking possession.',
      '9. Late payment penalties may apply as per the agreed terms.',
      '10. This contract is legally binding and enforceable in a court of law.'
    ];
    
    standardTerms.forEach(term => {
      doc.fontSize(11).font('Helvetica').text(term, { align: 'justify' });
    });
    
    // Custom terms if provided
    if (contract.terms) {
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('ADDITIONAL TERMS:');
      doc.fontSize(11).font('Helvetica').text(contract.terms, { align: 'justify' });
    }
  }

  addSignaturesSection(doc, contract) {
    doc.moveDown(3);
    doc.fontSize(14).font('Helvetica-Bold').text('SIGNATURES:');
    doc.moveDown(1);
    
    // Party A signature
    doc.fontSize(12).font('Helvetica-Bold').text('PARTY A (Company):');
    doc.moveDown(2);
    doc.text('Signature: _________________________');
    doc.text('Name: _________________________');
    doc.text('Title: _________________________');
    doc.text('Date: _________________________');
    doc.text('Stamp: [Company Stamp]');
    
    doc.moveDown(2);
    
    // Party B signature
    doc.fontSize(12).font('Helvetica-Bold').text('PARTY B (Customer/Supplier):');
    doc.moveDown(2);
    doc.text('Signature: _________________________');
    doc.text('Name: _________________________');
    doc.text('ID Number: _________________________');
    doc.text('Date: _________________________');
    doc.text('Witness: _________________________');
  }

  addFooter(doc) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;
    
    doc.fontSize(8).font('Helvetica')
       .text('This document is legally binding and enforceable in a court of law.', 
             50, footerY, { align: 'center' });
    
    doc.text('Generated by MR PIKIPIKI Trading Management System', 
             50, footerY + 15, { align: 'center' });
  }

  // Generate contract summary for quick reference
  generateContractSummary(contract) {
    return {
      contractNumber: contract.contractNumber,
      type: contract.type,
      amount: contract.amount,
      currency: contract.currency,
      status: contract.status,
      isFullyExecuted: contract.isFullyExecuted,
      ageInDays: contract.ageInDays,
      nextAction: this.getNextAction(contract)
    };
  }

  getNextAction(contract) {
    switch (contract.status) {
      case 'draft':
        return 'Ready for printing and signature';
      case 'pending_signature':
        return 'Awaiting signatures from both parties';
      case 'active':
        return 'Contract is active and being executed';
      case 'completed':
        return 'Contract completed successfully';
      case 'cancelled':
        return 'Contract has been cancelled';
      case 'breached':
        return 'Contract breach - legal action may be required';
      default:
        return 'Status unknown';
    }
  }
}

export default new ContractTemplateService();
