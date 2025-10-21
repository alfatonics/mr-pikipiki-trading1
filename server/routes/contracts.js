import express from 'express';
import PDFDocument from 'pdfkit';
import Contract from '../models/Contract.js';
import Motorcycle from '../models/Motorcycle.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Generate contract number
const generateContractNumber = async (type) => {
  const prefix = type === 'purchase' ? 'PC' : 'SC';
  const year = new Date().getFullYear();
  const count = await Contract.countDocuments({ type });
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Get all contracts
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const contracts = await Contract.find(filter)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'fullName username')
      .populate('printedBy', 'fullName username')
      .sort('-createdAt');
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get single contract
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'fullName username')
      .populate('printedBy', 'fullName username');
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Create new contract
router.post('/', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    // Validate required fields
    const { type, motorcycle, party, amount, paymentMethod } = req.body;
    
    if (!type || !motorcycle || !party || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, motorcycle, party, amount, paymentMethod' 
      });
    }

    // Check if motorcycle exists
    const motorcycleExists = await Motorcycle.findById(motorcycle);
    if (!motorcycleExists) {
      return res.status(400).json({ error: 'Motorcycle not found' });
    }

    // Check if party exists
    const partyModel = type === 'purchase' ? 'Supplier' : 'Customer';
    const partyExists = await (partyModel === 'Supplier' ? Supplier : Customer).findById(party);
    if (!partyExists) {
      return res.status(400).json({ error: `${partyModel} not found` });
    }

    // For sale contracts, check if motorcycle is available
    if (type === 'sale' && motorcycleExists.status !== 'in_stock') {
      return res.status(400).json({ 
        error: 'Motorcycle is not available for sale. Current status: ' + motorcycleExists.status 
      });
    }

    const contractNumber = await generateContractNumber(type);
    
    const contract = new Contract({
      ...req.body,
      partyModel,
      contractNumber,
      createdBy: req.user._id
    });
    
    await contract.save();
    
    // Update motorcycle status if it's a sale contract
    if (type === 'sale') {
      await Motorcycle.findByIdAndUpdate(motorcycle, {
        status: 'sold',
        customer: party,
        saleDate: req.body.date || new Date(),
        sellingPrice: amount
      });
      
      // Update customer total purchases
      await Customer.findByIdAndUpdate(party, {
        $inc: { totalPurchases: 1 }
      });
    } else {
      // Update supplier total supplied
      await Supplier.findByIdAndUpdate(party, {
        $inc: { totalSupplied: 1 }
      });
    }
    
    const populated = await Contract.findById(contract._id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'fullName username');
    
    res.status(201).json(populated);
  } catch (error) {
    console.error('Contract creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Contract number already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation error: ' + errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create contract: ' + error.message });
  }
});

// Update contract
router.put('/:id', authenticate, authorize('admin', 'sales'), async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('motorcycle party createdBy printedBy');
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// Mark contract as printed
router.post('/:id/print', authenticate, authorize('admin', 'secretary'), async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        printedBy: req.user._id,
        printedAt: new Date()
      },
      { new: true }
    ).populate('motorcycle party createdBy printedBy');
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark contract as printed' });
  }
});

