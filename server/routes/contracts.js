import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Contract from '../models/Contract.js';
import Motorcycle from '../models/Motorcycle.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize } from '../middleware/auth.js';
import contractTemplateService from '../services/contractTemplateService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/contracts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `contract-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Generate contract number
const generateContractNumber = async (type) => {
  const prefix = type === 'purchase' ? 'PC' : 'SC';
  const year = new Date().getFullYear();
  const count = await Contract.countDocuments({ type });
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Get all contracts with advanced filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      party, 
      motorcycle, 
      dateFrom, 
      dateTo, 
      signed, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (party) filter.party = party;
    if (motorcycle) filter.motorcycle = motorcycle;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    if (signed === 'true') {
      filter['signatures.partySignature.signed'] = true;
      filter['signatures.companySignature.signed'] = true;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contracts = await Contract.find(filter)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'username fullName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Contract.countDocuments(filter);
    
    console.log(`Found ${contracts.length} contracts out of ${total} total`);
    
    res.json({
      contracts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get contract by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'username fullName')
      .populate('lastModifiedBy', 'username fullName');
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Create new contract
router.post('/', authenticate, async (req, res) => {
  try {
    const contractData = {
      ...req.body,
      contractNumber: await generateContractNumber(req.body.type),
      createdBy: req.user._id,
      effectiveDate: req.body.effectiveDate || new Date(),
      status: 'draft'
    };
    
    const contract = new Contract(contractData);
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'username fullName');
    
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// Create contract with signed document (new workflow)
router.post('/with-document', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Signed contract document is required' });
    }

    // Parse JSON fields
    const installmentDetails = req.body.installmentDetails ? JSON.parse(req.body.installmentDetails) : {};
    const warranties = req.body.warranties ? JSON.parse(req.body.warranties) : [];
    const penalties = req.body.penalties ? JSON.parse(req.body.penalties) : [];

    const contractData = {
      type: req.body.type,
      motorcycle: req.body.motorcycle,
      party: req.body.party,
      amount: req.body.amount,
      currency: req.body.currency,
      date: req.body.date,
      effectiveDate: req.body.effectiveDate,
      expiryDate: req.body.expiryDate,
      paymentMethod: req.body.paymentMethod,
      installmentDetails,
      terms: req.body.terms,
      warranties,
      penalties,
      contractNumber: await generateContractNumber(req.body.type),
      createdBy: req.user._id,
      status: req.body.status || 'active', // Contract is active since it's signed
      documents: [{
        type: req.body.documentType || 'signed_contract',
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
        description: req.body.description || 'Signed contract document'
      }]
    };
    
    const contract = new Contract(contractData);
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('motorcycle')
      .populate('party')
      .populate('createdBy', 'username fullName');
    
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error('Error creating contract with document:', error);
    res.status(500).json({ error: 'Failed to create contract with document' });
  }
});

// Update contract
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    // Add to modification history
    const contract = await Contract.findById(req.params.id);
    if (contract) {
      updateData.$push = {
        modificationHistory: {
          modifiedAt: new Date(),
          modifiedBy: req.user._id,
          changes: JSON.stringify(req.body),
          reason: req.body.modificationReason || 'Contract updated'
        }
      };
    }
    
    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('motorcycle')
     .populate('party')
     .populate('createdBy', 'username fullName')
     .populate('lastModifiedBy', 'username fullName');
    
    if (!updatedContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(updatedContract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// Generate professional contract PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    console.log('Generating PDF for contract:', req.params.id);
    
    const contract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party');
    
    if (!contract) {
      console.log('Contract not found:', req.params.id);
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    console.log('Contract found:', contract.contractNumber);
    console.log('Motorcycle data:', contract.motorcycle);
    console.log('Party data:', contract.party);
    
    // Generate PDF using professional template
    const pdfBuffer = await contractTemplateService.generateContractPDF(
      contract, 
      contract.motorcycle, 
      contract.party
    );
    
    console.log('PDF generation completed, size:', pdfBuffer.length);
    console.log('PDF buffer type:', typeof pdfBuffer);
    console.log('PDF buffer is buffer:', Buffer.isBuffer(pdfBuffer));
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty or invalid');
    }
    
    // Record print history
    try {
      await Contract.findByIdAndUpdate(req.params.id, {
        $push: {
          printHistory: {
            printedAt: new Date(),
            printedBy: req.user._id,
            printCount: 1,
            reason: 'Contract PDF generated'
          }
        }
      });
    } catch (historyError) {
      console.warn('Failed to record print history:', historyError);
      // Don't fail the request for this
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.contractNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('Sending PDF response, size:', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Preview contract PDF
router.get('/:id/pdf/preview', authenticate, async (req, res) => {
  try {
    console.log('Generating PDF preview for contract:', req.params.id);
    
    const contract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party');
    
    if (!contract) {
      console.log('Contract not found:', req.params.id);
      return res.status(404).json({ error: 'Contract not found' });
    }

    console.log('Contract found:', contract.contractNumber);
    console.log('Motorcycle:', contract.motorcycle?.brand, contract.motorcycle?.model);
    console.log('Party:', contract.party?.name || contract.party?.fullName);
    
    // Generate PDF using professional template
    const pdfBuffer = await contractTemplateService.generateContractPDF(
      contract, 
      contract.motorcycle, 
      contract.party
    );
    
    console.log('PDF buffer size:', pdfBuffer.length);
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contract-${contract.contractNumber}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview' });
  }
});

// Upload signed contract document
router.post('/:id/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const documentData = {
      type: req.body.documentType || 'signed_contract',
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      description: req.body.description || 'Signed contract document'
    };
    
    await Contract.findByIdAndUpdate(req.params.id, {
      $push: { documents: documentData }
    });
    
    res.json({ message: 'Document uploaded successfully', document: documentData });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Update contract signatures
router.post('/:id/signatures', authenticate, async (req, res) => {
  try {
    const { signatureType, signatureData, witnessName, witnessSignature } = req.body;
    
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const updateData = {};
    
    if (signatureType === 'party') {
      updateData['signatures.partySignature'] = {
        signed: true,
        signedAt: new Date(),
        signatureImage: signatureData,
        witnessName,
        witnessSignature
      };
    } else if (signatureType === 'company') {
      updateData['signatures.companySignature'] = {
        signed: true,
        signedAt: new Date(),
        signedBy: req.user._id,
        signatureImage: signatureData
      };
    }
    
    // Update contract status based on signatures
    if (updateData['signatures.partySignature'] || updateData['signatures.companySignature']) {
      const updatedContract = await Contract.findByIdAndUpdate(req.params.id, updateData, { new: true });
      
      // Check if both parties have signed
      if (updatedContract.signatures.partySignature.signed && updatedContract.signatures.companySignature.signed) {
        await Contract.findByIdAndUpdate(req.params.id, { status: 'active' });
      } else {
        await Contract.findByIdAndUpdate(req.params.id, { status: 'pending_signature' });
      }
    }
    
    const finalContract = await Contract.findById(req.params.id)
      .populate('motorcycle')
      .populate('party');
    
    res.json(finalContract);
  } catch (error) {
    console.error('Error updating signatures:', error);
    res.status(500).json({ error: 'Failed to update signatures' });
  }
});

// Get contract documents
router.get('/:id/documents', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id).select('documents');
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract.documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Preview contract document
router.get('/:id/documents/:docId/preview', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const document = contract.documents.id(req.params.docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(document.filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream document' });
      }
    });
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({ error: 'Failed to preview document' });
  }
});

// Download contract document
router.get('/:id/documents/:docId', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const document = contract.documents.id(req.params.docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete contract (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Clean up uploaded files
    if (contract.documents) {
      contract.documents.forEach(doc => {
        if (fs.existsSync(doc.filePath)) {
          fs.unlinkSync(doc.filePath);
        }
      });
    }
    
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

// Get contract statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const stats = await Contract.aggregate([
      {
        $group: {
          _id: null,
          totalContracts: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          activeContracts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedContracts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingSignatures: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_signature'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const typeStats = await Contract.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      overview: stats[0] || {
        totalContracts: 0,
        totalValue: 0,
        activeContracts: 0,
        completedContracts: 0,
        pendingSignatures: 0
      },
      byType: typeStats
    });
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    res.status(500).json({ error: 'Failed to fetch contract statistics' });
  }
});

export default router;