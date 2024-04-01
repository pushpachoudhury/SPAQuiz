// Define variables to store references to DOM elements
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
            <p>Elapsed Time: ${elapsedTime} seconds</p>
            <p>Total Score: ${score}%</p>
        </div>
    `;
    feedbackView.innerHTML = scoreboardHTML;
}

// Function to calculate the elapsed time
function calculateElapsedTime() {
    const currentTime = new Date().getTime();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    return elapsedTimeInSeconds.toFixed(1);
}

// Function to calculate the score
function calculateScore() {
    return Math.round((correctAnswers / totalQuestions) * 100);
}

// Function to render a narrative question
function renderNarrativeQuestion(question, template) {
    const html = template({ question: question.question });
    quizView.innerHTML = html;

    // Remove existing submit button, if any
    const existingSubmitButton = document.getElementById("submit-answer-btn");
    if (existingSubmitButton) {
        existingSubmitButton.remove();
    }

    // Create input field for narrative question
    const inputField = document.createElement("input");
    inputField.setAttribute("type", "text");
    inputField.setAttribute("id", "narrative-answer");
    inputField.setAttribute("placeholder", "Enter your answer...");
    quizView.appendChild(inputField);

    // Create submit button
    const submitButton = document.createElement("button");
    submitButton.setAttribute("type", "button"); // Change type to "button"
    submitButton.setAttribute("id", "submit-answer-btn");
    submitButton.classList.add("btn", "btn-light");
    submitButton.textContent = "Submit Answer";
    quizView.appendChild(submitButton);

    // Add event listener to submit answer button
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

    // Render the template with modified options
    const html = template({ question: question.question, options: options });
    quizView.innerHTML = html;

    // Remove existing submit button, if any
    const existingSubmitButton = document.getElementById("submit-answer-btn");
    if (existingSubmitButton) {
        existingSubmitButton.remove();
    }

    // Create submit button
    const submitButton = document.createElement("button");
    submitButton.setAttribute("type", "button"); 
    submitButton.setAttribute("id", "submit-answer-btn");
    submitButton.classList.add("btn", "btn-light");
    submitButton.textContent = "Submit Answer";
    quizView.appendChild(submitButton);

    // Add event listener to submit answer button
    submitButton.addEventListener("click", function(event) {
        event.preventDefault();
        const selectedAnswer = document.querySelector("input[name='answer']:checked");
        if (!selectedAnswer) {
            displayFeedback("Please select an answer.");
            return;
        }
        submitAnswer(selectedAnswer.value);
    });
}

// Function to submit the user's answer and display feedback
function submitAnswer(userInput) {
    const currentQuestion = quizData.questions[currentQuestionIndex];

    const isCorrect = currentQuestion.correctAnswer.includes(userInput.toLowerCase());

    if (isCorrect) {
        correctAnswers++;
        displayFeedback("Brilliant!");
    } else {
        displayIncorrectFeedback(currentQuestion);
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

// Function to display feedback for an incorrect answer
function displayIncorrectFeedback(question) {

    feedbackView.innerHTML = "";
    const feedbackMessage = `Incorrect! The correct answer is: ${question.correctAnswer[0]}`;

    const newFeedbackView = document.createElement("div");
    newFeedbackView.classList.add("feedback-view");

    const feedbackParagraph = document.createElement("p");
    feedbackParagraph.textContent = feedbackMessage;
    newFeedbackView.appendChild(feedbackParagraph);


    const gotItButton = document.createElement("button");
    gotItButton.textContent = "Got it";
    gotItButton.classList.add("btn", "btn-primary");

    gotItButton.addEventListener("click", function() {
        feedbackView.removeChild(newFeedbackView); 
        nextQuestion(); 
    });

    newFeedbackView.appendChild(gotItButton);
    
    feedbackView.appendChild(newFeedbackView);
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

    resultView.innerHTML = `<h2>Quiz Results</h2>`;
    resultView.innerHTML += `<p>Total Score: ${score}%</p>`;

    let message;
    if (score >= 80) {
        message = `Congratulations ${studentNameInput.value}! You passed the quiz.`;
    } else {
        message = `Sorry ${studentNameInput.value}, you failed the quiz.`;
    }
    resultView.innerHTML += `<p>${message}</p>`;

    // Add buttons to retake quiz or return to main page
    resultView.innerHTML += `
        <button id="retake-quiz-btn" class="btn btn-primary">Retake Quiz</button>
        <button id="return-to-main-btn" class="btn btn-secondary">Return to Main Page</button>
    `;

    // Add event listener to retake quiz button
    document.getElementById("retake-quiz-btn").addEventListener("click", resetQuiz);

    // Add event listener to return to main page button
    document.getElementById("return-to-main-btn").addEventListener("click", function() {
        location.reload(); // Reload the page to return to the main page
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