// Generate PDF contract
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    console.log('Generating PDF for contract:', req.params.id);
    
    const contract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'fullName');
    
    if (!contract) {
      console.log('Contract not found:', req.params.id);
      return res.status(404).json({ error: 'Contract not found' });
    }

    console.log('Contract found:', contract.contractNumber);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contract-${contract.contractNumber}.pdf`);
    
    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    // Handle PDF generation errors
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'PDF generation failed' });
      }
    });
    
    // Pipe PDF to response
    doc.pipe(res);

    // Try to add logo if it exists
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      const logoPath = path.join(__dirname, '../../client/public/logo.png');
      
      console.log('Checking for logo at:', logoPath);
      
      if (fs.existsSync(logoPath)) {
        console.log('Logo found! Adding to PDF...');
        // Logo exists, add it to PDF centered
        const logoX = (doc.page.width - 100) / 2;
        doc.image(logoPath, logoX, doc.y, { width: 100 });
        doc.moveDown(6);
      } else {
        console.log('Logo not found. Using text header.');
        // No logo, just use text header
        doc.fontSize(20).text('MR PIKIPIKI TRADING', { align: 'center' });
        doc.moveDown();
      }
    } catch (err) {
      console.log('Error loading logo:', err.message);
      // If error loading logo, use text header
      doc.fontSize(20).text('MR PIKIPIKI TRADING', { align: 'center' });
      doc.moveDown();
    }

    doc.fontSize(12).text('Dar es Salaam, Ubungo Riverside-Kibangu', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(`${contract.type === 'purchase' ? 'PURCHASE' : 'SALES'} CONTRACT`, { align: 'center', underline: true });
    doc.moveDown();
    
    // Contract details
    doc.fontSize(12);
    doc.text(`Contract Number: ${contract.contractNumber || 'N/A'}`);
    doc.text(`Date: ${contract.date ? new Date(contract.date).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();
    
    // Party details
    doc.fontSize(14).text(contract.type === 'purchase' ? 'Supplier Details:' : 'Customer Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${contract.party?.name || contract.party?.fullName || 'N/A'}`);
    doc.text(`Phone: ${contract.party?.phone || 'N/A'}`);
    doc.text(`Address: ${contract.party?.address || 'N/A'}`);
    doc.moveDown();
    
    // Motorcycle details
    doc.fontSize(14).text('Motorcycle Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Brand: ${contract.motorcycle?.brand || 'N/A'}`);
    doc.text(`Model: ${contract.motorcycle?.model || 'N/A'}`);
    doc.text(`Year: ${contract.motorcycle?.year || 'N/A'}`);
    doc.text(`Color: ${contract.motorcycle?.color || 'N/A'}`);
    doc.text(`Chassis Number: ${contract.motorcycle?.chassisNumber || 'N/A'}`);
    doc.text(`Engine Number: ${contract.motorcycle?.engineNumber || 'N/A'}`);
    doc.moveDown();
    
    // Financial details
    doc.fontSize(14).text('Financial Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Amount: TZS ${contract.amount ? contract.amount.toLocaleString() : 'N/A'}`);
    doc.text(`Payment Method: ${contract.paymentMethod ? contract.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}`);
    
    if (contract.paymentMethod === 'installment' && contract.installmentDetails) {
      doc.moveDown(0.5);
      doc.text(`Down Payment: TZS ${contract.installmentDetails.downPayment ? contract.installmentDetails.downPayment.toLocaleString() : 'N/A'}`);
      doc.text(`Monthly Payment: TZS ${contract.installmentDetails.monthlyPayment ? contract.installmentDetails.monthlyPayment.toLocaleString() : 'N/A'}`);
      doc.text(`Duration: ${contract.installmentDetails.duration || 'N/A'} months`);
    }
    
    doc.moveDown();
    
    // Terms and conditions
    if (contract.terms) {
      doc.fontSize(14).text('Terms and Conditions:', { underline: true });
      doc.fontSize(10);
      doc.text(contract.terms);
      doc.moveDown();
    }
    
    // Signatures
    doc.moveDown(2);
    doc.fontSize(12);
    doc.text('_____________________', 100, doc.y);
    doc.text('_____________________', 350, doc.y - 12);
    doc.text('MR PIKIPIKI TRADING', 100, doc.y + 5);
    doc.text(contract.type === 'purchase' ? 'Supplier Signature' : 'Customer Signature', 350, doc.y - 12);
    
    // Finalize PDF
    doc.end();
    
    console.log('PDF generation completed for contract:', contract.contractNumber);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
    }
  }
});

// Test PDF generation
router.get('/test-pdf', authenticate, async (req, res) => {
  try {
    console.log('Testing PDF generation...');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test-contract.pdf');
    
    const doc = new PDFDocument({ margin: 50 });
    
    doc.on('error', (error) => {
      console.error('Test PDF error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Test PDF failed' });
      }
    });
    
    doc.pipe(res);
    
    doc.fontSize(20).text('MR PIKIPIKI TRADING', { align: 'center' });
    doc.fontSize(12).text('Test PDF Generation', { align: 'center' });
    doc.moveDown();
    doc.text('This is a test PDF to verify PDFKit is working correctly.');
    doc.text('If you can see this, PDF generation is working!');
    
    doc.end();
    
    console.log('Test PDF generated successfully');
  } catch (error) {
    console.error('Test PDF error:', error);
    res.status(500).json({ error: 'Test PDF failed: ' + error.message });
  }
});

export default router;
