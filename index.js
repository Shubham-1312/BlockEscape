const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d'); //returns  drawing context - which is an object that has all the drawing properties and functions you use to draw on the canvas. 

const card = document.getElementById("card");
const cardScore = document.getElementById("card-score");

//SFX
let scoreSFX = new Audio("./audio/classiccoin.mp3")
let gameOverSFX = new Audio('./audio/smb_gameover.mp3');
let jumpSFX = new Audio('./audio/jump.mp3');

//used for 'setInterval'
let presetTime = 1000; //wait for new obstacle to be instantiated
//obstacle will speed up when player score points at interval of 10
let enemySpeed = 5;
let score = 0;
//used to see if user has scored another 10points or not
let scoreIncrement = 0;
let canScore = true;

function startGame() {
    player = new Player(150, 400, 50, "black");
    arrayBlocks = [];
    score = 0;
    scoreIncrement = 0;
    enemySpeed = 5;
    canScore = true;
    presetTime = 1000;
}

function restartGame(button) {
    card.style.display = "none";
    button.blur(); //deselect the button
    startGame();
    requestAnimationFrame(animate);
}

function drawBackgrounfLine() {
    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.lineTo(650, 450);
    ctx.lineWidth = 1.9;
    ctx.strokeStyle = "black";
    ctx.stroke();
}

function drawScore() {
    ctx.font = "80px Arial";
    ctx.fillStyle = "Black";
    let scoreString = score.toString();
    let xOffset = ((scoreString.length - 1) * 20);
    ctx.fillText(scoreString, 300 - xOffset, 100);
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNumberInterval(timeInterval) {
    let returnTime = timeInterval;
    //50 50  chance of return high length of time  within set boundary or lower length of time
    if (Math.random() < 0.5) {
        returnTime += getRandomNumber(presetTime / 3, presetTime * 1.5);
    } else {
        returnTime -= getRandomNumber(presetTime / 5, presetTime / 2);
    }
    return returnTime;
}

class Player {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.jumpHeight = 12; //y velocity
        //thse 3 are used for jump configuration
        this.shouldJump = false;
        this.jumpCounter = 0; //allows us to stop animation after 32 frames
        //spin animation related
        this.spin = 0;
        //get perfect 90 degree rotation
        this.spinIncrement = 90 / 32;
    }

    rotation() {
        //take center point of square 
        let offsetXPosition = this.x + (this.size / 2);
        let offsetYPosition = this.y + (this.size / 2);
        //move canvas origin to that point and cube will rotate in relation to its center
        ctx.translate(offsetXPosition, offsetYPosition);

        ctx.rotate(this.spin * Math.PI / 180); //by default canvas rotate in relation to its top left corner
        ctx.rotate(this.spinIncrement * Math.PI / 180) //convert degree to radians
        //move the canvas back to its original position 
        ctx.translate(-offsetXPosition, -offsetYPosition);
        this.spin += this.spinIncrement;

    }

    counterRotation() {
        //rotate cube back to its origin so it can be moved upwars properly  
        let offsetXPosition = this.x + (this.size / 2);
        let offsetYPosition = this.y + (this.size / 2);
        ctx.translate(offsetXPosition, offsetYPosition);
        ctx.rotate(-this.spin * Math.PI / 180);
        ctx.translate(-offsetXPosition, -offsetYPosition);

    }

    jump() {
        if (this.shouldJump) {
            this.jumpCounter++;
            if (this.jumpCounter < 15) {
                //go up
                this.y -= this.jumpHeight;
            } else if (this.jumpCounter > 14 && this.jumpCounter < 19)
                this.y += 0;
            else if (this.jumpCounter < 33)
                this.y += this.jumpHeight;
            this.rotation();
            //end the cycle
            if (this.jumpCounter >= 32) {
                this.counterRotation();
                this.spin = 0;
                this.shouldJump = false;
            }
        }
    }

    draw() {
        this.jump();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        if (this.shouldJump) this.counterRotation();
    }
}

let player = new Player(150, 400, 50, "black");

class AvoidBlock {
    constructor(size, speed) {
        this.x = canvas.width + size;
        this.y = 450 - size;
        this.size = size;
        this.color = "red";
        this.slideSpeed = speed;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    slide() {
        this.draw();
        this.x -= this.slideSpeed;
    }
}

let arrayBlocks = [];

function generateBlocks() {
    let timeDelay = randomNumberInterval(presetTime);
    arrayBlocks.push(new AvoidBlock(50, enemySpeed));

    setTimeout(generateBlocks, timeDelay);
}

//returns true if colliding
function squaresColliding(player, block) {
    //get data of objects so as not to change origional object data
    let s1 = Object.assign(Object.create(Object.getPrototypeOf(player)), player);
    let s2 = Object.assign(Object.create(Object.getPrototypeOf(block)), block);
    //dont need pixel perfect collision detection
    s2.size = s2.size - 10;
    s2.x = s2.x + 10;
    s2.y = s2.y + 10;
    return !(
        s1.x > s2.x + s2.size ||
        s1.x + s1.size < s2.x ||
        s1.y > s2.y + s2.size ||
        s1.y + s1.size < s2.y
    )
}

//return true if player is past the block
function isPastBlock(player, block) {
    return (
        player.x + (player.size / 2) > block.x + (block.size / 4) &&
        //return true if center of square is greater than first quater of width of obstacle
        // and less than last quater of obstacle
        player.x + (player.size / 2) < block.x + (block.size / 4) * 3
    )
}

function shouldIncreaseSpeed() {
    //check to see if game speed should be increased
    if (scoreIncrement + 10 === score) {
        scoreIncrement = score;
        enemySpeed++;
        //decreasing avg time of obstacle creation
        presetTime >= 100 ? presetTime -= 100 : presetTime = presetTime / 2;
        //update speed of existing blocks
        arrayBlocks.forEach(block => {
            block.slideSpeed = enemySpeed;
        })
    }
}

let animationId = null;

function animate() {
    animationId = requestAnimationFrame(animate); //get invoked repeatedly on each new canvas frame
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clears content of previous canvas frame

    //canvas logic
    drawBackgrounfLine();
    drawScore();
    player.draw();

    shouldIncreaseSpeed(); // increases speed if needed

    arrayBlocks.forEach((arrayBlock, index) => {
        arrayBlock.slide();
        //end game as player and enemy collided
        if (squaresColliding(player, arrayBlock)) {
            gameOverSFX.play();
            cardScore.textContent = score;
            card.style.display = "block"
            cancelAnimationFrame(animationId);
        }
        //user score a point
        if (isPastBlock(player, arrayBlock) && canScore) {
            canScore = false;
            scoreSFX.currentTime = 0;
            scoreSFX.play();
            score++;
        }

        //delete block that has left screen
        if ((arrayBlock.x + arrayBlock.size) <= 0) {
            setTimeout(() => {
                arrayBlocks.splice(index, 1);
            }, 0);
        }
    })
}
//jumping lasts for 32 frames >> 1st 14 jumping above+ 4 in air + 14
animate();
setTimeout(() => {
    generateBlocks();
}, randomNumberInterval(presetTime));


//event listeners
addEventListener("keydown", e => {
    if (e.code === "Space") {
        if (!player.shouldJump) {
            jumpSFX.play();
            player.jumpCounter = 0;
            player.shouldJump = true;
            canScore = true;
        }
    }
})