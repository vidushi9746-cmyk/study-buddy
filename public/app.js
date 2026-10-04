// ==========================================
// STUDY BUDDY - APP.JS
// ==========================================


// ==========================================
// BASIC ELEMENTS
// ==========================================

const notesInput =
  document.getElementById("notes");

const questionInput =
  document.getElementById("question") ||
  document.getElementById("questionInput");

const askBtn =
  document.getElementById("askBtn");

const answer =
  document.getElementById("answer");

const answerCard =
  document.getElementById("answerCard");

const answerMode =
  document.getElementById("answerMode");

const status =
  document.getElementById("status");

const sampleBtn =
  document.getElementById("sampleBtn");

const copyBtn =
  document.getElementById("copyBtn");

const speakBtn =
  document.getElementById("speakBtn");

const againBtn =
  document.getElementById("againBtn");


// ==========================================
// STATE
// ==========================================

let notes = "";
let selectedMode = "simple";

let lastQuestion = "";
let lastAnswer = "";


// ==========================================
// MODE BUTTONS
// ==========================================

const modeButtons =
  document.querySelectorAll(".mode, .mode-btn");

modeButtons.forEach((button) => {

  button.addEventListener("click", () => {

    modeButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedMode =
      button.dataset.mode || "simple";

    // Hide quiz when switching modes
    if (selectedMode !== "quiz") {

      const quizCard =
        document.getElementById("quizCard");

      if (quizCard) {
        quizCard.classList.add("hidden");
      }

    }

  });

});


// ==========================================
// SAMPLE NOTES
// ==========================================

if (sampleBtn && notesInput) {

  sampleBtn.addEventListener("click", () => {

    notesInput.value = `Docker containers use Linux kernel features to isolate processes.

Linux namespaces provide process isolation by giving processes different views of system resources.

A process inside a PID namespace can have its own process IDs and process tree.

Docker uses namespaces including PID, network, mount, UTS, IPC, and user namespaces.

For example, a process inside a container can see itself as PID 1 even though it has a different process ID on the host.

Namespaces provide isolation, while cgroups are mainly used to control and limit resources such as CPU and memory.`;

    notes = notesInput.value;

    if (questionInput) {

      questionInput.value =
        "Explain Linux namespaces in Docker in simple terms.";

    }

  });

}


// ==========================================
// ASK BUTTON
// ==========================================

if (askBtn) {

  askBtn.addEventListener(
    "click",
    askStudyBuddy
  );

}


// ==========================================
// ENTER KEY
// ==========================================

if (questionInput) {

  questionInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        askStudyBuddy();

      }

    }
  );

}


// ==========================================
// ASK STUDY BUDDY
// ==========================================

