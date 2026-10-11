const asyncHandler = require("express-async-handler");
const XLSX = require("xlsx");
const User = require("../models/User");
const Student = require("../models/Student");
const Branch = require("../models/Branch");
const { isAdminRole } = require("../utils/roles");
const { branchIdsForDepartment } = require("../utils/scope");
const { ensureFeeAccount } = require("../utils/feeService");

const populateOpts = [{ path: "user", select: "name email phone status" }, { path: "branch" }];

// @desc    Get all students (with search & filters). HOD is restricted to
//          their own department regardless of what branch filter is sent.
// @route   GET /api/students
// @access  Private (admin, hod, faculty)
const getStudents = asyncHandler(async (req, res) => {
  const { search, branch, year, semester, section, status } = req.query;

  const studentFilter = {};
  if (req.user.role === "hod") {
    if (!req.user.department) { res.status(403); throw new Error("Your account has no department assigned"); }
    const branchIds = await branchIdsForDepartment(req.user.department);
    studentFilter.branch = branch && branchIds.some((b) => String(b) === branch) ? branch : { $in: branchIds };
  } else if (branch) studentFilter.branch = branch;
  if (year) studentFilter.year = Number(year);
  if (semester) studentFilter.semester = Number(semester);
  if (section) studentFilter.section = section;

  let students = await Student.find(studentFilter).populate(populateOpts).sort({ createdAt: -1 });

  if (search) {
    const term = search.toLowerCase();
    students = students.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(term) ||
        s.user?.email?.toLowerCase().includes(term) ||
        s.rollNumber?.toLowerCase().includes(term)
    );
  }

  if (status) {
    students = students.filter((s) => s.user?.status === status);
  }

  res.json({ success: true, message: "Students fetched", data: students });
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate(populateOpts);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  if (req.user.role === "student" && String(student.user._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view another student's record");
  }
  if (req.user.role === "hod") {
    const { assertHodOwnsBranch } = require("../utils/scope");
    await assertHodOwnsBranch(req, student.branch);
  }

  res.json({ success: true, message: "Student fetched", data: student });
});

// @desc    Get logged-in student's own profile
// @route   GET /api/students/me
// @access  Private (student)
const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(populateOpts);
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }
  res.json({ success: true, message: "Profile fetched", data: student });
});

// @desc    Create a student (creates User + Student together) in the
//          request body.
//          request body, only from the authenticated admin's own record.
// @route   POST /api/students
// @access  Private (admin)
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, password, rollNumber, branch, year, semester, section, status } =
    req.body;

  if (!name || !email || !password || !rollNumber || !branch || !year || !semester) {
    res.status(400);
    throw new Error("Missing required student fields");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  // Confirm the chosen branch actually exists.
  const branchDoc = await Branch.findById(branch);
  if (!branchDoc) {
    res.status(400);
    throw new Error("Invalid branch");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: "student",
    status: status || "active",
  });

  const student = await Student.create({
    user: user._id,
    rollNumber,
    branch,
    year,
    semester,
    section,
  });

  // Every new student automatically gets the mandatory college fee. If the
  // admin hasn't configured a college fee for this year yet, the student is
  // still created; the fee is attached the first time their fee account is
  // opened after it's configured (ensureFeeAccount is idempotent).
  try {
    await ensureFeeAccount(student._id, undefined, req.user._id);
  } catch (err) {
    console.error("Could not create fee account for new student:", err.message);
  }

  const populated = await Student.findById(student._id).populate(populateOpts);

  res.status(201).json({ success: true, message: "Student created", data: populated });
});

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (admin) or the student themself (limited fields)
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  const isSelf = req.user.role === "student" && String(student.user) === String(req.user._id);
  const isAdmin = isAdminRole(req.user.role);

  if (!isSelf && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this student");
  }

  if (isSelf && !isAdmin) {
    const { phone } = req.body;
    if (phone !== undefined) {
      await User.findByIdAndUpdate(student.user, { phone });
    }
  }

  if (isAdmin) {
    const { rollNumber, branch, year, semester, section, name, email, phone, status } = req.body;

    if (branch !== undefined) {
      const branchDoc = await Branch.findById(branch);
      if (!branchDoc) {
        res.status(400);
        throw new Error("Invalid branch");
      }
      student.branch = branch;
    }
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (year !== undefined) student.year = year;
    if (semester !== undefined) student.semester = semester;
    if (section !== undefined) student.section = section;
    await student.save();

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email.toLowerCase();
    if (phone !== undefined) userUpdates.phone = phone;
    if (status !== undefined) userUpdates.status = status;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(student.user, userUpdates);
    }
  }

  const updated = await Student.findById(student._id).populate(populateOpts);
  res.json({ success: true, message: "Student updated", data: updated });
});

