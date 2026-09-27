import db from '../config/db.js';
import { runMasterAnalysisPipeline } from '../services/masterAnalysisPipeline.js';
import { getInvestigationGraph } from '../services/graphAnalysisService.js';
import { getInvestigationPatterns } from '../services/patternDetectionService.js';
import { getInvestigationTimeline } from '../services/timelineService.js';
import { getInvestigationLeads, recordLeadDecision } from '../services/leadGenerationService.js';
import { queryInvestigationAssistant } from '../services/aiAssistantService.js';

/**
 * Controller for NETRA Master Intelligence Analysis Pipeline & Capabilities
 */
export const analysisController = {
  // Run complete 9-stage analysis pipeline
  async runAnalysis(req, res) {
    try {
      const invId = req.params.id;
      const userId = req.user?.id || 1;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await runMasterAnalysisPipeline(invId, userId, ipAddress);
      res.json(result);
    } catch (err) {
      console.error('Master analysis error:', err);
      res.status(500).json({ error: err.message || 'Analysis pipeline execution failed.' });
    }
  },

  // Get current analysis status and hero card telemetry
  async getAnalysisStatus(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT * FROM investigations WHERE investigation_id = ?', [invId])
        : db.get('SELECT * FROM investigations WHERE id = ?', [invId]);

      if (!inv) {
        return res.status(404).json({ error: 'Investigation not found.' });
      }

      const sourcesCount = db.get('SELECT COUNT(*) as c FROM data_sources WHERE investigation_id = ?', [inv.id]).c;
      const entitiesCount = db.get('SELECT COUNT(*) as c FROM master_entities WHERE investigation_id = ?', [inv.id]).c;
      const relsCount = db.get('SELECT COUNT(*) as c FROM relationships WHERE investigation_id = ?', [inv.id]).c;
      const patternsCount = db.get('SELECT COUNT(*) as c FROM detected_patterns WHERE investigation_id = ?', [inv.id]).c;
      const leadsCount = db.get('SELECT COUNT(*) as c FROM priority_leads WHERE investigation_id = ?', [inv.id]).c;

      res.json({
        investigation_id: inv.investigation_id,
        analysis_status: inv.analysis_status || 'NOT_STARTED',
        analyzed_at: inv.analyzed_at,
        metrics: {
          data_sources: sourcesCount,
          entities: entitiesCount,
          relationships: relsCount,
          networks: 4,
          anomalies: patternsCount,
          priority_leads: leadsCount
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get Knowledge Graph visualization payload
  async getGraph(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const graphData = getInvestigationGraph(inv.id);
      res.json(graphData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get detailed profile of a single relationship with full evidence lineage
  async getRelationshipProfile(req, res) {
    try {
      const relId = req.params.id;
      const rel = isNaN(relId)
        ? db.get(`
            SELECT r.*,
              s.canonical_name as source_name, s.entity_type as source_type, s.entity_id as source_code,
              t.canonical_name as target_name, t.entity_type as target_type, t.entity_id as target_code
            FROM relationships r
            JOIN master_entities s ON r.source_entity_id = s.id
            JOIN master_entities t ON r.target_entity_id = t.id
            WHERE r.relationship_id = ?
          `, [relId])
        : db.get(`
            SELECT r.*,
              s.canonical_name as source_name, s.entity_type as source_type, s.entity_id as source_code,
              t.canonical_name as target_name, t.entity_type as target_type, t.entity_id as target_code
            FROM relationships r
            JOIN master_entities s ON r.source_entity_id = s.id
            JOIN master_entities t ON r.target_entity_id = t.id
            WHERE r.id = ?
          `, [relId]);

      if (!rel) return res.status(404).json({ error: 'Relationship not found.' });

      // Fetch supporting evidence items
      const evidence = db.all(`
        SELECT re.*, ds.data_source_id as source_code, ds.file_name, ds.source_type
        FROM relationship_evidence re
        JOIN data_sources ds ON re.data_source_id = ds.id
        WHERE re.relationship_id = ?
        ORDER BY re.timestamp ASC
      `, [rel.id]);

      res.json({
        relationship: {
          ...rel,
          supporting_sources: typeof rel.supporting_sources === 'string' ? JSON.parse(rel.supporting_sources) : rel.supporting_sources,
          metadata: typeof rel.metadata === 'string' ? JSON.parse(rel.metadata) : rel.metadata
        },
        evidence
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get network influence ranking & centrality metrics
  async getInfluence(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const metrics = db.all(`
        SELECT nm.*, me.canonical_name, me.entity_type, me.entity_id, me.confidence_score as resolution_confidence
        FROM network_metrics nm
        JOIN master_entities me ON nm.master_entity_id = me.id
        WHERE nm.investigation_id = ?
        ORDER BY nm.influence_score DESC, nm.degree DESC
      `, [inv.id]);

      res.json({
        total: metrics.length,
        key_individuals: metrics
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get detected suspicious patterns
  async getPatterns(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const patterns = getInvestigationPatterns(inv.id);
      res.json({ patterns });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get correlated chronological timeline events
  async getTimeline(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const events = getInvestigationTimeline(inv.id, req.query);
      res.json({ events });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get priority investigative leads
  async getLeads(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const leads = getInvestigationLeads(inv.id);
      res.json({ leads });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Record investigator human-in-the-loop decision
  async recordDecision(req, res) {
    try {
      const leadId = req.params.id;
      const { decision, notes } = req.body;
      const userId = req.user?.id || 1;
      const ipAddress = req.ip || '127.0.0.1';

      if (!decision) {
        return res.status(400).json({ error: 'Decision parameter is required.' });
      }

      const updatedLead = await recordLeadDecision(leadId, decision, notes, userId, ipAddress);
      res.json({
        message: `Investigator decision [${decision}] recorded successfully.`,
        lead: updatedLead
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Query Grounded AI Investigator Assistant
  async queryAssistant(req, res) {
    try {
      const invId = req.params.id;
      const inv = isNaN(invId)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [invId])
        : { id: parseInt(invId, 10) };

      if (!inv) return res.status(404).json({ error: 'Investigation not found.' });

      const { query } = req.body;
      const response = await queryInvestigationAssistant(inv.id, query);
      res.json(response);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