async function askStudyBuddy() {

  if (!questionInput) {
    console.error(
      "Question input was not found."
    );
    return;
  }

  const question =
    questionInput.value.trim();

  if (!question) {

    questionInput.focus();

    return;

  }


  // Get latest notes
  if (notesInput) {
    notes = notesInput.value;
  }


  lastQuestion = question;


  // Hide old results
  if (answerCard) {
    answerCard.classList.add("hidden");
  }

  const quizCard =
    document.getElementById("quizCard");

  if (quizCard) {
    quizCard.classList.add("hidden");
  }


  // Loading state
  if (askBtn) {

    askBtn.disabled = true;
    askBtn.textContent = "Thinking...";

  }

  if (status) {
    status.textContent = "Thinking...";
  }

  if (answer) {
    answer.textContent =
      "Study Buddy is thinking...";
  }


  try {

    const response =
      await fetch("/api/study", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          notes: notes,

          question: question,

          mode: selectedMode

        })

      });


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "Request failed."
      );

    }


    // ======================================
    // QUIZ MODE
    // ======================================

    if (selectedMode === "quiz") {

      let questions;

      try {

        let raw =
          data.answer.trim();


        // Remove markdown fences
        raw = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();


        questions =
          JSON.parse(raw);

      } catch (error) {

        console.error(
          "Quiz parsing error:",
          error
        );

        console.log(
          "AI returned:",
          data.answer
        );

        throw new Error(
          "The quiz could not be formatted. Please try again."
        );

      }


      if (
        !Array.isArray(questions) ||
        questions.length === 0
      ) {

        throw new Error(
          "No quiz questions were generated."
        );

      }


      startQuiz(questions);

      return;

    }


    // ======================================
    // NORMAL ANSWER
    // ======================================

    lastAnswer =
      data.answer ||
      "I couldn't generate an answer.";


    if (answer) {

      answer.innerHTML =
        formatAnswer(lastAnswer);

    }


    if (answerMode) {

      answerMode.textContent =
        getModeLabel(selectedMode);

    }


    if (status) {
      status.textContent = "Ready";
    }


    if (answerCard) {

      answerCard.classList.remove(
        "hidden"
      );

      answerCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

    }

  } catch (error) {

    console.error(
      "Study Buddy error:",
      error
    );


    if (answer) {

      answer.textContent =
        error.message ||
        "Something went wrong.";

    }


    if (answerMode) {
      answerMode.textContent = "Error";
    }


    if (status) {
      status.textContent = "Error";
    }


    if (answerCard) {
      answerCard.classList.remove(
        "hidden"
      );
    }

  } finally {

    if (askBtn) {

      askBtn.disabled = false;

      askBtn.innerHTML =
        'Ask Study Buddy <span>→</span>';

    }

  }

}


// ==========================================
// ANSWER FORMATTING
// ==========================================

function formatAnswer(text) {

  if (!text) {
    return "";
  }


  let result =
    escapeHtml(text);


  // Bold
  result =
    result.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  // Inline code
  result =
    result.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );


  // Headings
  result =
    result.replace(
      /^### (.*)$/gm,
      "<h4>$1</h4>"
    );


  result =
    result.replace(
      /^## (.*)$/gm,
      "<h3>$1</h3>"
    );


  // Bullet points
  result =
    result.replace(
      /^\s*[-•]\s+(.*)$/gm,
      "<li>$1</li>"
    );


  // Numbered points
  result =
    result.replace(
      /^\s*\d+\.\s+(.*)$/gm,
      "<li>$1</li>"
    );


  // Line breaks
  result =
    result.replace(
      /\n{2,}/g,
      "<br><br>"
    );

  result =
    result.replace(
      /\n/g,
      "<br>"
    );


  return result;

}


// ==========================================
// MODE LABEL
// ==========================================

function getModeLabel(mode) {

  const labels = {

    simple:
      "Simple explanation",

    analogy:
      "Real-world analogy",

    exam:
      "Exam-ready answer",

    quiz:
      "Quiz mode"

  };

  return (
    labels[mode] ||
    "Simple explanation"
  );

}


// ==========================================
// COPY ANSWER
// ==========================================

if (copyBtn) {

  copyBtn.addEventListener(
    "click",
    async () => {

      if (!lastAnswer) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          lastAnswer
        );

        const old =
          copyBtn.textContent;

        copyBtn.textContent = "✓";

        setTimeout(() => {

          copyBtn.textContent = old;

        }, 1200);

      } catch (error) {

        console.error(
          "Copy failed:",
          error
        );

      }

    }
  );

}


// ==========================================
// READ ANSWER ALOUD
// ==========================================

if (speakBtn) {

  speakBtn.addEventListener(
    "click",
    () => {

      if (!lastAnswer) {
        return;
      }


      if (
        !("speechSynthesis" in window)
      ) {

        alert(
          "Your browser does not support text-to-speech."
        );

        return;

      }


      speechSynthesis.cancel();


      const speech =
        new SpeechSynthesisUtterance(
          lastAnswer
        );


      speech.rate = 0.95;
      speech.pitch = 1;


      speechSynthesis.speak(
        speech
      );

    }
  );

}


// ==========================================
// EXPLAIN DIFFERENTLY
// ==========================================

