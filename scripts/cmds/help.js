module.exports = {
  nix: {
    name: 'help',
    prefix: false,
    role: 0,
    category: 'utility',
    aliases: ['commands'],
    author: 'ArYAN',
    version: '0.0.3',
  },

  async onStart({ bot, message, args, chatId }) {
    if (!global.teamnix || !global.teamnix.cmds) {
      return bot.sendMessage(chatId, "❌ Les commandes ne sont pas disponibles pour le moment.");
    }

    const commands = [...global.teamnix.cmds.values()];

    // Si un nom de commande est donné, affiche info détaillée
    if (args.length) {
      const query = args[0].toLowerCase();
      const cmd = commands.find(
        c => c.nix.name === query || (c.nix.aliases && c.nix.aliases.includes(query))
      );
      if (!cmd) return bot.sendMessage(chatId, `❌ Aucune commande nommée « ${query} » trouvée.`);

      const info = cmd.nix;
      const detail = `
✨ Commande: ${info.name}
🗂 Catégorie: ${info.category || 'UNCATEGORIZED'}
🧾 Aliases: ${info.aliases?.length ? info.aliases.join(', ') : 'Aucun'}
👤 Accès: ${info.role === 2 ? 'Admin Only' : info.role === 1 ? 'VIP Only' : 'Tous les utilisateurs'}
📜 Auteur: ${info.author || 'Inconnu'}
⚡ Version: ${info.version || 'N/A'}
      `.trim();

      return bot.sendMessage(chatId, detail);
    }

    // Regroupe les commandes par catégorie
    const cats = {};
    commands.forEach(c => {
      const cat = c.nix.category || 'Autres';
      if (!cats[cat]) cats[cat] = [];
      if (!cats[cat].includes(c.nix.name)) cats[cat].push(c.nix.name);
    });

    // Crée les boutons inline pour Telegram
    const buttons = [];
    Object.keys(cats).sort().forEach(cat => {
      const row = cats[cat].map(name => ({
        text: `📌 ${name}`,
        callback_data: `help_cmd_${name}`
      }));
      buttons.push(row);
    });

    const introText = `
🥭 Salut ! Bienvenue dans le centre de commandes de Freeze.io 🦅

📋 Cliquez sur une commande ci-dessous pour voir ses détails.
⚡ Explore toutes les fonctionnalités et amuse-toi !

「 Nix Bot – by @Samy_charles_02 」
    `.trim();

    await bot.sendMessage(chatId, introText, {
      reply_markup: { inline_keyboard: buttons }
    });
  }
};
