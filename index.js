// Import required packages
const { Client } = require("guilded.js");
const axios = require("axios"); // For HTTP requests to the Shapes API
require("dotenv").config(); // To load environment variables from .env
const fs = require('fs'); // For file system operations

// --- Configuration ---
const guildedToken = process.env.GUILDED_TOKEN;
const shapesApiKey = process.env.SHAPES_API_KEY;
const shapeUsername = process.env.SHAPE_USERNAME; // The plain username

const SHAPES_API_BASE_URL = "https://api.shapes.inc/v1";
const SHAPES_MODEL_NAME = `shapesinc/${shapeUsername}`;

if (!guildedToken || !shapesApiKey || !shapeUsername) {
    console.error(
        "Error: Please ensure that GUILDED_TOKEN, SHAPES_API_KEY, and SHAPE_USERNAME are set in your .env file."
    );
    process.exit(1);
}

// Initialize Guilded Client
const client = new Client({ token: guildedToken });

// File path for storing active channels
const channelsFilePath = './active_channels.json';

// In-memory store for active channels (Channel IDs)
let activeChannels = new Set();

// Function to load active channels from file
function loadActiveChannels() {
    try {
        if (fs.existsSync(channelsFilePath)) {
            const data = fs.readFileSync(channelsFilePath, 'utf8');
            const loadedChannelIds = JSON.parse(data);
            if (Array.isArray(loadedChannelIds)) {
                activeChannels = new Set(loadedChannelIds);
                console.log(`Active channels loaded: ${loadedChannelIds.join(', ')}`);
            } else {
                console.warn("Invalid format in active_channels.json. Starting with empty channels.");
                activeChannels = new Set();
            }
        } else {
            console.log("No active_channels.json found. Starting with empty channels.");
            activeChannels = new Set();
        }
    } catch (error) {
        console.error("Error loading active channels:", error);
        activeChannels = new Set(); // Start with empty channels in case of error
    }
}

// Function to save active channels to file
function saveActiveChannels() {
    try {
        const channelIdsArray = Array.from(activeChannels);
        fs.writeFileSync(channelsFilePath, JSON.stringify(channelIdsArray, null, 2));
        console.log(`Active channels saved: ${channelIdsArray.join(', ')}`);
    } catch (error) {
        console.error("Error saving active channels:", error);
    }
}

// --- Message Constants ---
const START_MESSAGE_ACTIVATE = () => `🤖 Hello! I am now active for **${shapeUsername}** in this channel. All messages here will be forwarded.`;
const START_MESSAGE_RESET = () => `🤖 The long-term memory for **${shapeUsername}** in this channel has been reset for you. You can start a new conversation.`;
const ALREADY_ACTIVE_MESSAGE = () => `🤖 I am already active in this channel for **${shapeUsername}**.`;
const NOT_ACTIVE_MESSAGE = () => `🤖 I am not active in this channel. Use \`/activate\` first.`;
const DEACTIVATE_MESSAGE = () => `🤖 I am no longer active for **${shapeUsername}** in this channel.`;

// --- Improved Media URL Handling ---
const MEDIA_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', // images
    '.mp4', '.webm', '.mov', // videos
    '.mp3', '.ogg', '.wav'  // audio
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav'];

function getMediaType(url) {
    if (typeof url !== 'string') return null;
    try {
        if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
            return null;
        }
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname.toLowerCase();
        const pathOnly = path.split('?')[0].split('#')[0];

        if (IMAGE_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'image';
        if (VIDEO_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'video';
        if (AUDIO_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'audio';
        return null;
    } catch (e) {
        console.error('Error parsing URL:', url, e);
        return null;
    }
}

// Improved function to validate if an image URL is accessible
async function validateImageUrl(url) {
    try {
        const response = await axios.head(url, { 
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GuildedBot/1.0)'
            }
        });
        
        const contentType = response.headers['content-type'];
        const isValidImage = contentType && contentType.startsWith('image/');
        
        console.log(`[Image Validation] URL: ${url}, Status: ${response.status}, Content-Type: ${contentType}, Valid: ${isValidImage}`);
        
        return isValidImage && response.status === 200;
    } catch (error) {
        console.error(`[Image Validation] Failed for ${url}:`, error.message);
        return false;
    }
}

// Improved function to extract and validate URLs from text
function extractUrls(text) {
    if (typeof text !== 'string') return [];
    
    // More comprehensive URL regex that handles various formats
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)/g;
    const urls = text.match(urlRegex) || [];
    
    return urls
        .map(url => {
            // Ensure URL has protocol
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return 'https://' + url;
            }
            return url;
        })
        .filter(url => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        });
}

