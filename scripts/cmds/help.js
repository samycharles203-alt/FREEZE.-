const toGothicStyle = (text) => {
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
};

module.exports = {
    nix: {
        name: 'help',
        prefix: false,
        role: 0,
        category: 'utility',
        aliases: ['commands'],
        author: 'ArYAN',
        version: '0.0.5',
    },

    async onStart({ bot, message, chatId }) {
        if (!global.teamnix || !global.teamnix.cmds) {
            return bot.sendMessage(chatId, "❌ Les commandes ne sont pas disponibles.");
        }

        const commands = [...global.teamnix.cmds.values()];

        // Regroupe les commandes par catégorie
        const cats = {};
        commands.forEach(c => {
            const cat = c.nix.category || 'Autres';
            if (!cats[cat]) cats[cat] = [];
            if (!cats[cat].includes(c.nix.name)) cats[cat].push(c.nix.name);
        });

        // Crée boutons verticaux : une commande par ligne
        const buttons = [];
        Object.keys(cats).sort().forEach(cat => {
            cats[cat].forEach(name => {
                buttons.push([{ text: `📌 ${name}`, callback_data: `help_cmd_${name}` }]);
            });
        });

        const introText = `
🥭 Bienvenue dans le centre de commandes de Freeze.io🦅

📋 Cliquez sur une commande pour voir ses détails.
⚡ Explore toutes les fonctionnalités et amuse-toi !

「 Nix Bot – @Samy_Charles_02  」
        `.trim();

        await bot.sendMessage(chatId, introText, {
            reply_markup: { inline_keyboard: buttons }
        });
    }
};

// --- Gestion des clics sur les boutons ---
if (global.bot) {
    global.bot.on('callback_query', async (query) => {
        try {
            const chatId = query.message.chat.id;
            const msgId = query.message.message_id;
            const data = query.data;

            if (!data.startsWith("help_cmd_") && data !== "help_back") return;

            const commands = [...global.teamnix.cmds.values()];

            // Bouton retour
            if (data === "help_back") {
                const buttons = [];
                Object.keys(commands.reduce((acc, c) => {
                    const cat = c.nix.category || 'Autres';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(c.nix.name);
                    return acc;
                }, {})).forEach(cat => {
                    commands.filter(c => (c.nix.category || 'Autres') === cat).forEach(c => {
                        buttons.push([{ text: `📌 ${c.nix.name}`, callback_data: `help_cmd_${c.nix.name}` }]);
                    });
                });

                await global.bot.editMessageText(
                    "🥭 Centre de commandes de Nix Bot 🦅\n\n📋 Cliquez sur une commande pour voir ses détails.",
                    {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: { inline_keyboard: buttons }
                    }
                );
                return;
            }

            // Détails de la commande
            const cmdName = data.replace("help_cmd_", "");
            const cmd = commands.find(c => c.nix.name === cmdName);
            if (!cmd) return global.bot.answerCallbackQuery(query.id, { text: "❌ Commande invalide." });

            const info = cmd.nix;
            const text = `
✨ Commande: 𝖺 ${toGothicStyle(info.name)}
🗂 Catégorie: ${info.category || "Autres"}
🧾 Aliases: ${info.aliases?.length ? info.aliases.join(", ") : "Aucun"}
👤 Accès: ${info.role === 2 ? "Admin Only" : info.role === 1 ? "VIP Only" : "Tous les utilisateurs"}
📜 Auteur: ${info.author || "Inconnu"}
⚡ Version: ${info.version || "N/A"}

💡 Utilisation: /${info.name} ${info.guide?.en || ""}
            `.trim();

            const buttons = [[{ text: "🔙 Retour", callback_data: "help_back" }]];

            await global.bot.editMessageText(text, {
                chat_id: chatId,
                message_id: msgId,
                reply_markup: { inline_keyboard: buttons }
            });

            await global.bot.answerCallbackQuery(query.id);

        } catch (err) {
            console.error("Help callback error:", err);
        }
    });
                                                     }
