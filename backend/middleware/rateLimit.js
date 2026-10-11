// Small dependency-free in-memory rate limiter.
// Fine for a single Node process; use a shared store (Redis) if you scale to many instances.
const createLimiter = ({ windowMs, max, keyFn, message = "Too many requests. Please try again later.", countFailuresOnly = false }) => {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, Math.min(windowMs, 60_000));
  timer.unref();

  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    if (entry.count >= max) {
      res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message });
    }
    if (countFailuresOnly) {
      res.on("finish", () => { if (res.statusCode >= 400) entry.count++; });
    } else {
      entry.count++;
    }
    next();
  };
};

module.exports = { createLimiter };
