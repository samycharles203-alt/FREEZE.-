const axios = require('axios');

let quizAutoInterval = null;
let currentQuiz = null;
let scores = {}; // {id: {name, points}}

// API traduction gratuite (LibreTranslate)
async function translateToFr(text) {
    try {
        const res = await axios.post('https://libretranslate.com/translate', {
            q: text,
            source: 'en',
            target: 'fr',
            format: 'text'
        });
        return res.data.translatedText;
    } catch (err) {
        console.error("Translation error:", err.message);
        return text;
    }
}

module.exports = {
    nix: {
        name: 'quiz',
        prefix: false,
        role: 0,
        category: 'fun',
        aliases: ['trivia'],
        author: 'Samycharles',
        version: '0.0.3',
        description: 'Quiz interactif avec boutons A/B/C et traduction'
    },

    async onStart({ bot, chatId }) {
        const buttons = [
            [{ text: "🕹 Quiz maintenant", callback_data: "quiz_now" }],
            [{ text: "⚡ Quiz Auto ON", callback_data: "quiz_auto_on" }],
            [{ text: "⏹ Quiz OFF", callback_data: "quiz_auto_off" }]
        ];

        await bot.sendMessage(chatId, "🎉 Bienvenue au Quiz Nix ! Choisissez une option :", {
            reply_markup: { inline_keyboard: buttons }
        });
    }
};

// --- Récupérer question anglaise ---
async function fetchQuestion() {
    const res = await axios.get('https://opentdb.com/api.php', {
        params: { amount: 1, type: 'multiple', category: 9, encode: 'url3986' }
    });
    const q = res.data.results[0];
    const correct = decodeURIComponent(q.correct_answer);
    const incorrects = q.incorrect_answers.map(a => decodeURIComponent(a));
    let options = [correct, ...incorrects].sort(() => Math.random() - 0.5);

    return { question: decodeURIComponent(q.question), options, answer: correct };
}

// --- Envoi quiz avec boutons ---
async function sendQuiz(bot, chatId) {
    let quiz = await fetchQuestion();

    // Traduction en français
    quiz.question = await translateToFr(quiz.question);
    quiz.options = await Promise.all(quiz.options.slice(0,3).map(async o => await translateToFr(o)));
    quiz.answer = await translateToFr(quiz.answer);

    currentQuiz = quiz;

    // Créer boutons A/B/C
    const labels = ['A','B','C'];
    const buttons = quiz.options.map((opt, i) => [{ text: labels[i], callback_data: `quiz_answer_${labels[i]}` }]);

    // Message avec options écrites
    let text = `❓ ${quiz.question}\n\n`;
    for (let i = 0; i < 3; i++) text += `${labels[i]}: ${quiz.options[i]}\n`;
    text += `\n⏳ Vous avez 15 secondes pour répondre !`;

    await bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: buttons } });

    // Timer 15s
    setTimeout(() => {
        if (currentQuiz === quiz) {
            currentQuiz = null;
            bot.sendMessage(chatId, "🕰️ Temps écoulé ! Personne n'a répondu. La prochaine question arrive bientôt.");
        }
    }, 15000);
}

// --- Gestion des clics boutons ---
if (global.bot) {
    global.bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const username = query.from.first_name || query.from.username || "Utilisateur";

        // Boutons du menu principal
        if (query.data === "quiz_now") {
            sendQuiz(global.bot, chatId);
            await global.bot.answerCallbackQuery(query.id);
            return;
        }
        if (query.data === "quiz_auto_on") {
            if (quizAutoInterval) return global.bot.answerCallbackQuery(query.id, { text: "⚡ Quiz auto déjà activé !" });
            quizAutoInterval = setInterval(() => sendQuiz(global.bot, chatId), 30000);
            await global.bot.answerCallbackQuery(query.id, { text: "⚡ Quiz auto activé !" });
            return;
        }
        if (query.data === "quiz_auto_off") {
            clearInterval(quizAutoInterval);
            quizAutoInterval = null;
            await global.bot.answerCallbackQuery(query.id, { text: "⏹ Quiz auto désactivé !" });
            return;
        }

        // Réponse A/B/C
        if (query.data.startsWith("quiz_answer_") && currentQuiz) {
            const selectedLabel = query.data.split("quiz_answer_")[1];
            const index = ['A','B','C'].indexOf(selectedLabel);
            const selected = currentQuiz.options[index];

            if (!scores[userId]) scores[userId] = { name: username, points: 0 };

            let replyText = "";
            if (selected === currentQuiz.answer) {
                scores[userId].points += 1;
                replyText = `✅ Correct ! ${username} gagne 1 point. Total: ${scores[userId].points}`;
            } else {
                replyText = `❌ Faux ! La bonne réponse était : ${currentQuiz.answer}. ${username} a ${scores[userId].points} point(s).`;
            }

            currentQuiz = null;
            await global.bot.sendMessage(chatId, replyText);
            await global.bot.answerCallbackQuery(query.id);
        }
    });
      }
