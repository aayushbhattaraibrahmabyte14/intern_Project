const Reaction = require('../models/Reaction');

// Add a reaction
const addReaction = async (req, res) => {
try {
const { messageId, emoji } = req.body;

// List of allowed reactions
const allowedReactions = ['👍', '❤️', '😂', '😮', '😢', '👎'];

if (!messageId || !emoji) {
return res.status(400).json({ message: 'Message ID and emoji are required' });
}

// Check if the emoji is in the list of allowed reactions
if (!allowedReactions.includes(emoji)) {
return res.status(400).json({ message: 'Invalid reaction type' });
}

const reaction = new Reaction({
emoji,
message: messageId,
user: req.user.id // Assuming req.user contains the authenticated user info
});

await reaction.save();
res.status(201).json({ message: 'Reaction added successfully', reaction });
} catch (error) {
console.error('Error adding reaction:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Remove a reaction
const removeReaction = async (req, res) => {
try {
const { messageId, emoji } = req.body;

if (!messageId || !emoji) {
return res.status(400).json({ message: 'Message ID and emoji are required' });
}

const reaction = await Reaction.findOneAndDelete({
message: messageId,
emoji,
user: req.user.id
});

if (!reaction) {
return res.status(404).json({ message: 'Reaction not found' });
}

res.status(200).json({ message: 'Reaction removed successfully', reaction });
} catch (error) {
console.error('Error removing reaction:', error);
res.status(500).json({ message: 'Server error' });
}
};

module.exports = {
addReaction,
removeReaction
};
