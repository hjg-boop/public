const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Department = require("../models/Department");
const Branch = require("../models/Branch");
const Document = require("../models/Document");
const Notice = require("../models/Notice");
const { isAdminRole } = require("../utils/roles");
const { branchIdsForDepartment } = require("../utils/scope");

const rx = (q) => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

// @desc  One global search box, grouped by type. HOD results are restricted
//        to their own department; students/accountants get a narrower set.
// @route GET /api/search?q=...
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) {
    return res.json({ success: true, message: "Search results", data: {} });
  }
  const pattern = rx(q);
  const role = req.user.role;
  const canSeePeople = isAdminRole(role) || role === "hod" || role === "faculty" || role === "accountant";

  let branchIds = null;
  if (role === "hod") {
    if (!req.user.department) return res.json({ success: true, message: "Search results", data: {} });
    branchIds = await branchIdsForDepartment(req.user.department);
  }

  const tasks = {};
  if (canSeePeople) {
    const studentFilter = { rollNumber: pattern };
    if (branchIds) studentFilter.branch = { $in: branchIds };
    tasks.students = Student.find(studentFilter).populate("user", "name email").populate("branch", "code").limit(8);

    if (role !== "accountant") {
      const facultyFilter = { employeeId: pattern };
      if (role === "hod") facultyFilter.department = req.user.department;
      tasks.faculty = Faculty.find(facultyFilter).populate("user", "name email").limit(8);
    }
  }
  if (role !== "accountant") {
    const subjectFilter = { $or: [{ subjectName: pattern }, { subjectCode: pattern }] };
    if (role === "hod") subjectFilter.department = req.user.department;
    tasks.subjects = Subject.find(subjectFilter).limit(8);
  }
  if (isAdminRole(role)) {
    tasks.departments = Department.find({ $or: [{ name: pattern }, { code: pattern }] }).limit(8);
    tasks.branches = Branch.find({ $or: [{ name: pattern }, { code: pattern }] }).limit(8);
  }
  tasks.documents = Document.find({ title: pattern }).limit(8);
  tasks.notices = Notice.find({ title: pattern }).limit(8);

  const keys = Object.keys(tasks);
  const results = await Promise.all(Object.values(tasks));
  const data = {};
  keys.forEach((k, i) => { if (results[i].length) data[k] = results[i]; });

  res.json({ success: true, message: "Search results", data });
});

module.exports = { globalSearch };
