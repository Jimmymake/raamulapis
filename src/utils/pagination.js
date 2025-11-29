// src/utils/pagination.js

/**
 * Parse pagination parameters from request query
 * @param {object} query - Express request query object
 * @param {number} defaultLimit - Default items per page (default: 10)
 * @param {number} maxLimit - Maximum items per page (default: 100)
 * @returns {object} - { page, limit, offset }
 */
export function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || defaultLimit;

  // Ensure valid values
  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination response metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

