const mongoose = require('mongoose');
const Workspace = require('../models/Workspace'); // Ensure this is declared only once
const Invite = require('../models/Invite');
const User = require('../models/User');
const Channel = require('../models/Channels');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const generateInviteToken = () => crypto.randomBytes(20).toString('hex');

// Helper function to handle errors
const handleError = (res, error, message = 'Server error') => {
console.error(message, error);
res.status(500).json({ message, error });
};

// Step 1: Request Workspace Creation
const requestWorkspaceCreation = async (req, res) => {
  const { email } = req.body;
    const userId = req.user.id;

    try {
        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        const invite = new Invite({
            email,
            token: otp,
            expiresAt: otpExpires,
            createdBy: userId
        });

        await invite.save();
        await sendEmail(email, 'Workspace Creation OTP', `Your OTP code is ${otp}. It is valid for 10 minutes.`);
        res.status(200).json({ message: 'OTP sent to email for workspace creation' });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 2: Verify OTP and Redirect to Profile Creation
const verifyOTP = async (req, res) => {
    const { otp } = req.body;

    try {
        const invite = await Invite.findOne({ token: otp });

        if (!invite) return res.status(400).json({ message: 'Invalid OTP' });
        if (invite.expiresAt < Date.now()) return res.status(400).json({ message: 'OTP expired' });

        res.status(200).json({ message: 'OTP verified successfully', redirectUrl: '/create-profile' });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 3: Create Profile
const createProfile = async (req, res) => {
    const { fullName, photo } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findByIdAndUpdate(userId, {
            fullName,
            profilePicture: photo || undefined
        }, { new: true });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'Profile created successfully', redirectUrl: '/create-workspace' });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 4: Set Company Name and Generate Invite Link
const setCompanyName = async (req, res) => {
    const { companyName } = req.body;
    const companyPhoto = req.file;
    const userId = req.user.id;

    if (!companyName) return res.status(400).json({ message: 'Company name is required' });

    try {
        const workspace = new Workspace({
            name: companyName,
            logo: companyPhoto ? companyPhoto.path : undefined,
            createdBy: userId,
            members: [userId] // Include the creator as a member
        });

        await workspace.save();
        const inviteLink = `${process.env.BASE_URL}/add-team-members/${workspace._id}`;
        await sendEmail(req.user.email, 'Team Invitation Link', `Here is your invite link: ${inviteLink}`);
        res.status(200).json({ message: 'Company name set successfully', inviteLink, redirectUrl: `/workspace-setup/${workspace._id}` });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 5: Add Team Members or Skip
const addTeamMembers = async (req, res) => {
    const { members } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await Workspace.findOne({ createdBy: userId });
        if (!workspace) return res.status(400).json({ message: 'Workspace not found' });

        if (members && members.length > 0) {
            const inviteToken = generateInviteToken();
            const inviteLink = `${process.env.APP_BASE_URL}/invite/${inviteToken}`;

            for (const email of members) {
                const user = await User.findOne({ email });
                if (user) {
                    // Add existing user to the workspace
                    if (!workspace.members.includes(user._id)) {
                        workspace.members.push(user._id);
                        user.workspaces.push(workspace._id);
                        await user.save();
                    }
                } else {
                    // Invite new user via email
                    const invite = new Invite({
                        email,
                        token: inviteToken,
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Token valid for 24 hours
                        createdBy: userId,
                        workspace: workspace._id
                    });

                    await invite.save();
                    await sendEmail(email, 'Join Our Workspace', `Click the link to join: ${inviteLink}`);
                }
            }

            await workspace.save();
        }

        res.status(200).json({ message: 'Team members added and invites sent successfully', redirectUrl: `/workspace-setup/${workspace._id}` });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 6: View Team Members (Optional)
const viewTeamMembers = async (req, res) => {
    const userId = req.user.id;

    try {
        const workspace = await Workspace.findOne({ createdBy: userId }).populate('members', 'fullName email');
        if (!workspace) return res.status(400).json({ message: 'Workspace not found' });

        res.status(200).json({ message: 'Team members retrieved successfully', members: workspace.members });
    } catch (error) {
        handleError(res, error);
    }
};

// Step 7: Specify Team Work (Create Channel)
const specifyTeamWork = async (req, res) => {
    const { channelName } = req.body;
    const userId = req.user.id;

    try {
        const workspace = await Workspace.findOne({ createdBy: userId });
        if (!workspace) return res.status(400).json({ message: 'Workspace not found' });

        const channel = new Channel({
            name: channelName,
            createdBy: userId,
            workspace: workspace._id
        });

        await channel.save();
        res.status(200).json({ message: 'Channel created successfully', redirectUrl: `/workspace-setup/${workspace._id}` });
    } catch (error) {
        handleError(res, error);
    }
};



// Step 8: Finalize Workspace Creation and Launch
const finalizeWorkspace = async (req, res) => {
    const userId = req.user.id;

    try {
        // Find the most recently created workspace by the user
        const workspace = await Workspace.findOne({ createdBy: userId })
            .sort({ createdAt: -1 }) // Sort by creation date in descending order to get the latest
            .populate('members', 'fullName email')
            .populate({
                path: 'channels',
                select: 'name createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'fullName email'
                }
            });

        if (!workspace) return res.status(400).json({ message: 'Workspace not found' });

        // At this point, consider the workspace "launched"
        // Redirect to the main page with the workspace data
        res.status(201).json({
            message: 'Workspace launched successfully',
            workspace,
            redirectUrl: `/main-page/${workspace._id}` // Adjust the URL to match your frontend routing
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getUserWorkspaces = async (req, res) => {
    const userId = req.user.id;

    try {
        // Find all workspaces where the user is a member
        const workspaces = await Workspace.find({ members: userId })
            .populate('members', 'fullName email')
            .populate({
                path: 'channels',
                select: 'name createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'fullName email'
                }
            });

        if (!workspaces || workspaces.length === 0) {
            return res.status(404).json({ message: 'No workspaces found for this user' });
        }

        res.status(200).json({ message: 'Workspaces retrieved successfully', workspaces });
    } catch (error) {
        handleError(res, error);
    }
};



// const getCurrentWorkspace = async (req, res) => {
//     const userId = req.user.id;

//     try {
//         // Find the most recently created workspace by the user or where the user is a member
//         const workspace = await Workspace.findOne({ members: userId })
//             .sort({ createdAt: -1 }) // Sort by creation date to get the latest
//             .populate('members', 'fullName email')
//             .populate({
//                 path: 'channels',
//                 select: 'name createdBy',
//                 populate: {
//                     path: 'createdBy',
//                     select: 'fullName email'
//                 }
//             });

//         if (!workspace) return res.status(404).json({ message: 'No workspace found for this user' });

//         res.status(200).json({ message: 'Current workspace retrieved successfully', workspace });
//     } catch (error) {
//         handleError(res, error);
//     }
// };

const launchWorkspaceById = async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspace ID' });
    }

    try {
        // Find the workspace and check if the user is a member
        const workspace = await Workspace.findOne({ _id: workspaceId, members: userId })
            .populate('members', 'fullName email') // Ensure email is populated
            .populate({
                path: 'channels',
                select: 'name createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'fullName email'
                }
            });

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or user not a member' });

        // Extract the email from the current user
        const user = workspace.members.find(member => member._id.toString() === userId.toString());
        const userEmail = user ? user.email : '';

        res.status(200).json({
            message: 'Workspace launched successfully',
            workspace: {
                ...workspace.toObject(),
                userEmail, // Include the user's email in the response
            },
            redirectUrl: `/main-page/${workspace._id}`
        });
    } catch (error) {
        handleError(res, error);
    }
};



const getWorkspaceById = async (req, res) => {
    const { workspaceId } = req.params;

    try {
        // Find the workspace by ID and populate the 'createdBy' field to include email and name
        const workspace = await Workspace.findById(workspaceId)
            .populate('createdBy', 'email name')  // Populating the 'createdBy' field to get email and name
            .select('name logo createdBy'); // Selecting necessary fields

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        return res.json({
            workspace: {
                name: workspace.name,
                logo: workspace.logo,
                createdBy: {
                    email: workspace.createdBy.email,
                    name: workspace.createdBy.name
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};

const createMultipleChannels = async (req, res) => {
    const { workspaceId } = req.params;
    const { channelNames } = req.body; // Expecting an array of channel names
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspace ID' });
    }

    if (!Array.isArray(channelNames) || channelNames.length === 0) {
        return res.status(400).json({ message: 'Channel names are required and should be an array' });
    }

    try {
        // Find the workspace and check if the user is a member
        const workspace = await Workspace.findOne({ _id: workspaceId, members: userId });
        if (!workspace) return res.status(404).json({ message: 'Workspace not found or user not a member' });

        // Create each channel and save it to the workspace
        const channels = await Promise.all(channelNames.map(async (channelName) => {
            const channel = new Channel({
                name: channelName,
                createdBy: userId,
                workspace: workspace._id
            });

            await channel.save();
            return channel;
        }));

        // Update the workspace with the new channels
        workspace.channels.push(...channels.map(channel => channel._id));
        await workspace.save();

        res.status(201).json({ message: 'Channels created successfully', channels });
    } catch (error) {
        handleError(res, error);
    }
};
const addMemberToWorkspace = async (req, res) => {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspace ID' });
    }

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Find the workspace
        const workspace = await Workspace.findOne({ _id: workspaceId, members: userId });
        if (!workspace) return res.status(404).json({ message: 'Workspace not found or user not a member' });

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if the user is already a member
        if (workspace.members.includes(user._id)) {
            return res.status(400).json({ message: 'User is already a member of this workspace' });
        }

        // Add the user to the workspace
        workspace.members.push(user._id);
        await workspace.save();

        // Add the workspace to the user's list of workspaces
        user.workspaces.push(workspace._id);
        await user.save();

        res.status(200).json({ message: 'Member added to workspace successfully', workspace });
    } catch (error) {
        handleError(res, error);
    }
};

const removeMemberFromWorkspace = async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const userId = req.user.id;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(workspaceId) || !mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: 'Invalid workspace ID or member ID' });
    }

    try {
        // Find the workspace
        const workspace = await Workspace.findOne({ _id: workspaceId, members: userId });
        if (!workspace) return res.status(404).json({ message: 'Workspace not found or user not a member' });

        // Check if the member exists in the workspace
        if (!workspace.members.includes(memberId)) {
            return res.status(404).json({ message: 'Member not found in this workspace' });
        }

        // Remove the member from the workspace
        workspace.members.pull(memberId);
        await workspace.save();

        // Also remove the workspace from the user's list of workspaces
        const user = await User.findById(memberId);
        if (user) {
            user.workspaces.pull(workspace._id);
            await user.save();
        }

        res.status(200).json({ message: 'Member removed from workspace successfully', workspace });
    } catch (error) {
        handleError(res, error);
    }
};
const getWorkspaceMembers = async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspace ID' });
    }

    try {
        // Find the workspace and ensure the user is a member
        const workspace = await Workspace.findOne({ _id: workspaceId, members: userId })
            .populate('members'); // Populate the members' full name and email

        if (!workspace) return res.status(404).json({ message: 'Workspace not found or user not a member' });

        res.status(200).json({
            message: 'Workspace members retrieved successfully',
            members: workspace.members
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
requestWorkspaceCreation,
verifyOTP,
createProfile,
setCompanyName,
addTeamMembers,
viewTeamMembers,
specifyTeamWork,
finalizeWorkspace,
getUserWorkspaces,
launchWorkspaceById,
getWorkspaceById,
createMultipleChannels,
addMemberToWorkspace,
removeMemberFromWorkspace,
getWorkspaceMembers
};
