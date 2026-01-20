module.exports = {
  nix: {
    name: "start",
    version: "1.9.0",
    author: "Samycharles",
    role: 0,
    cooldown: 5,
    description: "Long stylish welcome message with symbols and inline button",
    category: "Utility",
    guide: "Use /start to see the welcome message"
  },

  onStart: async function ({ message, msg, chatId, bot }) {
    const targetChatId = chatId || (message && message.chat && message.chat.id) || (msg && msg.chat && msg.chat.id);
    if (!targetChatId) return;

    try {
      const userName = (message?.from?.first_name) || (msg?.from?.first_name) || "there";

      // Message long et stylé
      const welcomeText =
        `🌟 Welcome, ${userName}! 🌟\n\n` +
        `🥭🦅 Hello! I am your personal AI assistant, designed to make your Telegram experience smarter, faster, and more fun! 🤖\n\n` +
        `📌 Developed with care and passion by @Samy_Charles_02 🫢😊\n\n` +
        `📰 Here’s what I can do for you:\n` +
        `• 📂 Upload and manage your files easily\n` +
        `• 🎯 Explore my commands using /help\n` +
        `• 🤖 Interact with me in real-time\n` +
        `• 🎉 Have fun with AI-powered features\n\n` +
        `✨ Stay updated and never miss anything important!\n` +
        `💫 Join my official channel to get updates, tips, and exclusive content!`;

      // Inline button pour ton channel
      const buttons = [
        [{ text: "📢 Rejoindre mon Channel", url: "https://t.me/pannel_io" }]
      ];

      await bot.sendMessage(targetChatId, welcomeText, {
        reply_markup: { inline_keyboard: buttons }
      });

    } catch (err) {
      console.error("Erreur lors de l'envoi du message de bienvenue:", err);
    }
  }
};
