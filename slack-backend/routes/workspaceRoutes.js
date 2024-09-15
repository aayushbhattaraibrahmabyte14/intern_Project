const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Step 1: Request Workspace Creation
router.post('/request', authenticate, workspaceController.requestWorkspaceCreation);

// Step 2: Verify OTP and Redirect to Profile Creation
router.post('/verify-otp', workspaceController.verifyOTP);

// Step 3: Create Profile
router.post('/create-profile', authenticate, workspaceController.createProfile);

// Step 4: Set Company Name and Generate Invite Link
router.post('/set-company-name', authenticate, upload.single('companyPhoto'), workspaceController.setCompanyName);

// Step 5: Add Team Members or Skip
router.post('/add-team-members', authenticate, workspaceController.addTeamMembers);

// Step 6: Vi-ew Team Members (Optional)
router.get('/view-teammembers', authenticate, workspaceController.viewTeamMembers);

// Step 7: Specify Team Work (Create Channel)
router.post('/create-channel', authenticate, workspaceController.specifyTeamWork);

// Step 8: Finalize Workspace Creation
router.post('/finalize-workspace', authenticate, workspaceController.finalizeWorkspace);

//getuserWorkspaces
router.get('/user-workspaces', authenticate, workspaceController. getUserWorkspaces);

//Route to create multiple channels in a workspace
router.post('/workspaces/:workspaceId/channels', authenticate, workspaceController.createMultipleChannels);


router.post('/:workspaceId/add-member',authenticate, workspaceController.addMemberToWorkspace);
router.delete('/workspace/:workspaceId/remove-member/:memberId',authenticate, workspaceController.removeMemberFromWorkspace);
router.get('/:workspaceId/members',authenticate, workspaceController.getWorkspaceMembers);

// Route to launch a specific workspace by ID
router.get('/launch-workspace/:workspaceId', authenticate, workspaceController.launchWorkspaceById);
router.get("/workspacedd/:workspaceId", workspaceController.getWorkspaceById);

module.exports = router;
