import express from 'express';
import { analysisController } from '../controllers/analysisController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Master Analysis Execution
router.post('/investigations/:id/analyze', authenticateToken, analysisController.runAnalysis);
router.get('/investigations/:id/analysis-status', authenticateToken, analysisController.getAnalysisStatus);

// Knowledge Graph & Lineage
router.get('/investigations/:id/graph', authenticateToken, analysisController.getGraph);
router.get('/relationships/:id', authenticateToken, analysisController.getRelationshipProfile);

// Influence & Centrality Metrics
router.get('/investigations/:id/influence', authenticateToken, analysisController.getInfluence);

// Suspicious Pattern Detection
router.get('/investigations/:id/patterns', authenticateToken, analysisController.getPatterns);

// Investigation Timeline
router.get('/investigations/:id/timeline', authenticateToken, analysisController.getTimeline);

// Priority Leads & Human-in-the-Loop Decisions
router.get('/investigations/:id/leads', authenticateToken, analysisController.getLeads);
router.post('/leads/:id/decision', authenticateToken, analysisController.recordDecision);

// Grounded AI Investigator Assistant
router.post('/investigations/:id/assistant/query', authenticateToken, analysisController.queryAssistant);

export default router;
