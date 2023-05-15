var playground;
var timer;

var emojis = ["chick", "monkey", "octopus", "seal", "t-rex", "whale"];
var N = 8;
var remainingTime = 100;
var playerScore = 0;
var emojiScore = 10;
var userName = "Guest";

var placedEmojis = [];
var selectedEmojis = [];
var blastEmojis = [];
var userScores = [];

var pathToEmojiImg = "resources/emojis/";
var imgExtension = ".png";
var successSoundEffect = new Audio("resources/sounds/success.mp3");
var errorSoundEffect = new Audio("resources/sounds/error.mp3");
var minorErrorSoundEffect = new Audio("resources/sounds/minor_error.mp3");
var backgroundMusic = new Audio("resources/sounds/bg_music.mp3");
var endSoundEffect = new Audio("resources/sounds/end.mp3");

$(document).ready(function () {
  initializeHome();

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.6;
  successSoundEffect.volume = 0.1;
});

function initializeGame() {
  $("#out-game").hide();
  $("#in-game").show();

  playground = $("#playground");
  playground.empty();
  placedEmojis = [];
  selectedEmojis = [];
  blastEmojis = [];

  if ($("#username").val() !== "") {
    userName = $("#username").val();
  }

  for (let i = 0; i < N; i++) {
    let row = [];
    for (let j = 0; j < N; j++) {
      let actualName = randomEmoji();
      let emoji = $(
        '<img src="' +
          pathToEmojiImg +
          actualName +
          imgExtension +
          '" alt="' +
          actualName +
          '" class="emoji" id="' +
          i +
          "-" +
          j +
          '">'
      );
      emoji.click(function (e) {
        $(this).addClass("selected");
        selectedEmojis.push($(this).attr("id"));
        checkForSwap();
      });

      row.push(emoji);
      playground.append(emoji);
    }
    placedEmojis.push(row);
  }

  if (checkForBlast()) {
    doBlast();
  }

  playerScore = 0;
  remainingTime = 100;
  $("#score").text("Score: " + playerScore);
  timeHandler();
  timer = setInterval(timeHandler, 500);
}

function initializeHome() {
  $("#in-game").hide();
  $("#out-game").show();

  if (userName !== "Guest") {
    $("#username").attr("value", userName);
  }

  userScores = [];
  if (localStorage.getItem("userScores")) {
    $("#scoreboard").show();
    $("#scoreboard tr:has(td)").remove();

    userScores = JSON.parse(localStorage.getItem("userScores"));

    userScores.sort((a, b) => b.score - a.score);

    let place = 1;
    for (let score of userScores) {
      $("#scoreboard tr")
        .last()
        .after(
          "<tr><td>" +
            place++ +
            ".</td><td>" +
            score.username +
            "</td><td>" +
            score.score +
            "</td></tr>"
        );
    }
  }
}

function randomEmoji() {
  if (Math.random() < 0.05) {
    return "joker";
  }

  return emojis[Math.floor(Math.random() * emojis.length)];
}

function checkForSwap() {
  if (selectedEmojis.length != 2) {
    return;
  }

  let firstCord = selectedEmojis[0].split("-");
  let secondCord = selectedEmojis[1].split("-");
  let swappable =
    (firstCord[0] === secondCord[0] &&
      Math.abs(firstCord[1] - secondCord[1]) === 1) ||
    (firstCord[1] === secondCord[1] &&
      Math.abs(firstCord[0] - secondCord[0]) === 1);

  if (swappable) {
    swapOnPlayground(firstCord, secondCord);
    if (checkForBlast()) {
      doBlast();
    } else {
      minorErrorEffect();
      setTimeout(function () {
        swapOnPlayground(secondCord, firstCord);
      }, 150);
    }
  } else {
    errorEffect();
  }

  $("#" + selectedEmojis[0]).removeClass("selected");
  $("#" + selectedEmojis[1]).removeClass("selected");
  selectedEmojis = [];
}

function checkForBlast() {
  // Check horizontally -
  for (let i = 0; i < placedEmojis.length; i++) {
    for (let j = 0; j < placedEmojis[0].length - 2; j++) {
      if (
        (placedEmojis[i][j].attr("alt") ===
          placedEmojis[i][j + 1].attr("alt") &&
          placedEmojis[i][j].attr("alt") ===
            placedEmojis[i][j + 2].attr("alt")) ||
        (placedEmojis[i][j].attr("alt") === "joker" &&
          placedEmojis[i][j + 1].attr("alt") ===
            placedEmojis[i][j + 2].attr("alt")) ||
        (placedEmojis[i][j + 1].attr("alt") === "joker" &&
          placedEmojis[i][j].attr("alt") ===
            placedEmojis[i][j + 2].attr("alt")) ||
        (placedEmojis[i][j + 2].attr("alt") === "joker" &&
          placedEmojis[i][j].attr("alt") === placedEmojis[i][j + 1].attr("alt"))
      ) {
        if (emojiNotInBlastArray(i, j)) {
          blastEmojis.push([i, j]);
        }
        if (emojiNotInBlastArray(i, j + 1)) {
          blastEmojis.push([i, j + 1]);
        }
        if (emojiNotInBlastArray(i, j + 2)) {
          blastEmojis.push([i, j + 2]);
        }
      }
    }
  }

  // Check vertically |
  for (let i = 0; i < placedEmojis.length - 2; i++) {
    for (let j = 0; j < placedEmojis[0].length; j++) {
      if (
        (placedEmojis[i][j].attr("alt") ===
          placedEmojis[i + 1][j].attr("alt") &&
          placedEmojis[i][j].attr("alt") ===
            placedEmojis[i + 2][j].attr("alt")) ||
        (placedEmojis[i][j].attr("alt") === "joker" &&
          placedEmojis[i + 1][j].attr("alt") ===
            placedEmojis[i + 2][j].attr("alt")) ||
        (placedEmojis[i + 1][j].attr("alt") === "joker" &&
          placedEmojis[i][j].attr("alt") ===
            placedEmojis[i + 2][j].attr("alt")) ||
        (placedEmojis[i + 2][j].attr("alt") === "joker" &&
          placedEmojis[i][j].attr("alt") === placedEmojis[i + 1][j].attr("alt"))
      ) {
        if (emojiNotInBlastArray(i, j)) {
          blastEmojis.push([i, j]);
        }
        if (emojiNotInBlastArray(i + 1, j)) {
          blastEmojis.push([i + 1, j]);
        }
        if (emojiNotInBlastArray(i + 2, j)) {
          blastEmojis.push([i + 2, j]);
        }
      }
    }
  }

  if (blastEmojis.length === 0) {
    return false;
  }

  return true;
}

