# 🤖 AI Assistant Development Rules

## ⚠️ CRITICAL: Read This First

This document contains **MANDATORY RULES** that you **MUST FOLLOW** when assisting with this project. Failure to follow these rules may result in breaking the development environment or corrupting the project.

---

## 📜 Core Rules

### Rule 1: Virtual Environment Check (CRITICAL)

**BEFORE executing ANY command that requires Python or Node.js packages, you MUST:**

1. **Check if virtual environment is active**
2. **If NOT active, STOP and instruct the user to activate it**
3. **NEVER proceed without confirmation**

#### Commands That REQUIRE Virtual Environment Check:

- `npm install`
- `npm start`
- `npm run [any script]`
- `node server.js`
- `python [any script]`
- `pip install [anything]`
- Any package manager command
- Any script execution

#### How to Check Virtual Environment Status

**For Node.js Projects (this project):**

```bash
# Check if node_modules exists
ls node_modules 2>/dev/null || echo "Dependencies not installed"

# Check current directory
pwd

# Verify package.json exists
ls package.json 2>/dev/null || echo "Not in project root"
```

**For Python Projects (future integration):**

```bash
# Windows
echo $env:VIRTUAL_ENV

# Linux/macOS
echo $VIRTUAL_ENV
```

#### Virtual Environment Activation Template

**If virtual environment is NOT active, provide these instructions:**

````markdown
⚠️ **STOP: Virtual Environment Not Active**

Before proceeding, you need to activate the virtual environment.

**For Node.js (This Project):**

1. Navigate to project directory:
   ```bash
   cd H:\Coding_Projects\video-analytics-system
   ```
````

2. Verify you're in the correct location:

   ```bash
   # Windows (PowerShell)
   Get-Location

   # Should show: H:\Coding_Projects\video-analytics-system
   ```

3. Check dependencies are installed:

   ```bash
   # Check if node_modules exists
   Test-Path .\node_modules

   # If FALSE, run:
   npm install
   ```

**For Python (Future Integration):**

1. Navigate to project directory
2. Activate virtual environment:

   ```bash
   # Windows
   .\venv\Scripts\Activate.ps1
   # or
   venv\Scripts\activate.bat

   # Linux/macOS
   source venv/bin/activate
   ```

3. Verify activation:

   ```bash
   # Windows
   echo $env:VIRTUAL_ENV

   # Linux/macOS
   echo $VIRTUAL_ENV
   ```

**Once activated, you should see:**

- `(venv)` prefix in your terminal prompt (Python)
- Successful path verification for Node.js

Now you can proceed with the command.

````

---

### Rule 2: Always Verify Project Directory

**BEFORE any file operations or commands:**

1. Verify current working directory is correct
2. Check that required files exist
3. Confirm user is in the right location

**Required Checks:**
```bash
# Windows (PowerShell)
Get-Location
Get-ChildItem server.js, package.json

# Linux/macOS
pwd
ls -la server.js package.json
````

**If files are missing:**

````markdown
⚠️ **STOP: You're not in the correct directory**

Expected location: H:\Coding_Projects\video-analytics-system

Please navigate there:

```bash
cd H:\Coding_Projects\video-analytics-system
```
````

Then verify with:

```bash
# Windows
Get-ChildItem

# Linux/macOS
ls -la
```

You should see: server.js, package.json, public/, node_modules/

````

---

### Rule 3: Pre-Flight Checklist

**BEFORE executing ANY command, complete this checklist:**

```markdown
✅ Pre-Flight Checklist:

1. [ ] Confirmed current directory: H:\Coding_Projects\video-analytics-system
2. [ ] Verified required files exist (server.js, package.json)
3. [ ] Checked virtual environment status (if needed)
4. [ ] Confirmed user wants to proceed with this action
5. [ ] Explained what the command will do
6. [ ] Warned of any potential side effects

Only proceed when ALL items are checked.
````

---

### Rule 4: Never Assume - Always Confirm

