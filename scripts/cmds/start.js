const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  nix: {
    name: "start",
    version: "1.4.0",
    author: "Samycharles",
    role: 0,
    cooldown: 5,
    description: "Welcome message with dynamic banner and inline buttons",
    category: "Utility",
    guide: "Use /start to see a custom banner with your photo"
  },

  onStart: async function ({ message, msg, bot, chatId }) {
    // Stable chatId
    const targetChatId = chatId || (message && message.chat && message.chat.id) || (msg && msg.chat && msg.chat.id);
    if (!targetChatId) return;

    try {
      // ----------- Paramètres de l'image -----------
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1e3c72');
      gradient.addColorStop(1, '#2a5298');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Texte Welcome
      ctx.font = 'bold 50px Sans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const name = (message?.from?.first_name) || (msg?.from?.first_name) || 'User';
      ctx.fillText(`Welcome, ${name}!`, width / 2, 70);

      // Photo du bot (URL hébergée)
      const botPhotoUrl = 'https://i.imgur.com/yourBotPhoto.png';
      const botPhoto = await loadImage(botPhotoUrl);
      ctx.drawImage(botPhoto, width/2 - 75, 120, 150, 150);

      // Photo utilisateur si disponible
      let userPhotos;
      const userId = message?.from?.id || msg?.from?.id;
      if (userId) {
        userPhotos = await bot.getUserProfilePhotos(userId).catch(() => null);
      }
      if (userPhotos && userPhotos.total_count > 0) {
        const userFileId = userPhotos.photos[0][0].file_id;
        const userPhotoUrl = await bot.getFileLink(userFileId);
        const userImage = await loadImage(userPhotoUrl);
        ctx.drawImage(userImage, width/2 + 180, 140, 120, 120);
      }

      // Sauvegarde temporaire
      const buffer = canvas.toBuffer('image/png');
      const filePath = path.join(__dirname, 'welcome.png');
      fs.writeFileSync(filePath, buffer);

      // Boutons inline
      const buttons = [
        [
          { text: "📖 Help", callback_data: "help" },
          { text: "🔗 Channel", url: "https://t.me/pannel_io" }
        ]
      ];

      // Envoie de l'image avec caption et boutons
      await bot.sendPhoto(targetChatId, filePath, {
        caption:
          "🥭🦅 Use /help to explore my commands!\n" +
          "I am an AI 🤖 developed by @Samy_Charles_02",
        reply_markup: { inline_keyboard: buttons }
      });

      // Supprime l'image temporaire
      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("Erreur création image de bienvenue:", err);
      // Fallback simple texte
      const fallbackText =
        "🥭🦅 Welcome! Use /help to explore my commands.\n" +
        "I am an AI 🤖 developed by @Samy_Charles_02\n" +
        "https://t.me/pannel_io";
      if (targetChatId) await bot.sendMessage(targetChatId, fallbackText);
    }
  }
};
