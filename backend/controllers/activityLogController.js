const asyncHandler = require("express-async-handler");
const ActivityLog = require("../models/ActivityLog");

const getActivityLogs = asyncHandler(async (req, res) => {
  const { module, role, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (module) filter.module = module;
  if (role) filter.role = role;

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(200, Number(limit));

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize),
    ActivityLog.countDocuments(filter),
  ]);

  res.json({ success: true, message: "Activity logs fetched", data: { logs, total, page: pageNum, pages: Math.ceil(total / pageSize) } });
});

module.exports = { getActivityLogs };