**NEVER assume:**

- ❌ Virtual environment is active
- ❌ Dependencies are installed
- ❌ User is in the correct directory
- ❌ Previous commands succeeded
- ❌ Configuration is correct

**ALWAYS confirm:**

- ✅ Current directory location
- ✅ Virtual environment status
- ✅ File existence before operations
- ✅ User wants to proceed
- ✅ Previous command completed successfully

---

### Rule 5: Explain Before Executing

**BEFORE running any command, explain:**

1. **What it does**: Brief description
2. **Why it's needed**: Purpose and goal
3. **What will happen**: Expected outcome
4. **Potential risks**: Any side effects or warnings
5. **How to verify**: How to check if it worked

**Template:**

```markdown
📋 **Command Explanation**

**Command:** `[COMMAND HERE]`

**What it does:** [DESCRIPTION]

**Why we need it:** [PURPOSE]

**Expected outcome:** [WHAT WILL HAPPEN]

**Potential risks:** [WARNINGS OR "None"]

**How to verify:** [VERIFICATION STEPS]

Do you want to proceed? (yes/no)
```

---

### Rule 6: Error Handling Protocol

**When a command fails:**

1. **STOP immediately** - don't try to fix it automatically
2. **Read the error message** carefully
3. **Diagnose the issue** - what went wrong?
4. **Check common causes**:
   - Not in correct directory?
   - Virtual environment not active?
   - Dependencies not installed?
   - Permission issues?
   - Port already in use?
5. **Provide clear solution** with explanation
6. **Ask user to try the solution**
7. **Verify it worked** before proceeding

**Error Response Template:**

```markdown
❌ **Command Failed**

**Error Message:**
```

[ERROR TEXT]

````

**Diagnosis:** [WHAT WENT WRONG]

**Common Causes:**
1. [CAUSE 1]
2. [CAUSE 2]
3. [CAUSE 3]

**Solution:**

**Step 1:** [FIRST THING TO TRY]
```bash
[COMMAND]
````

**Step 2:** [SECOND THING IF FIRST FAILS]

```bash
[COMMAND]
```

**Verification:**

```bash
[HOW TO CHECK IF FIXED]
```

Let me know the result and we'll proceed accordingly.

````

---

### Rule 7: File Operations Safety

**BEFORE modifying any files:**

1. **Confirm the file path** is correct
2. **Backup if necessary** (for important files)
3. **Show the changes** before applying
4. **Get user approval** for destructive operations
5. **Verify the change** after applying

**For destructive operations (delete, overwrite):**
```markdown
⚠️ **DESTRUCTIVE OPERATION WARNING**

You're about to: [ACTION]

This will:
- [CONSEQUENCE 1]
- [CONSEQUENCE 2]

**Files affected:**
- [FILE 1]
- [FILE 2]

**This action is IRREVERSIBLE.**

Please confirm:
1. Have you backed up important data? (yes/no)
2. Are you sure you want to proceed? (yes/no)

Type "CONFIRM" to proceed or "CANCEL" to abort.
````

---

### Rule 8: Dependency Management

**When installing/updating packages:**

1. **Check virtual environment first** (Rule 1)
2. **Verify package.json exists**
3. **Show what will be installed**
4. **Explain why it's needed**
5. **Warn about potential conflicts**
6. **Verify installation after completion**

**Installation Template:**

````markdown
📦 **Package Installation**

**Environment Check:**

- [ ] Virtual environment active: [YES/NO]
- [ ] In project directory: [YES/NO]
- [ ] package.json exists: [YES/NO]

**Packages to install:**

- [PACKAGE 1] - [PURPOSE]
- [PACKAGE 2] - [PURPOSE]

**Command:**

```bash
npm install [PACKAGES]
```
````

**Size estimate:** ~[SIZE] MB
**Time estimate:** ~[TIME] seconds

**Potential issues:**

- [ISSUE 1 IF ANY]
- [ISSUE 2 IF ANY]