if (againBtn) {

  againBtn.addEventListener(
    "click",
    () => {

      if (!lastQuestion) {
        return;
      }


      selectedMode = "analogy";


      modeButtons.forEach(
        (button) => {

          button.classList.toggle(
            "active",
            button.dataset.mode ===
              "analogy"
          );

        }
      );


      askStudyBuddy();

    }
  );

}


// ==========================================
// PDF ELEMENTS
// ==========================================

const dropZone =
  document.getElementById("dropZone");

const pdfInput =
  document.getElementById("pdfInput");

const choosePdf =
  document.getElementById("choosePdf");

const fileStatus =
  document.getElementById("fileStatus");

const fileName =
  document.getElementById("fileName");

const filePages =
  document.getElementById("filePages");

const removePdf =
  document.getElementById("removePdf");


// ==========================================
// CHOOSE PDF BUTTON
// ==========================================

if (choosePdf && pdfInput) {

  choosePdf.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      pdfInput.click();

    }
  );

}


// ==========================================
// CLICK DROP ZONE
// ==========================================

if (dropZone && pdfInput) {

  dropZone.addEventListener(
    "click",
    (event) => {

      // Don't trigger twice when
      // clicking the "choose a file" button
      if (
        event.target === choosePdf ||
        choosePdf?.contains(event.target)
      ) {
        return;
      }


      pdfInput.click();

    }
  );

}


// ==========================================
// NORMAL FILE SELECTION
// ==========================================

if (pdfInput) {

  pdfInput.addEventListener(
    "change",
    () => {

      const file =
        pdfInput.files[0];

      if (file) {

        uploadPdf(file);

      }

    }
  );

}


// ==========================================
// DRAG ENTER
// ==========================================

if (dropZone) {

  dropZone.addEventListener(
    "dragenter",
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      dropZone.classList.add(
        "dragging"
      );

    }
  );

}


// ==========================================
// DRAG OVER
// ==========================================

if (dropZone) {

  dropZone.addEventListener(
    "dragover",
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      dropZone.classList.add(
        "dragging"
      );

      if (event.dataTransfer) {

        event.dataTransfer.dropEffect =
          "copy";

      }

    }
  );

}


// ==========================================
// DRAG LEAVE
// ==========================================

if (dropZone) {

  dropZone.addEventListener(
    "dragleave",
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      dropZone.classList.remove(
        "dragging"
      );

    }
  );

}


// ==========================================
// DROP PDF
// ==========================================

if (dropZone) {

  dropZone.addEventListener(
    "drop",
    (event) => {

      event.preventDefault();
      event.stopPropagation();


      dropZone.classList.remove(
        "dragging"
      );


      console.log(
        "DROP DETECTED"
      );


      const files =
        event.dataTransfer.files;


      if (
        !files ||
        files.length === 0
      ) {

        console.log(
          "No file detected."
        );

        return;

      }


      const file =
        files[0];


      console.log(
        "Dropped file:",
        file.name
      );


      uploadPdf(file);

    }
  );

}


// ==========================================
// PREVENT BROWSER OPENING PDF
// ==========================================

document.addEventListener(
  "dragover",
  (event) => {

    event.preventDefault();

  }
);


document.addEventListener(
  "drop",
  (event) => {

    if (
      dropZone &&
      !dropZone.contains(
        event.target
      )
    ) {

      event.preventDefault();

    }

  }
);


// ==========================================
// UPLOAD PDF
// ==========================================

