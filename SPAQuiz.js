const startPage = document.getElementById("start-page");
const quizView = document.getElementById("quiz-view");
const feedbackView = document.getElementById("feedback-view");
const resultView = document.getElementById("result-view");
const quizForm = document.getElementById("quiz-selection-form");
const quizSelect = document.getElementById("quiz-select");
const studentNameInput = document.getElementById("student-name");
const quizTemplate = document.getElementById("quiz-template").innerHTML;

let quizData; 
let currentQuestionIndex = 0; 
let correctAnswers = 0; 
let totalQuestions; 
let startTime; 

// Add event listener to the form submission on the start page
quizForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const selectedQuiz = quizSelect.value;
    const studentName = studentNameInput.value;
    startQuiz(selectedQuiz, studentName);
});

// Function to fetch quiz data from the static REST API
async function fetchQuizData(selectedQuiz) {
    const response = await fetch(`https://my-json-server.typicode.com/pushpachoudhury/SPAQuiz/${selectedQuiz}`);
    const data = await response.json();
    return data;
}

// Function to start the quiz
async function startQuiz(selectedQuiz, studentName) {
    
    quizData = await fetchQuizData(selectedQuiz);
    totalQuestions = quizData.questions.length;
    
    startPage.style.display = "none";
    renderQuiz();
   
    startTime = new Date().getTime();
}

// Function to render quiz questions dynamically
function renderQuiz() {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const template = Handlebars.compile(quizTemplate);

    renderScoreboard();

    if (currentQuestion.type === "narrative") {
        renderNarrativeQuestion(currentQuestion, template);
    } else {
        renderMultipleChoiceQuestion(currentQuestion, template);
    }
}

// Function to render the scoreboard
function renderScoreboard() {
    const questionsAnswered = currentQuestionIndex;
    const elapsedTime = calculateElapsedTime();
    const score = calculateScore();
    const scoreboardHTML = `
        <div class="scoreboard">
            <p>Questions Answered: ${questionsAnswered}</p>
            <p>Elapsed Time: ${elapsedTime} </p>
            <p>Total Score: ${score}%</p>
        </div>
    `;
    feedbackView.innerHTML = scoreboardHTML;
}

// Function to calculate the elapsed time in minutes and seconds
function calculateElapsedTime() {
    const currentTime = new Date().getTime();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    
    // Calculate minutes and seconds
    const minutes = Math.floor(elapsedTimeInSeconds / 60);
    const seconds = Math.floor(elapsedTimeInSeconds % 60);
    
    // Format the elapsed time
    let formattedTime = `${minutes} minutes`;
    if (seconds > 0) {
        formattedTime += ` ${seconds} seconds`;
    }

    return formattedTime;
}



// Function to calculate the score
function calculateScore() {
    return Math.round((correctAnswers / totalQuestions) * 100);
}
// Function to render a narrative question
function renderNarrativeQuestion(question, template) {
    const html = template({ question: question.question });
    quizView.innerHTML = html;


    const existingSubmitButton = document.getElementById("submit-answer-btn");
    if (existingSubmitButton) {
        existingSubmitButton.remove();
    }

    const inputField = document.createElement("input");
    inputField.setAttribute("type", "text");
    inputField.setAttribute("id", "narrative-answer");
    inputField.setAttribute("placeholder", "Enter your answer...");
    quizView.appendChild(inputField);

    const submitButton = document.createElement("button");
    submitButton.setAttribute("type", "button"); // Change type to "button"
    submitButton.setAttribute("id", "submit-answer-btn");
    submitButton.classList.add("btn", "btn-light");
    submitButton.textContent = "Submit Answer";
    quizView.appendChild(submitButton);

    submitButton.addEventListener("click", function(event) {
        event.preventDefault();
        const userInput = document.getElementById("narrative-answer").value.trim();
        submitAnswer(userInput);
    });
}



// Function to render a multiple choice question
function renderMultipleChoiceQuestion(question, template) {

    const options = question.options.map(option => {

        if (option.startsWith("http")) {
            return { image: true, content: option };
        } else {
            return { image: false, content: option };
        }
    });

    const html = template({ question: question.question, options: options });
    quizView.innerHTML = html;

    const quizForm = document.getElementById("quiz-form");
    quizForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const selectedAnswer = document.querySelector("input[name='answer']:checked");
        if (!selectedAnswer) {
            displayFeedback("Please select an answer.");
            return;
        }
        submitAnswer(selectedAnswer.value);
    });
}

function submitAnswer(userInput) {
    const currentQuestion = quizData.questions[currentQuestionIndex];

    const isCorrect = currentQuestion.correctAnswer.toLowerCase() === userInput.toLowerCase();

    if (isCorrect) {
        correctAnswers++;
        displayFeedback("Correct! Well done!");
    } else {
        displayIncorrectFeedback(currentQuestion.correctAnswer);
    }
}




// Function to display feedback and advance to the next question
function displayFeedback(message) {
    feedbackView.textContent = message;
    setTimeout(function() {
        feedbackView.textContent = "";
        nextQuestion();
    }, 1000);
}

// Function to display incorrect feedback with correct answer and "Got it" button
function displayIncorrectFeedback(correctAnswer) {

    feedbackView.style.display = "none";

    const newFeedbackView = document.createElement("div");
    newFeedbackView.classList.add("feedback-view");

    const isImage = correctAnswer.startsWith("http");

    if (isImage) {

        newFeedbackView.innerHTML = `
            <p>Incorrect! The correct answer:</p>
            <img src="${correctAnswer}" alt="Correct Answer">
            <button id="got-it-btn" class="btn btn-primary">Got it</button>
        `;
    } else {

        newFeedbackView.innerHTML = `
            <p>Incorrect! The correct answer is: ${correctAnswer}</p>
            <button id="got-it-btn" class="btn btn-primary">Got it</button>
        `;
    }

    document.body.appendChild(newFeedbackView);

    // Add event listener to "Got it" button
    const gotItButton = document.getElementById("got-it-btn");
    gotItButton.addEventListener("click", function() {

        newFeedbackView.remove();
        
        feedbackView.style.display = "block";
        
        nextQuestion();
    });
}


// Function to display next question or end quiz
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
        renderQuiz();
    } else {
        endQuiz();
    }
}

// Function to end the quiz and display results
function endQuiz() {

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const elapsedTime = calculateElapsedTime();

    // Display result view
    resultView.innerHTML = `<h2>Quiz Results</h2>`;
    resultView.innerHTML += `<p>Total Score: ${score}%</p>`;
    resultView.innerHTML += `<p>Elapsed Time: ${elapsedTime}</p>`; // Add elapsed time

    // Determine pass/fail message
    let message;
    if (score >= 80) {
        message = `Congratulations ${studentNameInput.value}! You passed the quiz.`;
    } else {
        message = `Sorry ${studentNameInput.value}, you failed the quiz.`;
    }
    resultView.innerHTML += `<p>${message}</p>`;

    resultView.innerHTML += `
        <button id="retake-quiz-btn" class="btn btn-primary">Retake Quiz</button>
        <button id="return-to-main-btn" class="btn btn-secondary">Return to Main Page</button>
    `;

    document.getElementById("retake-quiz-btn").addEventListener("click", resetQuiz);

    document.getElementById("return-to-main-btn").addEventListener("click", function() {
        location.reload(); 
    });
}

// Function to reset quiz and start over
function resetQuiz() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    startPage.style.display = "block";
    quizView.innerHTML = "";
    feedbackView.innerHTML = "";
    resultView.innerHTML = "";
    // Restart the quiz
    startQuiz(quizSelect.value, studentNameInput.value);
}