// NEW: Function to extract image URLs specifically and validate them
async function extractAndValidateImageUrls(text) {
    if (typeof text !== 'string') return [];
    
    const allUrls = extractUrls(text);
    const imageUrls = [];
    
    for (const url of allUrls) {
        const mediaType = getMediaType(url);
        if (mediaType === 'image') {
            console.log(`[Image Detection] Found potential image URL: ${url}`);
            const isValid = await validateImageUrl(url);
            if (isValid) {
                imageUrls.push(url);
                console.log(`[Image Detection] Validated image URL: ${url}`);
            } else {
                console.log(`[Image Detection] Invalid image URL: ${url}`);
            }
        }
    }
    
    return imageUrls;
}

// NEW: Function to remove URLs from text content
function removeUrlsFromText(text, urlsToRemove) {
    let cleanText = text;
    
    for (const url of urlsToRemove) {
        // Remove the URL and any surrounding angle brackets
        cleanText = cleanText.replace(new RegExp(`<${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'g'), '');
        cleanText = cleanText.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    }
    
    // Clean up extra whitespace and empty lines
    cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
    
    return cleanText;
}

// UPDATED: Enhanced function to format Shape response with multiple image support
async function formatShapeResponseForGuilded(shapeResponse) {
    if (typeof shapeResponse !== 'string' || shapeResponse.trim() === "") {
        return { content: shapeResponse }; // Return original if empty or not string
    }

    console.log(`[Format Response] Processing: "${shapeResponse}"`);

    // Extract all valid image URLs from the response
    const imageUrls = await extractAndValidateImageUrls(shapeResponse);
    
    if (imageUrls.length === 0) {
        // No valid images found, handle other media types as before
        const allUrls = extractUrls(shapeResponse);
        for (const url of allUrls) {
            const mediaType = getMediaType(url);
            if (mediaType === 'video' || mediaType === 'audio') {
                // For video/audio, just return the content as-is for auto-embedding
                return { content: shapeResponse };
            }
        }
        
        // No media found, return original content
        console.log(`[Format Response] No media found, sending original content`);
        return { content: shapeResponse };
    }

    // Process multiple images
    console.log(`[Format Response] Found ${imageUrls.length} valid image(s): ${imageUrls.join(', ')}`);
    
    // Remove image URLs from the text content
    let cleanContent = removeUrlsFromText(shapeResponse, imageUrls);
    
    // Create embeds for all valid images
    const embeds = imageUrls.map(url => ({ image: { url } }));
    
    // Return appropriate response format
    if (cleanContent === "" || cleanContent.trim() === "") {
        console.log(`[Format Response] Sending ${imageUrls.length} image embed(s) only`);
        return { embeds };
    } else {
        console.log(`[Format Response] Sending content + ${imageUrls.length} image embed(s)`);
        return { content: cleanContent, embeds };
    }
}

// --- Shapes API Command Configuration ---
// These are Shapes API commands that might not return a verbose reply.
// The bot will provide a generic confirmation if the Shape's response is empty.
// Note: !reset has its own custom confirmation message (START_MESSAGE_RESET).
const SHAPES_COMMANDS_WITH_POTENTIALLY_SILENT_SUCCESS = ["!sleep", "!wack"];

// Function to send a message to the Shapes API
async function sendMessageToShape(userId, channelId, content) {
    console.log(`[Shapes API] Sending message to ${SHAPES_MODEL_NAME}: User ${userId}, Channel ${channelId}, Content: "${content}"`);
    try {
        const response = await axios.post(
            `${SHAPES_API_BASE_URL}/chat/completions`,
            {
                model: SHAPES_MODEL_NAME,
                messages: [{ role: "user", content: content }],
            },
            {
                headers: {
                    Authorization: `Bearer ${shapesApiKey}`,
                    "Content-Type": "application/json",
                    "X-User-Id": userId,
                    "X-Channel-Id": channelId,
                },
                timeout: 60000, // 60 seconds timeout (increased for potentially longer commands like !imagine)
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const shapeResponseContent = response.data.choices[0].message.content;
            console.log(`[Shapes API] Response received: "${shapeResponseContent}"`);
            return shapeResponseContent;
        } else {
            console.warn("[Shapes API] Unexpected response structure or empty choices:", response.data);
            return ""; // Return empty string for consistent handling
        }
    } catch (error) {
        console.error("[Shapes API] Error during communication:", error.response ? error.response.data : error.message);
        if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
            return "Sorry, the request to the Shape timed out.";
        }
        if (error.response && error.response.status === 429) {
            return "Too many requests to the Shapes API. Please try again later.";
        }
        // For other errors, throw it so processShapeApiCommand can catch and give a generic error to user
        throw error;
    }
}

// Helper function for processing Shapes API commands from Guilded commands
async function processShapeApiCommand(guildedMessage, guildedCommandName, baseShapeCommand, requiresArgs = false, commandArgs = []) {
    const channelId = guildedMessage.channelId;
    const userId = guildedMessage.createdById;

    if (!activeChannels.has(channelId)) {
        await guildedMessage.reply(NOT_ACTIVE_MESSAGE());
        return;
    }

    let fullShapeCommand = baseShapeCommand;
    if (requiresArgs) {
        const argString = commandArgs.join(" ");
        if (!argString) {
            await guildedMessage.reply(`Please provide the necessary arguments for \`/${guildedCommandName}\`. Example: \`/${guildedCommandName} your arguments\``);
            return;
        }
        fullShapeCommand = `${baseShapeCommand} ${argString}`;
    }

    console.log(`[Bot Command: /${guildedCommandName}] Sending to Shape API: User ${userId}, Channel ${channelId}, Content: "${fullShapeCommand}"`);
    try {
        // Typing indicator
        try {
            await client.rest.put(`/channels/${channelId}/typing`);
        } catch (typingError) {
            console.warn(`[Typing Indicator] Error for /${guildedCommandName}:`, typingError.message);
        }

        // Send the command to Shapes API
        const shapeResponse = await sendMessageToShape(userId, channelId, fullShapeCommand);

        // Handle response
        if (shapeResponse && shapeResponse.trim() !== "") {
            const replyPayload = await formatShapeResponseForGuilded(shapeResponse);
            // If Shape API returned an error message (like timeout or rate limit from sendMessageToShape), display it
            // These error messages from sendMessageToShape are plain strings.
            if (typeof replyPayload.content === 'string' && (replyPayload.content.startsWith("Sorry,") || replyPayload.content.startsWith("Too many requests"))) {
                await guildedMessage.reply(replyPayload.content);
            } else {
                await guildedMessage.reply(replyPayload);
            }
        } else {
            // Shape's response was empty or just whitespace
            if (baseShapeCommand === "!reset") {
                await guildedMessage.reply(START_MESSAGE_RESET());
            } else if (SHAPES_COMMANDS_WITH_POTENTIALLY_SILENT_SUCCESS.includes(baseShapeCommand)) {
                await guildedMessage.reply(`The command \`/${guildedCommandName}\` has been sent to **${shapeUsername}**. It may have been processed silently.`);
            } else {
                // For commands expected to give a response (e.g., !info, !help, !web, !imagine, !dashboard)
                await guildedMessage.reply(`**${shapeUsername}** didn't provide a specific textual response for \`/${guildedCommandName}\`. The action might have been completed, or it may require a different interaction.`);
            }
        }
    } catch (error) { // Catches errors thrown by sendMessageToShape (e.g., network issues not handled as string returns)
        console.error(`[Bot Command: /${guildedCommandName}] Error during Shapes API call or Guilded reply:`, error);
        await guildedMessage.reply(`Sorry, there was an error processing your \`/${guildedCommandName}\` command with **${shapeUsername}**.`);
    }
}

