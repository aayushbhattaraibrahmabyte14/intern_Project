const User = require('../models/User');

const parseMentions = async (content) => {
const mentionRegex = /@(\w+)/g;
let mentions = [];
let match;

console.log('Parsing content for mentions:', content);

while ((match = mentionRegex.exec(content)) !== null) {
const username = match[1];
console.log('Found mention:', username);

// Check if the user exists in the database by displayName
const user = await User.findOne({
displayName: new RegExp(`^${username}$`, 'i')
});

if (user) {
console.log('User found for mention:', user._id);
mentions.push(user._id);
} else {
console.log('User not found for mention:', username);
}
}

console.log('Mentions extracted:', mentions);
return mentions;
};

module.exports = { parseMentions };
