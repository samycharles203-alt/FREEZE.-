const axios = require("axios");

// Convertit le texte en style gothique
function toGothicStyle(text) {
    const map = {
        A: '𝖠', B: '𝖡', C: '𝖢', D: '𝖣', E: '𝖤', F: '𝖥', G: '𝖦', H: '𝖧',
        I: '𝖨', J: '𝖩', K: '𝖪', L: '𝖫', M: '𝖬', N: '𝖭', O: '𝖮', P: '𝖯',
        Q: '𝖰', R: '𝖱', S: '𝖲', T: '𝖳', U: '𝖴', V: '𝖵', W: '𝖶', X: '𝖷',
        Y: '𝖸', Z: '𝖹',
        a: '𝖺', b: '𝖻', c: '𝖼', d: '𝖽', e: '𝖾', f: '𝖿', g: '𝗀', h: '𝗁',
        i: '𝗂', j: '𝗃', k: '𝗄', l: '𝗅', m: '𝗆', n: '𝗇', o: '𝗈', p: '𝗉',
        q: '𝗊', r: '𝗋', s: '𝗌', t: '𝗍', u: '𝗎', v: '𝗏', w: '𝗐', x: '𝗑',
        y: '𝗒', z: '𝗓', ' ':' ', '.':'.', ',':','
    };
    return text.split('').map(c => map[c] || c).join('');
}

// Formate la réponse
function formatResponse(botReply) {
    const rStyled = toGothicStyle(botReply);
    return `🇨🇮🇧🇪 ﹝𝗙𝗥𝗘𝗭𝗘 𝗜𝗢𝟮.𝟬﹞ 🇨🇮🇧🇪\n${rStyled}`;
}

// Fonction qui appelle l’API AI
async function chat(bot, message, chatId, query) {
    try {
        await bot.sendChatAction(chatId, "typing");

        const res = await axios.get("https://arychauhann.onrender.com/api/gemini-proxy2", {
            params: { prompt: query },
            timeout: 45000,
            headers: { "Content-Type": "application/json" }
        });

        const reply = res.data?.result?.trim() || "Désolé, réponse non reconnue de l'API";

        await bot.sendMessage(chatId, formatResponse(reply));

    } catch (err) {
        console.error("Aesther AI error:", err?.message || err);
        await bot.sendMessage(chatId, "❌ | Error connecting to AI API.");
    }
}

module.exports = {
    nix: {
        name: "ai_hybrid",
        version: "3.1.0",
        author: "Samycharles",
        role: 0,
        cooldown: 2,
        description: "AI responds to messages automatically and also via 'Ai' command",
        category: "ai",
        guide: "Send any message or use /ai <question>"
    },

    // Répond automatiquement à tous les messages
    onChat: async ({ bot, message, chatId }) => {
        const text = (message?.text || "").trim();
        if (!text) return;

        // Si le message commence par "ai" ou "Ai", on le considère comme commande
        const lower = text.toLowerCase();
        if (lower.startsWith("ai ") || lower === "ai") {
            const query = text.replace(/^ai\s+/i, "").trim();
            if (!query) return bot.sendMessage(chatId, "❌ | Please enter a question after Ai.");
            return chat(bot, message, chatId, query);
        }

        // Sinon, auto-response normal
        chat(bot, message, chatId, text);
    },

    // Répond aux messages en reply
    onReply: async ({ bot, message, reply }) => {
        if (!reply) return;
        const text = (message?.text || "").trim();
        if (!text) return;
        chat(bot, message, message.chat.id, text);
    }
};
