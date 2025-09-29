// Client Model
// ORION Agent - Backend Development
// OrçamentosOnline API Client Management

const { query, getClient } = require('./database');

/**
 * Client Model
 * Handles client-related database operations (comments, analytics, interactions)
 */
class ClientModel {

  /**
   * Add a comment to a proposal
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Created comment
   */
  static async addComment(commentData) {
    const {
      proposal_id,
      client_name,
      client_email,
      comment_text,
      page_section
    } = commentData;

    const insertQuery = `
      INSERT INTO comments (
        proposal_id, client_name, client_email, comment_text, page_section, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const values = [proposal_id, client_name, client_email, comment_text, page_section];

    try {
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Array>} Comments array
   */
  static async getComments(proposalId) {
    const selectQuery = `
      SELECT *
      FROM comments
      WHERE proposal_id = $1
      ORDER BY created_at ASC
    `;

    try {
      const result = await query(selectQuery, [proposalId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Track client activity (page views, time spent)
   * @param {Object} activityData - Activity tracking data
   * @returns {Promise<Object>} Created analytics record
   */
  static async trackActivity(activityData) {
    const {
      proposal_id,
      event_type,
      page_number,
      time_spent,
      client_ip,
      user_agent
    } = activityData;

    const insertQuery = `
      INSERT INTO analytics (
        proposal_id, event_type, page_number, time_spent, client_ip, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const values = [proposal_id, event_type, page_number, time_spent, client_ip, user_agent];

    try {
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error tracking activity:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Analytics summary
   */
  static async getAnalytics(proposalId) {
    const analyticsQuery = `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT client_ip) as unique_visitors,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COALESCE(SUM(time_spent), 0) as total_time_spent,
        COALESCE(AVG(time_spent), 0) as avg_time_spent,
        MAX(created_at) as last_activity,
        MIN(created_at) as first_activity
      FROM analytics
      WHERE proposal_id = $1
    `;

    const pageBreakdownQuery = `
      SELECT
        page_number,
        COUNT(*) as views,
        COALESCE(SUM(time_spent), 0) as total_time,
        COALESCE(AVG(time_spent), 0) as avg_time
      FROM analytics
      WHERE proposal_id = $1 AND event_type = 'page_view'
      GROUP BY page_number
      ORDER BY page_number
    `;

    try {
      const [analyticsResult, pageBreakdownResult] = await Promise.all([
        query(analyticsQuery, [proposalId]),
        query(pageBreakdownQuery, [proposalId])
      ]);

      const analytics = analyticsResult.rows[0];
      const pageBreakdown = pageBreakdownResult.rows;

      return {
        summary: {
          total_events: parseInt(analytics.total_events),
          unique_visitors: parseInt(analytics.unique_visitors),
          page_views: parseInt(analytics.page_views),
          total_time_spent: parseInt(analytics.total_time_spent),
          avg_time_spent: parseFloat(analytics.avg_time_spent),
          last_activity: analytics.last_activity,
          first_activity: analytics.first_activity
        },
        page_breakdown: pageBreakdown.map(page => ({
          page_number: parseInt(page.page_number),
          views: parseInt(page.views),
          total_time: parseInt(page.total_time),
          avg_time: parseFloat(page.avg_time)
        }))
      };
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Approve a proposal (client acceptance)
   * @param {string} proposalId - Proposal ID
   * @param {Object} approvalData - Approval data
   * @returns {Promise<Object>} Approval record
   */
  static async approveProposal(proposalId, approvalData = {}) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Update proposal status to approved
      await client.query(
        'UPDATE proposals SET status = $1, updated_at = NOW() WHERE id = $2',
        ['approved', proposalId]
      );

      // Track the approval activity
      await client.query(`
        INSERT INTO analytics (
          proposal_id, event_type, page_number, client_ip, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [proposalId, 'approval', 4, approvalData.client_ip, approvalData.user_agent]);

      await client.query('COMMIT');

      return {
        proposal_id: proposalId,
        status: 'approved',
        approved_at: new Date().toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error approving proposal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get activity timeline for a proposal
   * @param {string} proposalId - Proposal ID
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Activity timeline
   */
  static async getActivityTimeline(proposalId, limit = 50) {
    const timelineQuery = `
      SELECT
        'analytics' as source,
        event_type,
        page_number,
        time_spent,
        client_ip,
        created_at,
        NULL as comment_text,
        NULL as client_name
      FROM analytics
      WHERE proposal_id = $1

      UNION ALL

      SELECT
        'comments' as source,
        'comment' as event_type,
        NULL as page_number,
        NULL as time_spent,
        NULL as client_ip,
        created_at,
        comment_text,
        client_name
      FROM comments
      WHERE proposal_id = $1

      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await query(timelineQuery, [proposalId, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting activity timeline:', error);
      throw error;
    }
  }

  /**
   * Check if proposal has been viewed
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<boolean>} Whether proposal has been viewed
   */
  static async hasBeenViewed(proposalId) {
    const checkQuery = `
      SELECT COUNT(*) as view_count
      FROM analytics
      WHERE proposal_id = $1 AND event_type = 'page_view'
      LIMIT 1
    `;

    try {
      const result = await query(checkQuery, [proposalId]);
      return parseInt(result.rows[0].view_count) > 0;
    } catch (error) {
      console.error('❌ Error checking if proposal viewed:', error);
      throw error;
    }
  }

  /**
   * Get client engagement score for a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Engagement metrics
   */
  static async getEngagementScore(proposalId) {
    const engagementQuery = `
      SELECT
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(DISTINCT page_number) as pages_viewed,
        COALESCE(SUM(time_spent), 0) as total_time,
        COUNT(CASE WHEN event_type = 'approval' THEN 1 END) as approvals,
        (SELECT COUNT(*) FROM comments WHERE proposal_id = $1) as comments_count
      FROM analytics
      WHERE proposal_id = $1
    `;

    try {
      const result = await query(engagementQuery, [proposalId]);
      const data = result.rows[0];

      const pageViews = parseInt(data.page_views);
      const pagesViewed = parseInt(data.pages_viewed);
      const totalTime = parseInt(data.total_time);
      const approvals = parseInt(data.approvals);
      const commentsCount = parseInt(data.comments_count);

      // Calculate engagement score (0-100)
      let score = 0;

      // Page views contribute up to 30 points
      score += Math.min(30, pageViews * 5);

      // Pages viewed (out of 4) contribute up to 20 points
      score += (pagesViewed / 4) * 20;

      // Time spent contributes up to 25 points (5 minutes = max)
      score += Math.min(25, (totalTime / 300) * 25);

      // Comments contribute up to 15 points
      score += Math.min(15, commentsCount * 5);

      // Approval contributes 10 points
      score += approvals > 0 ? 10 : 0;

      return {
        engagement_score: Math.round(score),
        metrics: {
          page_views: pageViews,
          pages_viewed: pagesViewed,
          total_time_seconds: totalTime,
          comments_count: commentsCount,
          approved: approvals > 0
        }
      };
    } catch (error) {
      console.error('❌ Error calculating engagement score:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENT ENTITY MANAGEMENT METHODS
  // ============================================================================

  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @param {string} userId - User ID who owns the client
   * @returns {Promise<Object>} Created client
   */
  static async create(clientData, userId) {
    const {
      name,
      email,
      phone,
      company,
      position,
      location,
      notes,
      tags = [],
      status = 'active'
    } = clientData;

    const insertQuery = `
      INSERT INTO clients (
        user_id, name, email, phone, company, position,
        location, notes, tags, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      userId, name, email, phone, company, position,
      location, notes, tags, status
    ];

    try {
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Client with this email already exists');
      }
      console.error('❌ Error creating client:', error);
      throw error;
    }
  }

  /**
   * List clients with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Clients list with pagination
   */
  static async list(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = 'name',
      order = 'asc'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.user_id = $1';
    let values = [userId];
    let paramCount = 1;

    // Add status filter
    if (status && ['active', 'inactive', 'prospect'].includes(status)) {
      paramCount++;
      whereClause += ` AND c.status = $${paramCount}`;
      values.push(status);
    }

    // Add search filter
    if (search && typeof search === 'string' && search.trim()) {
      paramCount++;
      whereClause += ` AND (
        c.name ILIKE $${paramCount} OR
        c.email ILIKE $${paramCount} OR
        c.company ILIKE $${paramCount}
      )`;
      values.push(`%${search.trim()}%`);
    }

    // Build main query with stats
    const selectQuery = `
      SELECT
        c.*,
        COUNT(p.id) as total_proposals,
        COALESCE(SUM(p.proposal_value), 0) as total_value,
        COUNT(CASE WHEN p.status = 'closed' THEN 1 END) as closed_proposals,
        CASE
          WHEN COUNT(p.id) > 0 THEN
            ROUND(COUNT(CASE WHEN p.status = 'closed' THEN 1 END) * 100.0 / COUNT(p.id), 2)
          ELSE 0
        END as conversion_rate,
        MAX(p.updated_at) as last_contact
      FROM clients c
      LEFT JOIN proposals p ON c.email = p.client_email AND c.user_id = p.user_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.${sort} ${order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM clients c
      ${whereClause}
    `;

    try {
      const [clientsResult, countResult] = await Promise.all([
        query(selectQuery, values),
        query(countQuery, values.slice(0, paramCount))
      ]);

      const clients = clientsResult.rows.map(client => ({
        ...client,
        total_proposals: parseInt(client.total_proposals),
        total_value: parseFloat(client.total_value),
        closed_proposals: parseInt(client.closed_proposals),
        conversion_rate: parseFloat(client.conversion_rate),
        tags: client.tags || []
      }));

      const total = parseInt(countResult.rows[0].total);

      return {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error('❌ Error listing clients:', error);
      throw error;
    }
  }

  /**
   * Get client by ID
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Client data
   */
  static async findById(clientId, userId) {
    const selectQuery = `
      SELECT
        c.*,
        COUNT(p.id) as total_proposals,
        COALESCE(SUM(p.proposal_value), 0) as total_value,
        COUNT(CASE WHEN p.status = 'closed' THEN 1 END) as closed_proposals,
        CASE
          WHEN COUNT(p.id) > 0 THEN
            ROUND(COUNT(CASE WHEN p.status = 'closed' THEN 1 END) * 100.0 / COUNT(p.id), 2)
          ELSE 0
        END as conversion_rate,
        MAX(p.updated_at) as last_contact
      FROM clients c
      LEFT JOIN proposals p ON c.email = p.client_email AND c.user_id = p.user_id
      WHERE c.id = $1 AND c.user_id = $2
      GROUP BY c.id
    `;

    try {
      const result = await query(selectQuery, [clientId, userId]);
      if (result.rows.length === 0) {
        return null;
      }

      const client = result.rows[0];
      return {
        ...client,
        total_proposals: parseInt(client.total_proposals),
        total_value: parseFloat(client.total_value),
        closed_proposals: parseInt(client.closed_proposals),
        conversion_rate: parseFloat(client.conversion_rate),
        tags: client.tags || []
      };
    } catch (error) {
      console.error('❌ Error finding client by ID:', error);
      throw error;
    }
  }

  /**
   * Update client
   * @param {string} clientId - Client ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Updated client
   */
  static async update(clientId, updateData, userId) {
    const allowedFields = [
      'name', 'email', 'phone', 'company', 'position',
      'location', 'notes', 'tags', 'status'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updateData[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(clientId, userId);

    const updateQuery = `
      UPDATE clients
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    try {
      const result = await query(updateQuery, values);
      if (result.rows.length === 0) {
        return null;
      }
      return {
        ...result.rows[0],
        tags: result.rows[0].tags || []
      };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Client with this email already exists');
      }
      console.error('❌ Error updating client:', error);
      throw error;
    }
  }

  /**
   * Delete client
   * @param {string} clientId - Client ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(clientId, userId) {
    const deleteQuery = `
      DELETE FROM clients
      WHERE id = $1 AND user_id = $2
    `;

    try {
      const result = await query(deleteQuery, [clientId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      throw error;
    }
  }

  /**
   * Search clients
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Search results
   */
  static async search(userId, searchTerm, limit = 10) {
    const searchQuery = `
      SELECT id, name, email, company, position, status
      FROM clients
      WHERE user_id = $1 AND (
        name ILIKE $2 OR
        email ILIKE $2 OR
        company ILIKE $2 OR
        position ILIKE $2
      )
      ORDER BY name ASC
      LIMIT $3
    `;

    try {
      const result = await query(searchQuery, [userId, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error searching clients:', error);
      throw error;
    }
  }

  /**
   * Get client statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Client statistics
   */
  static async getStats(userId) {
    const statsQuery = `
      SELECT
        COUNT(*) as total_clients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_clients,
        COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospect_clients,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
      FROM clients
      WHERE user_id = $1
    `;

    try {
      const result = await query(statsQuery, [userId]);
      const stats = result.rows[0];

      return {
        total_clients: parseInt(stats.total_clients),
        active_clients: parseInt(stats.active_clients),
        inactive_clients: parseInt(stats.inactive_clients),
        prospect_clients: parseInt(stats.prospect_clients),
        new_this_month: parseInt(stats.new_this_month)
      };
    } catch (error) {
      console.error('❌ Error getting client stats:', error);
      throw error;
    }
  }
}

module.exports = ClientModel;