Ready to proceed? (yes/no)

````

---

### Rule 9: Server Operations

**When starting/stopping the server:**

1. **Check if server is already running**
2. **Verify port is available** (3000 by default)
3. **Explain how to stop it**
4. **Provide access URL**
5. **Monitor for errors**

**Server Start Template:**
```markdown
🚀 **Starting Server**

**Pre-checks:**
1. Checking if port 3000 is available...
2. Verifying dependencies installed...
3. Confirming configuration valid...

**Command:**
```bash
npm start
````

**Expected output:**

```
🎥 Video Analytics Server Running!
📡 Access the app at: http://localhost:3000
```

**How to access:**
Open browser → http://localhost:3000

**How to stop:**
Press `Ctrl + C` in this terminal

**Troubleshooting:**
If port 3000 is in use:

1. Find process using port: `netstat -ano | findstr :3000`
2. Kill process: `taskkill /PID [PID] /F`
3. Or change port in server.js

Proceed with starting server? (yes/no)

````

---

### Rule 10: Code Changes Protocol

**When writing or modifying code:**

1. **Understand the requirement** fully
2. **Review existing code** to match style
3. **Show the change** with before/after
4. **Explain the logic** briefly
5. **Point out any caveats**
6. **Suggest testing steps**

**Code Change Template:**
```markdown
💻 **Code Modification**

**File:** `[FILE PATH]`

**Purpose:** [WHAT THIS CHANGE DOES]

**Changes:**

**Before:**
```javascript
[OLD CODE]
````

**After:**

```javascript
[NEW CODE]
```

**Explanation:** [WHY THIS WORKS]

**Testing:**

1. [TEST STEP 1]
2. [TEST STEP 2]

**Potential issues:** [WARNINGS OR "None"]

Apply this change? (yes/no)

````

---

## 🎯 Workflow for Common Tasks

### Task: Installing Dependencies

```markdown
1. ✅ Check current directory
   ```bash
   Get-Location  # Should be H:\Coding_Projects\video-analytics-system
````

2. ✅ Verify package.json exists

   ```bash
   Test-Path .\package.json
   ```

3. ✅ Check if dependencies already installed

   ```bash
   Test-Path .\node_modules
   ```

4. ✅ If NOT installed, proceed with installation

   ```bash
   npm install
   ```

5. ✅ Verify installation succeeded
   ```bash
   npm list --depth=0
   ```

````

---

### Task: Starting the Application

```markdown
1. ✅ Check current directory
   ```bash
   Get-Location
````

2. ✅ Verify dependencies installed

   ```bash
   Test-Path .\node_modules
   ```

   **If FALSE:** Run `npm install` first

3. ✅ Check if server already running

   ```bash
   netstat -ano | findstr :3000
   ```

   **If found:** Stop existing server first

4. ✅ Start the server

   ```bash
   npm start
   ```

5. ✅ Verify server started
   - Look for success message
   - Check browser: http://localhost:3000

6. ✅ Explain how to stop
   - Press `Ctrl + C`

````

---

### Task: Adding a New Feature

```markdown
1. ✅ Understand requirement
   - Ask clarifying questions
   - Confirm understanding

2. ✅ Review relevant files
   - Identify where changes needed
   - Check existing patterns

3. ✅ Plan the implementation
   - Outline steps
   - Identify potential issues

4. ✅ Show proposed changes
   - Display code with context
   - Explain logic

5. ✅ Get user approval
   - Wait for confirmation
   - Answer questions

6. ✅ Apply changes
   - Make modifications
   - Verify syntax

7. ✅ Suggest testing
   - Provide test steps
   - Expected results

8. ✅ Update documentation
   - Modify relevant MD files
   - Keep docs in sync
````

---

### Task: Debugging an Issue

```markdown
1. ✅ Gather information
   - What's the error message?
   - What were you doing?
   - What did you expect?

