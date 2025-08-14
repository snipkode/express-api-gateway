-- SQLite
SELECT 
  COALESCE(url.rate_limit, s.rate_limit) AS effective_rate_limit
FROM services s
JOIN permissions p ON p.service_id = s.id
LEFT JOIN user_rate_limits url ON url.user_id = ? AND url.service_id = s.id
WHERE s.id = ? AND p.user_id = ?