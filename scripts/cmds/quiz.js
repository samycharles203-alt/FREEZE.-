const axios = require("axios");

let currentQuiz = null;
let quizTimeout = null;
let scores = {}; // { userId: { name, points } }

// Traduction EN → FR
async function translateToFr(text) {
  try {
    const res = await axios.post("https://libretranslate.com/translate", {
      q: text,
      source: "en",
      target: "fr",
      format: "text"
    });
    return res.data.translatedText;
  } catch {
    return text;
  }
}

module.exports = {
  nix: {
    name: "quiz",
    prefix: false,
    role: 0,
    category: "fun",
    author: "FREEZE.IO",
    version: "1.0.0",
    description: "Quiz sans boutons – répondre A B ou C"
  },

  // 🔥 Quand on tape "quiz"
  async onStart({ message }) {
    if (currentQuiz) {
      return message.reply("⚠️ Un quiz est déjà en cours !");
    }

    const quiz = await getQuiz();
    currentQuiz = quiz;

    let text =
`🧊 FREEZE.IO – QUIZ 🎯

❓ ${quiz.question}

A) ${quiz.options[0]}
B) ${quiz.options[1]}
C) ${quiz.options[2]}

⏳ Réponds par A, B ou C
⏱️ Temps : 15 secondes`;

    await message.reply(text);

    quizTimeout = setTimeout(() => {
      if (currentQuiz) {
        currentQuiz = null;
        message.reply("🕰️ Temps écoulé ! Personne n’a répondu.");
      }
    }, 15000);
  },

  // 💬 Quand quelqu’un parle
  async onChat({ message }) {
    if (!currentQuiz) return;

    const answer = message.body.trim().toUpperCase();
    if (!["A", "B", "C"].includes(answer)) return;

    clearTimeout(quizTimeout);

    const index = { A: 0, B: 1, C: 2 }[answer];
    const userId = message.sender.id;
    const username = message.sender.name || "Utilisateur";

    if (!scores[userId]) {
      scores[userId] = { name: username, points: 0 };
    }

    let reply = "";

    if (currentQuiz.options[index] === currentQuiz.answer) {
      scores[userId].points += 1;
      reply =
`✅ Bonne réponse !

👤 ${username}
🏆 Score : ${scores[userId].points}`;
    } else {
      reply =
`❌ Mauvaise réponse !

✔️ Bonne réponse : ${currentQuiz.answer}
👤 ${username}
🏆 Score : ${scores[userId].points}`;
    }

    currentQuiz = null;
    await message.reply(reply);
  }
};

// 📡 Récupération question
async function getQuiz() {
  const res = await axios.get("https://opentdb.com/api.php", {
    params: {
      amount: 1,
      type: "multiple",
      category: 9,
      encode: "url3986"
    }
  });

  const q = res.data.results[0];
  const correct = decodeURIComponent(q.correct_answer);
  const incorrect = q.incorrect_answers.map(a => decodeURIComponent(a));

  let options = [correct, ...incorrect].sort(() => Math.random() - 0.5);

  return {
    question: await translateToFr(decodeURIComponent(q.question)),
    options: await Promise.all(options.slice(0, 3).map(o => translateToFr(o))),
    answer: await translateToFr(correct)
  };
}