2. ✅ Reproduce the issue
   - Can you make it happen again?
   - What are the exact steps?

3. ✅ Check environment
   - Correct directory?
   - Virtual env active?
   - Dependencies installed?
   - Server running?

4. ✅ Review error logs
   - Browser console
   - Server terminal
   - Network tab

5. ✅ Diagnose root cause
   - Analyze the error
   - Check related code
   - Look for patterns

6. ✅ Propose solution
   - Explain what's wrong
   - Show fix with code
   - Explain why it works

7. ✅ Apply and verify
   - Make the fix
   - Test thoroughly
   - Confirm resolved
```

---

## 📋 Command Reference with Checks

### Node.js/npm Commands

```markdown
**npm install**
├─ ✅ Check: Current directory
├─ ✅ Check: package.json exists
├─ ⚠️ Warn: Will install packages
└─ ✅ Verify: Installation succeeded

**npm start**
├─ ✅ Check: Current directory
├─ ✅ Check: Dependencies installed
├─ ✅ Check: Port 3000 available
└─ ✅ Explain: How to stop (Ctrl+C)

**npm run [script]**
├─ ✅ Check: Current directory
├─ ✅ Check: Script exists in package.json
└─ ✅ Explain: What the script does

**node server.js**
├─ ✅ Check: Current directory
├─ ✅ Check: server.js exists
├─ ✅ Check: Dependencies installed
└─ ✅ Check: Port available
```

---

### File Operations

```markdown
**Creating Files**
├─ ✅ Check: Directory exists
├─ ✅ Check: File doesn't already exist
├─ ⚠️ Warn: If overwriting
└─ ✅ Show: File content preview

**Modifying Files**
├─ ✅ Check: File exists
├─ ✅ Show: Before and after
├─ ✅ Explain: What changed
└─ ⚠️ Warn: If destructive

**Deleting Files**
├─ ⚠️ STOP: Get confirmation
├─ ⚠️ Warn: Irreversible
├─ ✅ Check: File exists
└─ ✅ Confirm: User approval
```

---

### Python Commands (Future Integration)

```markdown
**pip install [package]**
├─ ⚠️ CRITICAL: Check virtual env active
├─ ✅ If NOT active: STOP and instruct activation
├─ ✅ Check: requirements.txt if exists
├─ ✅ Show: What will be installed
└─ ✅ Verify: Import works after install

**python [script]**
├─ ⚠️ CRITICAL: Check virtual env active
├─ ✅ If NOT active: STOP and instruct activation
├─ ✅ Check: Script file exists
├─ ✅ Check: Dependencies installed
└─ ✅ Explain: What script does

**Creating venv**
├─ ✅ Check: Not already exists
├─ ✅ Explain: Purpose and location
├─ ✅ Show: Activation commands
└─ ✅ Verify: Creation succeeded
```

---

## 🚨 Red Flags - STOP Immediately

**If you encounter any of these, STOP and alert the user:**

1. ❌ **User not in correct directory**
   - Don't proceed with file operations
   - Show current location
   - Provide navigation commands

2. ❌ **Virtual environment not active** (when required)
   - Don't run package installations
   - Show activation instructions
   - Wait for confirmation

3. ❌ **Dependencies not installed**
   - Don't try to run the app
   - Show installation command
   - Verify after install

4. ❌ **Port already in use**
   - Don't start another server
   - Show how to check/kill process
   - Or suggest alternate port

5. ❌ **Permission denied errors**
   - Don't retry with sudo/admin
   - Explain the issue
   - Suggest proper solution

6. ❌ **Missing critical files**
   - Don't create dummy files
   - Alert about corruption
   - Suggest restoration steps

7. ❌ **Syntax errors in code**
   - Don't apply the change
   - Show the error
   - Provide corrected version

8. ❌ **Destructive operation requested**
   - Don't proceed automatically
   - Show warnings
   - Require explicit confirmation

---

## ✅ Quality Checklist for Responses

**Before sending ANY response, verify:**

- [ ] Did I check virtual environment status (if needed)?
- [ ] Did I verify current directory?
- [ ] Did I explain what the command does?
- [ ] Did I warn about potential risks?
- [ ] Did I show code changes clearly?
- [ ] Did I provide verification steps?
- [ ] Did I ask for confirmation (if needed)?
- [ ] Is my response clear and actionable?
- [ ] Did I follow the templates?
- [ ] Am I being helpful but safe?

---

## 📝 Response Templates

### Template: Safe Command Execution

````markdown
🔧 **Executing Command**

**Environment Verification:**
✅ Current directory: H:\Coding_Projects\video-analytics-system
✅ Required files present: [YES/NO]
✅ Virtual environment: [N/A for Node.js / ACTIVE for Python]

**Command:**

```bash
[COMMAND HERE]
```
````

**Purpose:** [WHAT IT DOES]

**Expected outcome:** [RESULT]

**To verify success:**

```bash
[VERIFICATION COMMAND]
```

Executing now...

````

---

### Template: Blocked Action

```markdown
🛑 **Action Blocked - Safety Check Failed**