function doBlast() {
  for (let cord of blastEmojis) {
    increasePlayerScore();

    changeEmojiAttr(placedEmojis[cord[0]][cord[1]], "blank");
  }
  blastEmojis = [];

  successSoundEffect.currentTime = 0;
  successSoundEffect.play();

  slideDownEmojis();
}

function slideDownEmojis() {
  for (let col = 0; col < placedEmojis[0].length; col++) {
    for (let row = placedEmojis.length - 1; row >= 0; row--) {
      if (placedEmojis[row][col].attr("alt") === "blank") {
        let tempRow = row;
        while (tempRow >= 0) {
          if (placedEmojis[tempRow][col].attr("alt") !== "blank") {
            swapOnPlayground([row, col], [tempRow, col]);
            isSlideNeeded = true;
            break;
          }
          tempRow--;
        }
      }
    }
  }

  fillFirstRow();
}

function fillFirstRow() {
  let isFillNeeded = false;

  for (let col = 0; col < placedEmojis[0].length; col++) {
    if (placedEmojis[0][col].attr("alt") === "blank") {
      changeEmojiAttr(placedEmojis[0][col], randomEmoji());
      isFillNeeded = true;
    }
  }

  if (isFillNeeded) {
    slideDownEmojis();
  } else {
    if (checkForBlast()) {
      doBlast();
    }
  }
}

function emojiNotInBlastArray(x, y) {
  return !blastEmojis.some(
    (innerArr) => innerArr[0] === x && innerArr[1] === y
  );
}

function errorEffect() {
  errorSoundEffect.currentTime = 0;
  errorSoundEffect.play();
  shakePlayground();
}

function minorErrorEffect() {
  minorErrorSoundEffect.currentTime = 0;
  minorErrorSoundEffect.play();
  shakePlayground();
}

function shakePlayground() {
  $("#playground").css("animation-name", "shake");
  setTimeout(function () {
    $("#playground").css("animation-name", "");
  }, 100);
}

function swapOnPlayground(firstCord, secondCord) {
  let firstEmojiAlt = placedEmojis[firstCord[0]][firstCord[1]].attr("alt");
  let secondEmojiAlt = placedEmojis[secondCord[0]][secondCord[1]].attr("alt");

  changeEmojiAttr(placedEmojis[firstCord[0]][firstCord[1]], secondEmojiAlt)
  changeEmojiAttr(placedEmojis[secondCord[0]][secondCord[1]], firstEmojiAlt)
}

function changeEmojiAttr(emoji, alt) {
  emoji.attr("src", pathToEmojiImg + alt + imgExtension);
  emoji.attr("alt", alt);
}

function increasePlayerScore() {
  playerScore += emojiScore;
  $("#score").text("Score: " + playerScore);

  remainingTime += 10;
  if (remainingTime >= 100) {
    remainingTime = 100;
  }

  timeHandler();
}

function timeHandler() {
  remainingTime -= 4;
  if (remainingTime <= 0) {
    gameOver();
  }
  $("#time").css("width", remainingTime + "%");
}

function gameOver() {
  clearInterval(timer);

  endSoundEffect.currentTime = 0;
  endSoundEffect.play();

  let isUserExistInStorage = false;
  for (let i = 0; i < userScores.length; i++) {
    if (userScores[i].username === userName) {
      isUserExistInStorage = true;
      if (userScores[i].score < playerScore) {
        userScores[i].score = playerScore;
      }
      break;
    }
  }
  if (!isUserExistInStorage) {
    userScores.push({ username: userName, score: playerScore });
  }

  localStorage.setItem("userScores", JSON.stringify(userScores));

  initializeHome();
}

function playBackgroundMusic() {
  if ($("#speaker").attr("alt") === "speaker") {
    backgroundMusic.pause();
    $("#speaker").attr("src", "resources/speaker-muted.svg");
    $("#speaker").attr("alt", "speaker-muted");
  } else {
    backgroundMusic.play();
    $("#speaker").attr("src", "resources/speaker.svg");
    $("#speaker").attr("alt", "speaker");
  }
}