// @desc    Reset a student's password (e.g. if a bulk-imported password got
//          mangled by Excel stripping leading zeros from a numeric value).
// @route   PUT /api/students/:id/reset-password
// @access  Admin
const resetStudentPassword = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }
  // Load as a document (not findByIdAndUpdate) so the pre("save") hash hook runs.
  const user = await User.findById(student.user);
  if (!user) {
    res.status(404);
    throw new Error("This student has no linked account");
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password reset", data: {} });
});

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private (admin)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  await User.findByIdAndDelete(student.user);
  await student.deleteOne();
  res.json({ success: true, message: "Student deleted", data: {} });
});

// @desc    Bulk-import students from an uploaded .xlsx/.xls/.csv file.
//          Expected columns (case-sensitive header row):
//          Name | Email | Phone | Password | RollNumber | BranchCode | Year | Semester | Section
// @route   POST /api/students/bulk-import
// @access  Private (admin)
const bulkImportStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a .xlsx, .xls, or .csv file");
  }

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  // raw: false reads each cell's *displayed* text rather than its underlying
  // value - this avoids floating-point artifacts on numeric cells, though it
  // can't recover leading zeros Excel already stripped at data-entry time
  // (that only happens if the column was formatted as Text before typing).
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

  // A strong signal that a password/roll-number column lost leading zeros:
  // the cell's raw underlying value (what Excel actually stored) is shorter
  // than its displayed text, or is purely numeric where the import expects
  // an exact string. We re-read raw:true in parallel just to compare.
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

  if (rows.length === 0) {
    res.status(400);
    throw new Error("The uploaded file has no data rows");
  }

  // Cache branches so we're not hitting the DB per row.
  const branches = await Branch.find({});
  const branchByCode = new Map(branches.map((b) => [b.code.toUpperCase(), b]));

  const results = { total: rows.length, successCount: 0, errorCount: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 = header row + 1-indexing, matches what the admin sees in Excel
    const row = rows[i];
    const rawRow = rawRows[i] || {};

    const name = String(row.Name || "").trim();
    const email = String(row.Email || "").trim().toLowerCase();
    const phone = String(row.Phone || "").trim();
    const password = String(row.Password || "").trim();
    const rollNumber = String(row.RollNumber || "").trim().toUpperCase();
    const branchCode = String(row.BranchCode || "").trim().toUpperCase();
    const year = Number(row.Year);
    const semester = Number(row.Semester);
    const section = String(row.Section || "A").trim();

    const rowError = (message) => {
      results.errorCount++;
      results.errors.push({ row: rowNum, rollNumber: rollNumber || "(missing)", message });
    };

    // If Excel stored a cell as a genuine Number type (rather than Text),
    // any leading zeros the admin typed are ALREADY gone from the file by
    // the time we read it - there is no way to recover "000456" once Excel
    // has turned it into the number 456. We can't detect that specific loss
    // after the fact, but a numeric-typed Password or RollNumber cell is
    // itself a strong risk signal worth stopping on, since a roll number or
    // password that's meant to preserve leading zeros should never have been
    // a Number cell in the first place.
    if (typeof rawRow.Password === "number") {
      rowError(
        `The Password column for this row is stored as a NUMBER in the spreadsheet (${rawRow.Password}), not text. ` +
          `If this password was meant to have leading zeros, they are already lost - format the Password column as "Text" in Excel, re-type the value, and re-upload.`
      );
      continue;
    }
    if (typeof rawRow.RollNumber === "number") {
      rowError(
        `The RollNumber column for this row is stored as a NUMBER in the spreadsheet (${rawRow.RollNumber}), not text. ` +
          `If this roll number was meant to have leading zeros, they are already lost - format the RollNumber column as "Text" in Excel, re-type the value, and re-upload.`
      );
      continue;
    }

    if (!name || !email || !password || !rollNumber || !branchCode || !year || !semester) {
      rowError("Missing one or more required fields (Name, Email, Password, RollNumber, BranchCode, Year, Semester)");
      continue;
    }
    if (password.length < 6) {
      rowError("Password must be at least 6 characters");
      continue;
    }
    const branchDoc = branchByCode.get(branchCode);
    if (!branchDoc) {
      rowError(`No branch with code "${branchCode}" exists`);
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      rowError(`Email "${email}" is already in use`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      rowError(`Roll number "${rollNumber}" is already in use`);
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const user = await User.create({
        name,
        email,
        phone,
        password,
        role: "student",
            status: "active",
      });
      // eslint-disable-next-line no-await-in-loop
      const createdStudent = await Student.create({
        user: user._id,
        rollNumber,
        branch: branchDoc._id,
        year,
        semester,
        section,
      });
      try {
        // eslint-disable-next-line no-await-in-loop
        await ensureFeeAccount(createdStudent._id, undefined, req.user._id);
      } catch (feeErr) {
        console.error("Could not create fee account for imported student:", feeErr.message);
      }
      results.successCount++;
    } catch (err) {
      rowError(err.message || "Unknown error creating this student");
    }
  }

  res.json({
    success: true,
    message: `Imported ${results.successCount} of ${results.total} students`,
    data: results,
  });
});

module.exports = {
  getStudents,
  getStudentById,
  getMyStudentProfile,
  createStudent,
  updateStudent,
  resetStudentPassword,
  deleteStudent,
  bulkImportStudents,
};
