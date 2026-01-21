const axios = require('axios');

let quizAutoInterval = null;
let currentQuiz = null;
let scores = {}; // stocke le score par utilisateur {id: {name, points}}

module.exports = {
    nix: {
        name: 'quiz',
        prefix: false,
        role: 0,
        category: 'fun',
        aliases: ['trivia'],
        author: 'Samycharles',
        version: '0.0.1',
        description: 'Quiz interactif avec score et mode auto'
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

// --- Fonction pour récupérer une question aléatoire ---
async function fetchQuestion() {
    const res = await axios.get('https://opentdb.com/api.php', {
        params: { amount: 1, type: 'multiple', encode: 'url3986' }
    });
    const q = res.data.results[0];
    const correct = decodeURIComponent(q.correct_answer);
    let options = [correct, ...q.incorrect_answers.map(a => decodeURIComponent(a))];
    options = options.sort(() => Math.random() - 0.5); // mélange
    return {
        question: decodeURIComponent(q.question),
        options,
        answer: correct
    };
}

// --- Fonction pour envoyer une question ---
async function sendQuiz(bot, chatId) {
    const quiz = await fetchQuestion();
    currentQuiz = quiz;

    // Crée boutons A/B/C
    const labels = ['A', 'B', 'C'];
    const buttons = quiz.options.slice(0,3).map((opt, i) => [{ text: labels[i], callback_data: `quiz_answer_${labels[i]}` }]);

    // Message texte avec options
    let text = `❓ ${quiz.question}\n\n`;
    for (let i = 0; i < 3; i++) {
        text += `${labels[i]}: ${quiz.options[i]}\n`;
    }
    text += `\n⏳ Vous avez 15 secondes pour répondre !`;

    await bot.sendMessage(chatId, text, {
        reply_markup: { inline_keyboard: buttons }
    });

    // Timer 15s si personne ne répond → supprime message
    setTimeout(() => {
        if (currentQuiz === quiz) {
            currentQuiz = null;
            bot.sendMessage(chatId, "⌛ Temps écoulé ! Personne n'a répondu. La prochaine question arrive bientôt.");
        }
    }, 15000);
}

// --- Gestion des clics ---
if (global.bot) {
    global.bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const msgId = query.message.message_id;
        const userId = query.from.id;
        const username = query.from.first_name || query.from.username || "Utilisateur";

        // Quiz maintenant
        if (query.data === "quiz_now") {
            sendQuiz(global.bot, chatId);
            await global.bot.answerCallbackQuery(query.id);
            return;
        }

        // Quiz auto ON
        if (query.data === "quiz_auto_on") {
            if (quizAutoInterval) {
                await global.bot.answerCallbackQuery(query.id, { text: "⚡ Quiz auto déjà activé !" });
                return;
            }
            quizAutoInterval = setInterval(() => sendQuiz(global.bot, chatId), 30000);
            await global.bot.answerCallbackQuery(query.id, { text: "⚡ Quiz auto activé !" });
            return;
        }

        // Quiz OFF
        if (query.data === "quiz_auto_off") {
            clearInterval(quizAutoInterval);
            quizAutoInterval = null;
            await global.bot.answerCallbackQuery(query.id, { text: "⏹ Quiz auto désactivé !" });
            return;
        }

        // Réponses A/B/C
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

            currentQuiz = null; // Question terminée
            await global.bot.sendMessage(chatId, replyText);
            await global.bot.answerCallbackQuery(query.id);
        }
    });
}
