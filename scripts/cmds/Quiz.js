const axios = require("axios");

let activeQuiz = {}; // quiz par chat

module.exports = {
  nix: {
    name: "quiz",
    prefix: false,
    role: 0,
    category: "game",
    author: "FREEZE.IO",
    version: "1.0.0"
  },

  async onStart({ message }) {
    const chatId = message.chat.id;

    if (activeQuiz[chatId]) {
      return message.reply("🧊 Un quiz est déjà en cours. Répondez A, B ou C.");
    }

    // API quiz anglaise
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
    const q = res.data.results[0];

    const answers = [
      q.correct_answer,
      ...q.incorrect_answers
    ].sort(() => Math.random() - 0.5);

    const correctIndex = answers.indexOf(q.correct_answer);
    const correctLetter = ["A", "B", "C"][correctIndex];

    activeQuiz[chatId] = {
      answer: correctLetter,
      start: Date.now()
    };

    const text = `
🧊 FREEZE.IO QUIZ 🧠

❓ Question :
${q.question}

A) ${answers[0]}
B) ${answers[1]}
C) ${answers[2]}

⏱️ Vous avez 15 secondes
✍️ Répondez : A , B ou C
    `.trim();

    await message.reply(text);

    // TIMEOUT
    setTimeout(() => {
      if (activeQuiz[chatId]) {
        message.reply(
          `⏰ Temps écoulé !\n✅ Bonne réponse : ${activeQuiz[chatId].answer}`
        );
        delete activeQuiz[chatId];
      }
    }, 15000);
  },

  async onChat({ message }) {
    const chatId = message.chat.id;
    if (!activeQuiz[chatId]) return;

    const userAnswer = message.text?.toUpperCase();
    if (!["A", "B", "C"].includes(userAnswer)) return;

    const quiz = activeQuiz[chatId];
    const time = ((Date.now() - quiz.start) / 1000).toFixed(1);

    if (userAnswer === quiz.answer) {
      message.reply(
        `🎉 BRAVO ${message.from.first_name} !

✅ Bonne réponse : ${quiz.answer}
⏱️ Temps : ${time}s
🏆 +10 points
🔥 FREEZE.IO`
      );
    } else {
      message.reply(
        `❌ Mauvaise réponse ${message.from.first_name}
✅ La bonne était : ${quiz.answer}`
      );
    }

    delete activeQuiz[chatId];
  }
};
