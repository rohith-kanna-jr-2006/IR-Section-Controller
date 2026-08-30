// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('buffering')))
  ) {
    console.warn('[AI Studio] Database offline — returning fallback response for', req.method, req.path);
    if (req.method === 'GET') {
      const isPlural = req.path.endsWith('s') || req.path.endsWith('s/') || req.path.includes('/list');
      return res.json(isPlural ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }

  console.error(err.stack || err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
