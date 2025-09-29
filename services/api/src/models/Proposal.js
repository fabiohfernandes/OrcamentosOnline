// Proposal Model
// ORION Agent - Backend Development
// OrçamentosOnline API Proposal Management

const { query, getClient } = require('./database');

/**
 * Proposal Model
 * Handles all proposal-related database operations
 */
class ProposalModel {

  /**
   * Create a new proposal
   * @param {Object} proposalData - Proposal data
   * @returns {Promise<Object>} Created proposal
   */
  static async create(proposalData) {
    const {
      title,
      client_name,
      client_email,
      presentation_url,
      commercial_url,
      scope_content,
      terms_content,
      user_id,
      username,
      password
    } = proposalData;

    const insertQuery = `
      INSERT INTO proposals (
        title, client_name, client_email, presentation_url, commercial_url,
        scope_content, terms_content, user_id, username, password,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', NOW(), NOW())
      RETURNING *
    `;

    const values = [
      title, client_name, client_email, presentation_url, commercial_url,
      scope_content, terms_content, user_id, username, password
    ];

    try {
      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Get proposal by ID
   * @param {string} id - Proposal ID
   * @returns {Promise<Object|null>} Proposal data
   */
  static async findById(id) {
    const selectQuery = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM proposals p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

    try {
      const result = await query(selectQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding proposal by ID:', error);
      throw error;
    }
  }

  /**
   * Get proposal by access token
   * @param {string} token - Access token (username)
   * @returns {Promise<Object|null>} Proposal data
   */
  static async findByToken(token) {
    const selectQuery = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM proposals p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.username = $1
    `;

    try {
      const result = await query(selectQuery, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding proposal by token:', error);
      throw error;
    }
  }

  /**
   * Get all proposals for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (page, limit, status)
   * @returns {Promise<Object>} Proposals data with pagination
   */
  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.user_id = $1';
    let values = [userId];

    if (status) {
      whereClause += ' AND p.status = $2';
      values.push(status);
    }

    const selectQuery = `
      SELECT p.*, u.name as user_name, u.email as user_email,
             COUNT(*) OVER() as total_count
      FROM proposals p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    try {
      const result = await query(selectQuery, values);
      const proposals = result.rows;
      const totalCount = proposals.length > 0 ? parseInt(proposals[0].total_count) : 0;

      return {
        proposals: proposals.map(p => {
          const { total_count, ...proposal } = p;
          return proposal;
        }),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error finding proposals by user ID:', error);
      throw error;
    }
  }

  /**
   * Update proposal
   * @param {string} id - Proposal ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated proposal
   */
  static async update(id, updateData) {
    const allowedFields = [
      'title', 'client_name', 'client_email', 'presentation_url', 'commercial_url',
      'scope_content', 'terms_content', 'status', 'username', 'password'
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
    values.push(id);

    const updateQuery = `
      UPDATE proposals
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error updating proposal:', error);
      throw error;
    }
  }

  /**
   * Delete proposal
   * @param {string} id - Proposal ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Delete related comments first
      await client.query('DELETE FROM comments WHERE proposal_id = $1', [id]);

      // Delete related analytics
      await client.query('DELETE FROM analytics WHERE proposal_id = $1', [id]);

      // Delete the proposal
      const result = await client.query('DELETE FROM proposals WHERE id = $1', [id]);

      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error deleting proposal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate proposal credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object|null>} Proposal if valid
   */
  static async validateCredentials(username, password) {
    try {
      const proposal = await this.findByToken(username);
      if (!proposal) {
        return null;
      }

      // For development, we're storing plain text passwords
      // In production, these should be hashed
      if (proposal.password === password) {
        return proposal;
      }

      return null;
    } catch (error) {
      console.error('❌ Error validating proposal credentials:', error);
      throw error;
    }
  }

  /**
   * Get proposal statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  static async getStats(userId) {
    const statsQuery = `
      SELECT
        COUNT(*) as total_proposals,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'viewed' THEN 1 END) as viewed_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COALESCE(AVG(CASE WHEN status = 'approved' THEN 1.0 ELSE 0.0 END), 0) as conversion_rate
      FROM proposals
      WHERE user_id = $1
    `;

    try {
      const result = await query(statsQuery, [userId]);
      const stats = result.rows[0];

      return {
        total_proposals: parseInt(stats.total_proposals),
        draft_count: parseInt(stats.draft_count),
        sent_count: parseInt(stats.sent_count),
        viewed_count: parseInt(stats.viewed_count),
        approved_count: parseInt(stats.approved_count),
        rejected_count: parseInt(stats.rejected_count),
        conversion_rate: parseFloat(stats.conversion_rate)
      };
    } catch (error) {
      console.error('❌ Error getting proposal stats:', error);
      throw error;
    }
  }

  /**
   * Get recent proposals for dashboard
   * @param {string} userId - User ID
   * @param {number} limit - Number of proposals to return
   * @returns {Promise<Array>} Recent proposals
   */
  static async getRecent(userId, limit = 5) {
    const selectQuery = `
      SELECT id, title, client_name, status, created_at, updated_at
      FROM proposals
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2
    `;

    try {
      const result = await query(selectQuery, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting recent proposals:', error);
      throw error;
    }
  }

  /**
   * Update proposal status
   * @param {string} id - Proposal ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated proposal
   */
  static async updateStatus(id, status) {
    const updateQuery = `
      UPDATE proposals
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await query(updateQuery, [status, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error updating proposal status:', error);
      throw error;
    }
  }
}

module.exports = ProposalModel;