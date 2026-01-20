const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  nix: {
    name: "start",
    version: "1.3.0",
    author: "Samycharles",
    role: 0,
    cooldown: 5,
    description: "Welcome message with dynamic banner and inline buttons",
    category: "Utility",
    guide: "Use /start to see a custom banner with your photo"
  },

  onStart: async function ({ message, bot }) {
    const chatId = message.chat.id;

    try {
      // ----------- Paramètres de l'image -----------
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Fond dégradé futuriste
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1e3c72');
      gradient.addColorStop(1, '#2a5298');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Texte Welcome
      ctx.font = 'bold 50px Sans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`Welcome, ${message.from.first_name}!`, width / 2, 70);

      // Charger photo du bot (URL hébergée)
      const botPhoto = await loadImage('https://i.imgur.com/yourBotPhoto.png'); // Remplace par la photo de ton bot
      ctx.drawImage(botPhoto, width/2 - 75, 120, 150, 150);

      // Charger photo utilisateur si disponible
      const userPhotos = await bot.getUserProfilePhotos(message.from.id);
      if (userPhotos.total_count > 0) {
        const userFileId = userPhotos.photos[0][0].file_id;
        const userPhotoUrl = await bot.getFileLink(userFileId);
        const userImage = await loadImage(userPhotoUrl);
        ctx.drawImage(userImage, width/2 + 180, 140, 120, 120); // à droite
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
      await bot.sendPhoto(chatId, filePath, {
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
      await message.reply(
        "🥭🦅 Welcome! Use /help to explore my commands.\n" +
        "I am an AI 🤖 developed by @Samy_Charles_02\n" +
        "https://t.me/pannel_io"
      );
    }
  }
};