**Issue:** [WHAT'S WRONG]

**Current Status:**
- Directory: [PATH]
- Virtual Env: [STATUS]
- Dependencies: [STATUS]

**Required:**
- [REQUIREMENT 1]
- [REQUIREMENT 2]

**Next Steps:**

1. [STEP 1 TO FIX]
   ```bash
   [COMMAND]
````

2. [STEP 2 IF NEEDED]
   ```bash
   [COMMAND]
   ```

Once completed, we can proceed with: [ORIGINAL ACTION]

````

---

### Template: Feature Implementation

```markdown
🎨 **Feature Implementation Plan**

**Feature:** [NAME/DESCRIPTION]

**Impact Analysis:**
- Files to modify: [LIST]
- New files to create: [LIST]
- Dependencies needed: [LIST OR "None"]
- Potential breaking changes: [LIST OR "None"]

**Implementation Steps:**

**Step 1: [FIRST STEP]**
```javascript
// [CODE]
````

[EXPLANATION]

**Step 2: [SECOND STEP]**

```javascript
// [CODE]
```

[EXPLANATION]

**Testing Plan:**

1. [TEST 1]
2. [TEST 2]

**Rollback Plan:**
If something goes wrong: [HOW TO UNDO]

Ready to implement? (yes/no)

```

---

## 🎓 Learning From Mistakes

**If a command fails or causes issues:**

1. **Acknowledge it**: "That didn't work as expected"
2. **Analyze why**: What went wrong?
3. **Document it**: Add to known issues if relevant
4. **Prevent it**: What check could have prevented this?
5. **Fix it**: Provide solution
6. **Update rules**: Should this rule be added/modified?

---

## 🔄 Continuous Improvement

**This document should be updated when:**

- New patterns emerge
- Common mistakes identified
- Better practices discovered
- Project structure changes
- New tools/dependencies added

**Maintain this document** as a living guide, not a static rule book.

---

## 🎯 Success Metrics

**You're following these rules successfully when:**

✅ No commands executed in wrong directory
✅ No package operations without venv check
✅ No unexpected errors from missing deps
✅ No files modified without explanation
✅ No destructive operations without confirmation
✅ User always knows what's happening and why
✅ Issues are caught before they cause problems
✅ Code changes are clear and well-explained

---

## 📞 When in Doubt

**If you're unsure about anything:**

1. **STOP** - Don't guess or proceed
2. **ASK** - Request clarification from user
3. **RESEARCH** - Check the project docs
4. **EXPLAIN** - Share your uncertainty
5. **SUGGEST** - Offer options with pros/cons
6. **WAIT** - Get confirmation before acting

**It's better to ask than to break something.**

---

**END OF AI ASSISTANT RULES**

**Remember: Safety First, Helpfulness Second.**

*Last Updated: 2025-11-06*
```