// Load active channels on startup
loadActiveChannels();

// Event handler for "ready"
client.on("ready", () => {
    console.log(`Bot logged in as ${client.user?.name}!`);
    console.log(`Ready to process messages for Shape: ${shapeUsername} (Model: ${SHAPES_MODEL_NAME}).`);
    console.log(`Active channels on startup: ${Array.from(activeChannels).join(', ') || 'None'}`);
});

// Event handler for new messages
client.on("messageCreated", async (message) => {
    if (message.createdById === client.user?.id || message.author?.type === "bot") {
        return;
    }
    if (!message.content || message.content.trim() === "") {
        return;
    }

    const commandPrefix = "/";
    const guildedUserName = message.author?.name || "Unknown User";

    if (message.content.startsWith(commandPrefix)) {
        const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/\s+/);
        const lowerCaseCommand = command.toLowerCase();
        const channelId = message.channelId; // For activate/deactivate logic
        // userId is sourced within processShapeApiCommand from message.createdById

        // Bot-specific commands
        if (lowerCaseCommand === "activate") {
            if (activeChannels.has(channelId)) {
                await message.reply(ALREADY_ACTIVE_MESSAGE());
            } else {
                activeChannels.add(channelId);
                saveActiveChannels();
                console.log(`Bot activated in channel: ${channelId}`);
                await message.reply(START_MESSAGE_ACTIVATE());
            }
            return;
        }

        if (lowerCaseCommand === "deactivate") {
            if (activeChannels.has(channelId)) {
                activeChannels.delete(channelId);
                saveActiveChannels();
                console.log(`Bot deactivated in channel: ${channelId}`);
                await message.reply(DEACTIVATE_MESSAGE());
            } else {
                await message.reply(NOT_ACTIVE_MESSAGE());
            }
            return;
        }

        // Shapes API commands (will check for active channel inside processShapeApiCommand)
        switch (lowerCaseCommand) {
            case "reset": // Resets Shape's long-term memory for the channel/user
                await processShapeApiCommand(message, "reset", "!reset");
                break;
            case "sleep": // Triggers Shape's long-term memory generation
                await processShapeApiCommand(message, "sleep", "!sleep");
                break;
            case "dashboard": // Gets link to Shape's configuration dashboard
                await processShapeApiCommand(message, "dashboard", "!dashboard");
                break;
            case "info": // Gets Shape's information
                await processShapeApiCommand(message, "info", "!info");
                break;
            case "web": // Searches the web via the Shape
                await processShapeApiCommand(message, "web", "!web", true, args);
                break;
            case "help": // Gets Shape's help for its commands
                await processShapeApiCommand(message, "help", "!help");
                break;
            case "imagine": // Generates images via the Shape
                await processShapeApiCommand(message, "imagine", "!imagine", true, args);
                break;
            case "wack": // Resets Shape's short-term memory
                await processShapeApiCommand(message, "wack", "!wack");
                break;
            default:
                // If the channel is active and it's an unknown slash command,
                // you might choose to inform the user or ignore it.
                // For now, if it's not a recognized command, it won't be processed further by this block.
                // If activeChannels.has(message.channelId) is true, and it wasn't a command,
                // it will fall through to the regular message forwarding logic.
                // However, since it starts with "/", it's unlikely to be intended for the Shape as a normal message.
                if (activeChannels.has(message.channelId)) {
                     // message.reply(`Unknown command: \`/${command}\`. Try \`/help\` if you need assistance with the Shape's commands, or ensure the bot is active with \`/activate\`.`);
                }
                // If not active, it will just be ignored, which is fine.
                return; // Important: stop processing if it was a command attempt
        }
        return; // Ensure command processing stops here
    }

    // If the channel is active and it's not a command message:
    if (activeChannels.has(message.channelId)) {
        const originalContent = message.content;
        const userId = message.createdById;
        const contentForShape = `${guildedUserName}: ${originalContent}`;

        console.log(`[Regular Message] User ${userId} (${guildedUserName}) in active channel ${message.channelId}: "${originalContent}"`);
        console.log(`[Regular Message] Sending to Shape: "${contentForShape}"`);

        try {
            try {
                await client.rest.put(`/channels/${message.channelId}/typing`);
            } catch (typingError) {
                console.warn("[Typing Indicator] Error sending typing indicator:", typingError.message);
            }

            const shapeResponse = await sendMessageToShape(userId, message.channelId, contentForShape);

            if (shapeResponse && shapeResponse.trim() !== "") {
                const replyPayload = await formatShapeResponseForGuilded(shapeResponse);
                 if (typeof replyPayload.content === 'string' && (replyPayload.content.startsWith("Sorry,") || replyPayload.content.startsWith("Too many requests"))) {
                    await message.reply(replyPayload.content); // Display API-side error messages
                } else {
                    await message.reply(replyPayload);
                }
            } else {
                console.log("[Regular Message] No valid response from Shapes API or response was empty.");
                // Optionally, you can inform the user if the Shape doesn't reply
                // await message.reply(`**${shapeUsername}** didn't send a reply.`);
            }
        } catch (err) { // Catches errors from sendMessageToShape if it throws
            console.error("[Regular Message] Error sending message to Shape or response to Guilded:", err);
            try {
                await message.reply("Oops, something went wrong while trying to talk to the Shape.");
            } catch (replyError) {
                console.error("Could not send error message to Guilded:", replyError);
            }
        }
    }
});

// Event handler for errors
client.on("error", (error) => {
    console.error("An error occurred in the Guilded Client:", error);
});

// Connect to Guilded
client.login(guildedToken);

console.log("Bot starting...");