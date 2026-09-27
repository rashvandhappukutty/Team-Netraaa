import db from '../config/db.js';

export function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;

    // Investigations metrics
    const totalInvestigations = db.get(`SELECT COUNT(*) as count FROM investigations`).count;
    const activeInvestigations = db.get(`SELECT COUNT(*) as count FROM investigations WHERE status = 'ACTIVE'`).count;
    const highPriorityInvestigations = db.get(`SELECT COUNT(*) as count FROM investigations WHERE priority IN ('HIGH', 'CRITICAL')`).count;
    const closedInvestigations = db.get(`SELECT COUNT(*) as count FROM investigations WHERE status = 'CLOSED'`).count;

    let myInvestigationsQuery = `
      SELECT COUNT(*) as count FROM investigations 
      WHERE lead_investigator_id = ? OR id IN (SELECT investigation_id FROM investigation_members WHERE user_id = ?)
    `;
    const myInvestigations = db.get(myInvestigationsQuery, [userId, userId]).count;

    // Data Sources metrics
    const totalDataSources = db.get(`SELECT COUNT(*) as count FROM data_sources`).count;
    const verifiedSources = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE integrity_status = 'VERIFIED'`).count;
    const totalNormalizedRecords = db.get(`SELECT COUNT(*) as count FROM normalized_records`).count;

    // Source Type Breakdown
    const firCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type = 'FIR_POLICE_REPORT'`).count;
    const cdrCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type = 'CDR'`).count;
    const financialCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type = 'FINANCIAL_TRANSACTIONS'`).count;
    const surveillanceCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type = 'SURVEILLANCE_REPORT'`).count;
    const criminalHistoryCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type = 'CRIMINAL_HISTORY'`).count;
    const intelReportsCount = db.get(`SELECT COUNT(*) as count FROM data_sources WHERE source_type IN ('SOCIAL_MEDIA_INTEL', 'OTHER')`).count;

    const sourceBreakdown = db.all(`
      SELECT source_type, COUNT(*) as count 
      FROM data_sources 
      GROUP BY source_type
    `);

    // Priority breakdown
    const priorityBreakdown = db.all(`
      SELECT priority, COUNT(*) as count 
      FROM investigations 
      GROUP BY priority
    `);

    // Recent investigations
    const recentInvestigations = db.all(`
      SELECT i.*, u.name as lead_investigator_name, u.badge_number as lead_badge,
        (SELECT COUNT(*) FROM data_sources ds WHERE ds.investigation_id = i.id) as source_count,
        (SELECT COUNT(*) FROM normalized_records nr WHERE nr.investigation_id = i.id) as normalized_record_count
      FROM investigations i
      JOIN users u ON i.lead_investigator_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 8
    `);

    return res.json({
      stats: {
        totalInvestigations,
        activeInvestigations,
        highPriorityInvestigations,
        closedInvestigations,
        myInvestigations,
        totalDataSources,
        verifiedSources,
        totalNormalizedRecords,
        firCount,
        cdrCount,
        financialCount,
        surveillanceCount,
        criminalHistoryCount,
        intelReportsCount
      },
      sourceBreakdown,
      priorityBreakdown,
      recentInvestigations
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
  }
}