async function uploadPdf(file) {

  console.log(
    "Uploading PDF:",
    file.name
  );


  // Check type
  if (
    file.type !== "application/pdf" &&
    !file.name
      .toLowerCase()
      .endsWith(".pdf")
  ) {

    alert(
      "Please upload a PDF file."
    );

    return;

  }


  // Check size
  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "PDF must be smaller than 10 MB."
    );

    return;

  }


  // Show file status
  if (fileName) {

    fileName.textContent =
      file.name;

  }


  if (filePages) {

    filePages.textContent =
      "Reading PDF...";

  }


  if (fileStatus) {

    fileStatus.classList.remove(
      "hidden"
    );

  }


  const formData =
    new FormData();


  formData.append(
    "pdf",
    file
  );


  try {

    const response =
      await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "PDF upload failed."
      );

    }


    console.log(
      "PDF uploaded successfully:",
      data
    );


    // Save extracted PDF text
    notes =
      data.text || "";


    // Also put it into the
    // textarea if one exists
    if (notesInput) {

      notesInput.value =
        notes;

    }


    // Update file status
    if (fileName) {

      fileName.textContent =
        data.filename ||
        file.name;

    }


    if (filePages) {

      const pages =
        data.pages || 0;

      filePages.textContent =
        `${pages} page${pages === 1 ? "" : "s"} • Ready`;

    }


    // Add default question
    if (
      questionInput &&
      !questionInput.value.trim()
    ) {

      questionInput.value =
        "Explain the main concepts in these notes.";

    }


  } catch (error) {

    console.error(
      "PDF upload error:",
      error
    );


    if (fileStatus) {

      fileStatus.classList.add(
        "hidden"
      );

    }


    alert(
      error.message ||
      "Could not read this PDF."
    );

  }

}


// ==========================================
// REMOVE PDF
// ==========================================

if (removePdf) {

  removePdf.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();


      if (pdfInput) {
        pdfInput.value = "";
      }


      notes = "";


      if (notesInput) {
        notesInput.value = "";
      }


      if (fileName) {
        fileName.textContent = "";
      }


      if (filePages) {
        filePages.textContent = "";
      }


      if (fileStatus) {

        fileStatus.classList.add(
          "hidden"
        );

      }

    }
  );

}


// ==========================================
// QUIZ
// ==========================================

const quizCard =
  document.getElementById("quizCard");

const quizProgress =
  document.getElementById(
    "quizProgress"
  );

const quizProgressBar =
  document.getElementById(
    "quizProgressBar"
  );

const quizQuestion =
  document.getElementById(
    "quizQuestion"
  );

const quizOptions =
  document.getElementById(
    "quizOptions"
  );

const quizFeedback =
  document.getElementById(
    "quizFeedback"
  );

const feedbackTitle =
  document.getElementById(
    "feedbackTitle"
  );

const feedbackText =
  document.getElementById(
    "feedbackText"
  );

const nextQuestion =
  document.getElementById(
    "nextQuestion"
  );


let quizQuestions = [];
let currentQuestion = 0;
let quizScore = 0;


// ==========================================
// START QUIZ
// ==========================================

function startQuiz(questions) {

  quizQuestions =
    questions;

  currentQuestion = 0;

  quizScore = 0;


  if (answerCard) {

    answerCard.classList.add(
      "hidden"
    );

  }


  if (quizCard) {

    quizCard.classList.remove(
      "hidden"
    );

  }


  showQuestion();

}


// ==========================================
// SHOW QUESTION
// ==========================================

function showQuestion() {

  if (
    !quizQuestions.length ||
    !quizQuestion ||
    !quizOptions
  ) {

    return;

  }


  const q =
    quizQuestions[
      currentQuestion
    ];


  if (quizProgress) {

    quizProgress.textContent =
      `${currentQuestion + 1} / ${quizQuestions.length}`;

  }


  if (quizProgressBar) {

    quizProgressBar.style.width =
      `${
        ((currentQuestion + 1) /
          quizQuestions.length) *
        100
      }%`;

  }


  quizQuestion.textContent =
    q.question;


  quizOptions.innerHTML = "";


  if (quizFeedback) {

    quizFeedback.classList.add(
      "hidden"
    );

  }


  if (nextQuestion) {

    nextQuestion.classList.add(
      "hidden"
    );

  }


  const letters =
    ["A", "B", "C", "D"];


  q.options.forEach(
    (option, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "quiz-option";


      button.type = "button";


      button.innerHTML = `
        <span class="option-letter">
          ${letters[index]}
        </span>
        <span>
          ${escapeHtml(option)}
        </span>
      `;


      button.addEventListener(
        "click",
        () => {

          selectAnswer(index);

        }
      );


      quizOptions.appendChild(
        button
      );

    }
  );

}


