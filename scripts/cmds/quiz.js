const axios = require('axios');

let currentQuiz = null;
let scores = {}; // {id: {name, points}}

// Traduction en français
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
        version: '0.0.5',
        description: 'Quiz interactif FR, répondre avec A, B ou C'
    },

    async onStart({ message, bot, chatId }) {
        // Récupérer question
        const quiz = await fetchQuestion();
        currentQuiz = quiz;

        // Message texte avec options
        let text = `❓ ${quiz.question}\n\n`;
        const labels = ['A','B','C'];
        for (let i = 0; i < 3; i++) text += `${labels[i]}: ${quiz.options[i]}\n`;
        text += `\n⏳ Répondez par A, B ou C dans les 15 secondes !`;

        await message.reply(text);

        // Timer 15s
        setTimeout(() => {
            if (currentQuiz === quiz) {
                currentQuiz = null;
                bot.sendMessage(chatId, "🕰️ Temps écoulé ! Personne n'a répondu.");
            }
        }, 15000);
    },

    async onChat({ message, bot, chatId }) {
        if (!currentQuiz) return;

        const userId = message.sender.id;
        const username = message.sender.name || message.sender.username || "Utilisateur";
        const answer = message.body.trim().toUpperCase();

        const labels = ['A','B','C'];
        const index = labels.indexOf(answer);
        if (index === -1) return; // pas A/B/C

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
        await bot.sendMessage(chatId, replyText);
    }
};

// --- Fonction pour récupérer question anglaise et traduire ---
async function fetchQuestion() {
    const res = await axios.get('https://opentdb.com/api.php', {
        params: { amount: 1, type: 'multiple', category: 9, encode: 'url3986' }
    });

    const q = res.data.results[0];
    const correct = decodeURIComponent(q.correct_answer);
    const incorrects = q.incorrect_answers.map(a => decodeURIComponent(a));
    let options = [correct, ...incorrects].sort(() => Math.random() - 0.5);

    // Traduire question + options
    const questionFR = await translateToFr(decodeURIComponent(q.question));
    const optionsFR = await Promise.all(options.slice(0,3).map(o => translateToFr(o)));
    const answerFR = await translateToFr(correct);

    return { question: questionFR, options: optionsFR, answer: answerFR };
            }
