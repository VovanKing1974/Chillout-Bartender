document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatOutput = document.getElementById('chat-output');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const choiceButtonsContainer = document.getElementById('choice-buttons');
    const recipeDisplay = document.getElementById('recipe-display');
    const recipeNameEl = document.getElementById('recipe-name');
    const recipeTextEl = document.getElementById('recipe-text');
    const techniqueNoteEl = document.getElementById('technique-note');
    const copyButton = document.getElementById('copy-button');
    const nextButton = document.getElementById('next-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    // State
    let currentStep = 0;
    let userData = {
        tonic: null,
        location: null,
        weather: null,
        time: null,
        ingredientsRaw: null, // Raw input
        ingredientsParsed: {} // Parsed object
    };

    // Data
    const tonics = [
        { name: "Premium English Tonic", keywords: ["english", "premium", "классический"], description: "Сбалансированный вкус с легкой горчинкой и цитрусовым ароматом." },
        { name: "Bitter Lemon", keywords: ["lemon", "лимон"], description: "Вкус лимона с терпкой горчинкой цедры." },
        { name: "Bitter Grapefruit", keywords: ["grapefruit", "грейпфрут"], description: "Сочетание горечи тоника с фруктовыми нотками грейпфрута." },
        { name: "Bitter Mалина", keywords: ["малина", "raspberry"], description: "Классическая горечь тоника с яркой ноткой малины." }
    ];

     // --- Ingredient Keywords ---
    const spirits = new Set(['джин', 'водка', 'ром', 'белый ром', 'темный ром', 'текила', 'виски', 'бурбон', 'скотч', 'mezcal', 'мескаль', 'gin', 'vodka', 'rum', 'tequila', 'whiskey', 'bourbon']);
    const liqueurs = new Set(['трипл сек', 'куантро', 'cointreau', 'triple sec', 'мараскино', 'maraschino', 'сен жермен', 'st germain', 'бузина', 'elderflower', 'апероль', 'aperol', 'кампари', 'campari', 'вермут', 'vermouth']);
    const juices = new Set(['лайм', 'лимон', 'апельсин', 'грейпфрут', 'клюква', 'ананас', 'яблоко', 'гранат', 'томат', 'lime', 'lemon', 'orange', 'grapefruit', 'cranberry', 'pineapple', 'apple']);
    const syrups = new Set(['сахар', 'сахарный', 'простой', 'мед', 'медовый', 'агава', 'кленовый', 'гренадин', 'маракуйя', 'малина', 'клубника', 'роза', 'фиалка', 'имбирь', 'корица', 'sugar', 'simple', 'honey', 'agave', 'maple', 'grenadine', 'passion fruit']);
    const herbs = new Set(['мята', 'базилик', 'розмарин', 'тимьян', 'чабрец', 'шалфей', 'лаванда', 'mint', 'basil', 'rosemary', 'thyme', 'sage', 'lavender']);
    const fruitsAndVeg = new Set(['ягоды', 'малина', 'клубника', 'ежевика', 'черника', 'смородина', 'огурец', 'перец', 'чили', 'имбирь', 'сельдерей', 'персик', 'манго', 'киви', 'berries', 'raspberry', 'strawberry', 'blackberry', 'blueberry', 'cucumber', 'pepper', 'chili', 'ginger', 'celery', 'peach', 'mango']);
    const bittersAndOther = new Set(['биттер', 'ангостура', 'angostura', 'orange bitters', 'содовая', 'газировка', 'яйцо', 'белок', 'желток', 'соль', 'тоник', 'bitters', 'soda', 'egg', 'egg white', 'salt', 'tonic']);


    const questions = [
        /* 0 */ "Привет! Я твой Chillout Бартендер <i class=\"fa-solid fa-martini-glass\"></i>. Готов создать уникальный коктейль? Сначала выбери тоник, который у тебя есть:",
        /* 1 */ "Отлично! <i class=\"fa-solid fa-location-dot\"></i> Где планируешь наслаждаться коктейлем: на улице или в помещении?",
        /* 2 */ "<i class=\"fa-solid fa-cloud-sun\"></i> Понял. А какая погода на улице? (Солнечно, Облачно, Ветрено, Жарко, Комфортно)", // Этот шаг может быть пропущен
        /* 3 */ "<i class=\"fa-regular fa-clock\"></i> Окей! В какое время суток будешь пить коктейль?",
        /* 4 */ "<i class=\"fa-solid fa-lemon\"></i><i class=\"fa-solid fa-leaf\"></i> Супер! Теперь перечисли через запятую другие ингредиенты, которые у тебя есть (например: джин, мята, лайм, сахарный сироп...). Чем подробнее, тем лучше!",
        /* 5 */ "Все данные собраны! <i class=\"fa-solid fa-magic-wand-sparkles\"></i> Генерирую твой уникальный рецепт..." // Сообщение перед генерацией
    ];

    // --- Core Functions ---

    function displayMessage(text, sender = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        const iconClass = sender === 'bot' ? 'fa-solid fa-robot' : 'fa-regular fa-user';
        messageDiv.innerHTML = `<i class="${iconClass}"></i> <div>${text}</div>`;
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

     function parseIngredients(rawInput) {
        const ingredients = {
            spirits: new Set(), liqueurs: new Set(), juices: new Set(), syrups: new Set(),
            herbs: new Set(), fruitsAndVeg: new Set(), bittersAndOther: new Set(), unknown: new Set()
        };
        if (!rawInput || rawInput.toLowerCase() === 'только тоник' || rawInput.toLowerCase() === 'нет') return ingredients;
        const words = rawInput.toLowerCase().replace(/[.,;:]/g, ' ').split(/\s+/).filter(word => word.length > 1);
        for (let i = 0; i < words.length; i++) {
             let currentWord = words[i];
             if (spirits.has(currentWord)) ingredients.spirits.add(currentWord);
             else if (liqueurs.has(currentWord)) ingredients.liqueurs.add(currentWord);
             else if (juices.has(currentWord)) ingredients.juices.add(currentWord);
             else if (syrups.has(currentWord)) ingredients.syrups.add(currentWord);
             else if (herbs.has(currentWord)) ingredients.herbs.add(currentWord);
             else if (fruitsAndVeg.has(currentWord)) ingredients.fruitsAndVeg.add(currentWord);
             else if (bittersAndOther.has(currentWord)) ingredients.bittersAndOther.add(currentWord);
             else ingredients.unknown.add(currentWord);
        }
        console.log("Parsed Ingredients:", ingredients);
        return ingredients;
    }


    function clearChoiceButtons() {
        choiceButtonsContainer.innerHTML = '';
    }

    function addChoiceButton(text, value, iconClass = null) {
        const button = document.createElement('button');
        let buttonContent = text;
        if (iconClass) {
            buttonContent = `<i class="${iconClass}"></i> ${text}`;
        }
        button.innerHTML = buttonContent;
        button.onclick = () => {
            displayMessage(text, 'user');
            processInput(value);
        };
        choiceButtonsContainer.appendChild(button);
    }

     function typewriterEffect(element, text, speed = 25, callback) {
        let i = 0;
        element.innerHTML = "";
        function type() {
            if (i < text.length) {
                // Use innerText or textContent to prevent HTML parsing issues during typing
                // This ensures the main text doesn't accidentally render HTML
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                // Call the callback AFTER the loop finishes
                callback();
            }
        }
        // Start typing
        type();
    }


    function askQuestion() {
        console.log(`askQuestion called with currentStep: ${currentStep}`);
        clearChoiceButtons();
        recipeDisplay.style.display = 'none';
        loadingIndicator.style.display = 'none';
        userInput.style.display = 'none';
        sendButton.style.display = 'none';
        userInput.disabled = false;

        if (currentStep >= questions.length) {
            console.error(`Error: currentStep (${currentStep}) is out of bounds for questions array.`);
            resetChat();
            return;
        }

        const questionText = questions[currentStep];
        displayMessage(questionText, 'bot');

        switch (currentStep) {
            case 0: // Тоник
                tonics.forEach(tonic => addChoiceButton(tonic.name, tonic.name, 'fa-solid fa-bottle-water'));
                break;
            case 1: // Локация
                addChoiceButton("На улице", "улица", "fa-solid fa-sun");
                addChoiceButton("В помещении", "помещение", "fa-solid fa-house");
                break;
            case 2: // Погода
                userInput.style.display = 'block';
                sendButton.style.display = 'flex';
                userInput.placeholder = "Какая погода?";
                addChoiceButton("Солнечно", "Солнечно", "fa-solid fa-sun");
                addChoiceButton("Облачно", "Облачно", "fa-solid fa-cloud");
                addChoiceButton("Ветрено", "Ветрено", "fa-solid fa-wind");
                addChoiceButton("Жарко", "Жарко", "fa-solid fa-temperature-high");
                addChoiceButton("Комфортно", "Комфортно", "fa-regular fa-face-smile");
                userInput.focus();
                break;
            case 3: // Время суток
                addChoiceButton("Утро", "Утро", "fa-solid fa-mug-saucer");
                addChoiceButton("День", "День", "fa-regular fa-sun");
                addChoiceButton("Вечер", "Вечер", "fa-solid fa-cloud-moon");
                addChoiceButton("Ночь", "Ночь", "fa-solid fa-moon");
                break;
            case 4: // Ингредиенты
                userInput.style.display = 'block';
                sendButton.style.display = 'flex';
                userInput.placeholder = "Пример: джин, лед, лайм, ягоды...";
                userInput.focus();
                break;
            case 5: // Генерация
                userInput.disabled = true;
                loadingIndicator.style.display = 'block';
                setTimeout(generateRecipe, 1500);
                break;
            default:
                console.error("Неизвестный шаг:", currentStep);
                resetChat();
                break;
        }
    }

    function processInput(value) {
        const inputText = (typeof value === 'string' ? value : userInput.value).trim();
        console.log(`processInput called. currentStep: ${currentStep}, value: ${value}, inputText: ${inputText}`);

        let validationPassed = true;
        if (currentStep === 4 && !inputText) {
            displayMessage("<i class='fa-solid fa-triangle-exclamation'></i> Пожалуйста, укажи ингредиенты или напиши 'нет'.", 'bot');
            validationPassed = false;
        }
        if (currentStep === 2 && !inputText && typeof value !== 'string') {
             displayMessage("(Погода не указана)", 'user');
             userData.weather = "не указана";
             currentStep++;
             askQuestion();
             return;
        }

        if (!validationPassed) {
            return;
        }

        if (typeof value !== 'string' && inputText) {
            displayMessage(inputText, 'user');
        } else if (!inputText && currentStep !== 2) {
            return;
        }

        const stepBeforeIncrement = currentStep;
        switch (stepBeforeIncrement) {
            case 0: userData.tonic = inputText; break;
            case 1: userData.location = inputText; break;
            case 2: userData.weather = inputText; break;
            case 3: userData.time = inputText; break;
            case 4:
                 userData.ingredientsRaw = inputText;
                 userData.ingredientsParsed = parseIngredients(inputText);
                 break;
        }

        let nextStep = stepBeforeIncrement + 1;
        if (stepBeforeIncrement === 1 && userData.location === 'помещение') {
            console.log("Location is 'помещение', skipping weather step.");
            nextStep++;
            userData.weather = null;
        }
        currentStep = nextStep;

        userInput.value = '';
        console.log(`Moving to next step: ${currentStep}`);
        askQuestion();
    }


    function generateRecipe() {
        loadingIndicator.style.display = 'none';
        const { tonic, location, weather, time, ingredientsParsed } = userData;
        const tonicInfo = tonics.find(t => t.name === tonic);
        const tonicKeywords = tonicInfo ? new Set(tonicInfo.keywords) : new Set();

        let name = "Chillout ";
        let instructions = "";
        let technique = "build";
        let garnish = "";
        const has = (category, item) => ingredientsParsed[category]?.has(item);
        const hasAny = (category) => ingredientsParsed[category]?.size > 0;
        const spirit = [...ingredientsParsed.spirits][0] || null;
        const hasCitrus = hasAny('juices') && ([...ingredientsParsed.juices].some(j => ['лайм', 'лимон', 'грейпфрут', 'lime', 'lemon', 'grapefruit'].includes(j)));
        const hasSyrup = hasAny('syrups');
        const hasHerbs = hasAny('herbs');
        const hasFruits = hasAny('fruitsAndVeg');
        const hasEggWhite = has('bittersAndOther', 'белок') || has('bittersAndOther', 'яйцо');

        // Naming Logic
        name += `${time} `;
        if (tonicKeywords.has('lemon')) name += "Лимонный ";
        else if (tonicKeywords.has('grapefruit')) name += "Грейпфрутовый ";
        else if (tonicKeywords.has('малина')) name += "Малиновый ";
        else name += "Классик ";
        if (location === 'улица') {
            if (weather === 'Жарко') name += "Бриз";
            else if (weather === 'Солнечно') name += "Саншайн";
            else if (weather === 'Комфортно' || weather === 'Облачно') name += "Дэй";
            else if (weather === 'Ветрено') name += "Вайб";
            else name += "Стрит";
        } else {
            if (time === 'Вечер' || time === 'Ночь') name += "Найт Лаунж";
            else name += "Хоум Спешл";
        }
        if (spirit) name += ` с ${spirit.charAt(0).toUpperCase() + spirit.slice(1)}`;

        // Recipe Steps Logic
        const glass = "Высокий бокал (хайбол)";
        instructions += `1. Наполни ${glass} кубиками льда доверху.\n`;
        let step = 2;

        if (hasEggWhite) technique = "dry shake + shake";
        else if (hasCitrus && spirit && hasSyrup) technique = "shake";
        else if (hasCitrus && spirit) technique = "shake";

        if (technique.includes("shake")) {
             instructions = `1. Подготовь шейкер.\n`;
             if (hasEggWhite) {
                 instructions += `2. Добавь в шейкер ${spirit ? '50 мл ' + spirit : 'основу'}, ${hasCitrus ? '25 мл сока' : ''}, ${hasSyrup ? '15 мл сиропа' : ''} и яичный белок (без льда).\n`;
                 instructions += `3. Энергично взбей (драй шейк) 15 секунд.\n`;
                 instructions += `4. Добавь лед в шейкер и снова хорошо взбей (10-15 секунд).\n`;
                 instructions += `5. Процеди через стрейнер в охлажденный бокал (можно добавить свежий лед).\n`;
                 step = 6;
             } else {
                 instructions += `2. Добавь в шейкер ${spirit ? '50 мл ' + spirit : 'ингредиенты (кроме тоника)'}${hasCitrus ? ', 25 мл сока лайма/лимона' : ''}${hasSyrup ? ', 15 мл сиропа' : ''}.\n`;
                 if (hasHerbs && (has('herbs','мята') || has('herbs','mint'))) instructions += "   - Несколько листиков мяты (можно слегка прихлопнуть).\n";
                 if (hasFruits && (has('fruitsAndVeg','ягоды') || has('fruitsAndVeg','малина') || has('fruitsAndVeg','клубника'))) instructions += "   - 3-4 ягоды (можно слегка размять).\n";
                 instructions += `3. Добавь лед и энергично взбей (10-15 секунд).\n`;
                 instructions += `4. Процеди через стрейнер в ${glass}, наполненный свежим льдом.\n`;
                 step = 5;
             }
         } else { // Build
             if (spirit) { instructions += `${step++}. Добавь 50 мл ${spirit}.\n`; }
             if (hasAny('liqueurs')) { const liqueur = [...ingredientsParsed.liqueurs][0]; instructions += `${step++}. Добавь 15-20 мл ликера ${liqueur}.\n`; }
             if (hasCitrus) { const citrus = [...ingredientsParsed.juices].find(j => ['лайм', 'лимон', 'грейпфрут', 'lime', 'lemon', 'grapefruit'].includes(j)); instructions += `${step++}. Выжми сок ${citrus === 'грейпфрут' ? 'четвертинки' : 'половинки'} ${citrus} (~20-25 мл).\n`; }
             else if (hasAny('juices')) { const otherJuice = [...ingredientsParsed.juices][0]; instructions += `${step++}. Добавь 30-40 мл сока ${otherJuice}.\n`; }
             if (hasSyrup) { const syrup = [...ingredientsParsed.syrups][0]; instructions += `${step++}. Добавь 10-15 мл ${syrup} сиропа.\n`; }
             if (hasHerbs && (has('herbs','мята') || has('herbs','mint'))) { instructions += `${step++}. Слегка прихлопни ладонью 5-6 листиков мяты и добавь в бокал.\n`; if (!garnish) garnish = "веточкой мяты"; }
             if (hasFruits && (has('fruitsAndVeg','ягоды') || has('fruitsAndVeg','малина') || has('fruitsAndVeg','клубника'))) { instructions += `${step++}. Добавь 3-4 свежие ягоды (можно слегка размять).\n`; if (!garnish) garnish = "свежими ягодами"; }
             if (has('fruitsAndVeg','огурец')) { instructions += `${step++}. Добавь 2-3 тонких слайса огурца.\n`; if (!garnish) garnish = "слайсом огурца"; }
             if (hasAny('bittersAndOther') && !hasEggWhite) { const bitter = [...ingredientsParsed.bittersAndOther].find(b => b.includes('bitter') || b.includes('ангостура')); if (bitter) { instructions += `${step++}. Добавь 2-3 капли (дэш) биттера ${bitter}.\n`; } }
         }

        instructions += `${step++}. Долей доверху (~150 мл) тоником Chillout ${tonic}.\n`;
        if (technique === 'build') { instructions += `${step++}. Аккуратно перемешай барной ложкой.\n`; }
        else if (technique.includes('shake')) { if (has('bittersAndOther', 'содовая')) { instructions += `${step++}. Можно добавить немного содовой (~30 мл).\n`; } }

        // Garnish Logic
        if (!garnish) {
            if (hasCitrus) { const citrusGarnish = [...ingredientsParsed.juices].find(j => ['лайм', 'лимон', 'грейпфрут', 'lime', 'lemon', 'grapefruit'].includes(j)); garnish = `долькой ${citrusGarnish}`; }
            else if (has('fruitsAndVeg', 'огурец')) { garnish = "слайсом огурца"; }
            else if (tonicKeywords.has('lemon')) garnish = "долькой лимона";
            else if (tonicKeywords.has('grapefruit')) garnish = "долькой грейпфрута";
            else if (tonicKeywords.has('малина')) garnish = "ягодами малины";
            else if (hasHerbs) garnish = `веточкой ${[...ingredientsParsed.herbs][0]}`;
            else garnish = "долькой лайма или лимона";
        }
        instructions += `${step}. Укрась ${garnish}.\n\n`;

        // Final message text without the icon tag initially
        const finalText = `Готово! Наслаждайся своим "${name}"!`;

        // Technique Note
        let techniqueIcon = "fa-solid fa-hand-pointer";
        let techniqueText = "Просто смешай ингредиенты в бокале со льдом.";
        if (technique === "shake") { techniqueIcon = "fa-solid fa-martini-glass"; techniqueText = "Используй шейкер для лучшего смешивания."; }
        else if (technique === "dry shake + shake") { techniqueIcon = "fa-solid fa-egg"; techniqueText = "Двойное взбивание для идеальной пенки."; }
        techniqueNoteEl.innerHTML = `<i class="${techniqueIcon}"></i> Рекомендуемая техника: ${techniqueText}`;

        // --- Display Recipe ---
        recipeNameEl.textContent = name;
        recipeDisplay.style.display = 'block';
        // Use textContent for typewriter to avoid intermediate HTML parsing issues
        recipeTextEl.textContent = '';

        // Type out the main instructions
        typewriterEffect(recipeTextEl, instructions + finalText, 20, () => {
            // This callback runs AFTER typing is complete

            // Now safely append the icon HTML using innerHTML
            // We reference the element again to ensure we modify the final state
            document.getElementById('recipe-text').innerHTML += ' <i class="fa-solid fa-champagne-glasses"></i>';

            // Show buttons
            document.getElementById('recipe-buttons').style.display = 'flex';
        });

        chatOutput.scrollTop = chatOutput.scrollHeight;
    }


    function resetChat() {
        currentStep = 0;
        userData = { tonic: null, location: null, weather: null, time: null, ingredientsRaw: null, ingredientsParsed: {} };
        chatOutput.innerHTML = '';
        recipeDisplay.style.display = 'none';
        loadingIndicator.style.display = 'none';
        clearChoiceButtons();
        userInput.value = '';
        userInput.disabled = false;
        userInput.style.display = 'block';
        sendButton.style.display = 'flex';
        askQuestion();
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', () => processInput());
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !userInput.disabled) {
            processInput();
        }
    });

    copyButton.addEventListener('click', () => {
        // Make sure to copy the final innerHTML content which includes the icon
        const finalRecipeHTML = document.getElementById('recipe-text').innerHTML;
        // For clipboard, we might want plain text. Let's reconstruct it.
        // Or copy the HTML structure if intended. Let's stick to plain text for simplicity.
        const recipePlainText = `${recipeNameEl.textContent}\n\n${document.getElementById('recipe-text').innerText}\n\n(${techniqueNoteEl.textContent.trim()})`;

        navigator.clipboard.writeText(recipePlainText).then(() => {
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Скопировано!';
            setTimeout(() => { copyButton.innerHTML = '<i class="fa-solid fa-copy"></i> Скопировать'; }, 1500);
        }).catch(err => {
            console.error('Ошибка копирования: ', err);
             copyButton.innerHTML = '<i class="fa-solid fa-times"></i> Ошибка';
             setTimeout(() => { copyButton.innerHTML = '<i class="fa-solid fa-copy"></i> Скопировать'; }, 2000);
        });
    });

    nextButton.addEventListener('click', resetChat);

    // --- Initial Call ---
    askQuestion(); // Start the conversation
});