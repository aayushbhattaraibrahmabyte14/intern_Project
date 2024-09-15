const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

const client = twilio(accountSid, authToken);

const generateAccessToken = (identity) => {
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { identity });

const voiceGrant = new VoiceGrant({
outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
incomingAllow: true,
});

token.addGrant(voiceGrant);
return token.toJwt();
};

const createVoiceRoom = async (roomName) => {
try {
const room = await client.video.rooms.create({
uniqueName: roomName,
type: 'group',
});
return room;
} catch (error) {
console.error('Error creating voice room:', error);
throw error;
}
};

module.exports = {
generateAccessToken,
createVoiceRoom,
};