// ==========================================
// SELECT QUIZ ANSWER
// ==========================================

function selectAnswer(selected) {

  const q =
    quizQuestions[
      currentQuestion
    ];


  const buttons =
    document.querySelectorAll(
      ".quiz-option"
    );


  buttons.forEach(
    (button) => {

      button.classList.add(
        "disabled"
      );

    }
  );


  buttons.forEach(
    (button, index) => {

      if (
        index === q.answer
      ) {

        button.classList.add(
          "correct"
        );

      }


      if (
        index === selected &&
        selected !== q.answer
      ) {

        button.classList.add(
          "wrong"
        );

      }

    }
  );


  if (
    selected === q.answer
  ) {

    quizScore++;


    if (feedbackTitle) {

      feedbackTitle.textContent =
        "✓ Correct!";

      feedbackTitle.style.color =
        "#24733c";

    }

  } else {

    if (feedbackTitle) {

      feedbackTitle.textContent =
        "Not quite!";

      feedbackTitle.style.color =
        "#a33b3b";

    }

  }


  if (feedbackText) {

    feedbackText.textContent =
      q.explanation ||
      "Review this concept in your notes.";

  }


  if (quizFeedback) {

    quizFeedback.classList.remove(
      "hidden"
    );

  }


  if (nextQuestion) {

    nextQuestion.textContent =
      currentQuestion <
      quizQuestions.length - 1
        ? "Next Question →"
        : "See My Score →";


    nextQuestion.classList.remove(
      "hidden"
    );

  }

}


// ==========================================
// NEXT QUESTION
// ==========================================

if (nextQuestion) {

  nextQuestion.addEventListener(
    "click",
    () => {

      if (
        currentQuestion <
        quizQuestions.length - 1
      ) {

        currentQuestion++;

        showQuestion();

      } else {

        showQuizResult();

      }

    }
  );

}


// ==========================================
// QUIZ RESULT
// ==========================================

function showQuizResult() {

  const total =
    quizQuestions.length;


  if (!total) {
    return;
  }


  const percentage =
    Math.round(
      (quizScore / total) * 100
    );


  let message;


  if (percentage === 100) {

    message =
      "Perfect! You really know this topic.";

  } else if (percentage >= 80) {

    message =
      "Great job! Your understanding looks strong.";

  } else if (percentage >= 60) {

    message =
      "Good start. A little more revision should help.";

  } else {

    message =
      "Worth another review. Try explaining the topic again.";

  }


  if (quizProgress) {

    quizProgress.textContent =
      "Complete";

  }


  if (quizProgressBar) {

    quizProgressBar.style.width =
      "100%";

  }


  if (quizQuestion) {

    quizQuestion.innerHTML = `
      <div style="
        font-size:32px;
        margin-bottom:8px;
      ">
        ${quizScore}/${total}
      </div>

      <div>
        ${percentage}% correct
      </div>
    `;

  }


  if (quizOptions) {

    quizOptions.innerHTML = `
      <div style="
        padding:18px;
        border-radius:12px;
        background:#fafafd;
        text-align:center;
        color:#68717c;
        font-size:13px;
      ">
        ${message}
      </div>
    `;

  }


  if (quizFeedback) {

    quizFeedback.classList.add(
      "hidden"
    );

  }


  if (nextQuestion) {

    nextQuestion.textContent =
      "↻ Try Again";

    nextQuestion.classList.remove(
      "hidden"
    );


    nextQuestion.onclick = () => {

      currentQuestion = 0;

      quizScore = 0;

      nextQuestion.onclick = null;

      showQuestion();

    };

  }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;

}