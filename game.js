const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const instructionsDiv = document.getElementById('instructions');
const toysCountEl = document.getElementById('toys-count');
const timerEl = document.getElementById('time');

// Game states
const GAME_STATE = {
    MENU: 'menu',
    WORKSHOP: 'workshop',
    SLEIGH: 'sleigh',
    GAME_OVER: 'gameover'
};

let gameState = GAME_STATE.MENU;
let toysRequired = 5;
let toysMade = 0;
let workshopTimer = 180; // 3 minutes
let sleighScore = 0;
let lastTime = 0;
let sleighDistance = 0;
let completedToys = []; // Store emojis of completed toys

// Workshop game variables
let toyParts = [];
let currentToy = null;
let toyBin = { x: 650, y: 450, width: 120, height: 120 };
let selectedPart = null;
let offsetX = 0;
let offsetY = 0;
let partGroups = []; // Groups of connected parts

// Sleigh game variables
let sleigh = { x: 100, y: 200, speed: 3, width: 100, height: 60 };
let houses = [];
let presents = [];
let houseSpeed = 2;
let currentToyIndex = 0; // Which toy from completedToys we're delivering
let wishList = []; // Kids and their wishes
let confetti = []; // Confetti particles

// Initialize
showMenu();

function showMenu() {
    gameState = GAME_STATE.MENU;
    instructionsDiv.innerHTML = `
        <h2>🎄 Santa's Workshop 🎄</h2>
        <p><strong>Part 1: Toy Assembly</strong></p>
        <p>Drag puzzle pieces together to build toys!</p>
        <p>Once assembled, drag the toy to the bin.</p>
        <p>Make ${toysRequired} toys within 3 minutes.</p>
        <br>
        <p><strong>Part 2: Present Delivery</strong></p>
        <p>Match toys to kids' wish lists!</p>
        <p>Drop the right toy in the right chimney!</p>
        <button onclick="startWorkshop()">Start Game!</button>
        <button onclick="startSleighRide()">Skip to Part 2 (Debug)</button>
    `;
    instructionsDiv.style.display = 'block';
}

function startWorkshop() {
    gameState = GAME_STATE.WORKSHOP;
    toysMade = 0;
    workshopTimer = 180; // 3 minutes
    toyParts = [];
    currentToy = null;
    completedToys = [];
    instructionsDiv.style.display = 'none';
    toysCountEl.textContent = toysMade;
    timerEl.textContent = workshopTimer;
    
    // Spawn first toy to assemble
    spawnNewToy();
    lastTime = performance.now();
    gameLoop(lastTime);
}

function startSleighRide() {
    gameState = GAME_STATE.SLEIGH;
    sleighScore = 0;
    sleighDistance = 0;
    sleigh.x = 100;
    sleigh.y = 200;
    houses = [];
    presents = [];
    currentToyIndex = 0;
    confetti = [];
    
    // Generate kids and wish list
    const kidNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava'];
    wishList = [];
    
    // If no toys were made (debug mode), use random toys
    if (completedToys.length === 0) {
        const toyTypes = ['🧸', '🚂', '⚽', '🎮', '🤖'];
        completedToys = toyTypes.slice(0, 5);
    }
    
    // Shuffle the toys for delivery order
    const shuffledToys = [...completedToys].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 5; i++) {
        wishList.push({
            name: kidNames[i],
            toy: shuffledToys[i]
        });
    }
    
    instructionsDiv.innerHTML = `
        <h2>🎅 Present Delivery Time! 🎅</h2>
        <p><strong>Wish List:</strong></p>
        ${wishList.map(kid => `<p>${kid.name}: ${kid.toy}</p>`).join('')}
        <p>Match each toy to the right kid's house!</p>
        <p>Arrow Keys to fly, SPACE to drop!</p>
        <button onclick="beginSleighGame()">Let's Go!</button>
    `;
    instructionsDiv.style.display = 'block';
}

function beginSleighGame() {
    instructionsDiv.style.display = 'none';
    toysCountEl.textContent = `Delivering: ${completedToys[currentToyIndex]}`;
    timerEl.textContent = `Score: ${sleighScore}/5`;
    
    // Spawn initial houses with kid names
    for (let i = 0; i < wishList.length; i++) {
        houses.push({
            x: 500 + (i * 300),
            y: canvas.height - 150,
            width: 100,
            height: 100,
            chimneyX: 20,
            chimneyWidth: 20,
            chimneyHeight: 30,
            hasPresent: false,
            kidName: wishList[i].name,
            wantsToy: wishList[i].toy,
            status: null // null, 'correct', 'wrong'
        });
    }
    
    lastTime = performance.now();
    gameLoop(lastTime);
}

function spawnNewToy() {
    const toyTypes = [
        { name: 'Teddy Bear', emoji: '🧸', size: 150 },
        { name: 'Train', emoji: '🚂', size: 150 },
        { name: 'Soccer Ball', emoji: '⚽', size: 150 },
        { name: 'Game Controller', emoji: '🎮', size: 150 },
        { name: 'Robot', emoji: '🤖', size: 150 },
        { name: 'Race Car', emoji: '🏎️', size: 150 },
        { name: 'Rocket', emoji: '🚀', size: 150 },
        { name: 'Gift', emoji: '🎁', size: 150 }
    ];
    
    const toy = toyTypes[Math.floor(Math.random() * toyTypes.length)];
    const pieceSize = toy.size / 3; // Each piece is 1/3 of the emoji size (3x3 grid)
    
    currentToy = {
        name: toy.name,
        emoji: toy.emoji,
        fullSize: toy.size,
        pieceSize: pieceSize,
        partsNeeded: 9
    };
    
    toyParts = [];
    partGroups = [];
    
    // Create 9 pieces (3x3 grid) scattered around workshop
    const positions = [];
    // Generate random positions for each piece
    for (let i = 0; i < 9; i++) {
        positions.push({
            x: 50 + Math.random() * 600,
            y: 80 + Math.random() * 150
        });
    }
    
    // Create 3x3 grid of pieces
    const pieces = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            pieces.push({
                name: `piece-${row}-${col}`,
                clipX: col / 3,
                clipY: row / 3,
                gridRow: row,
                gridCol: col
            });
        }
    }
    
    pieces.forEach((pieceDef, index) => {
        const part = {
            id: Date.now() + index,
            x: positions[index].x,
            y: positions[index].y,
            width: pieceSize,
            height: pieceSize,
            partName: pieceDef.name,
            quadrant: pieceDef, // Keep same property name for compatibility
            partIndex: index,
            connectedParts: [],
            relativeOffsets: {}
        };
        toyParts.push(part);
        partGroups.push([part.id]);
    });
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
        .toString(16).slice(1);
}

function spawnConfetti(x, y) {
    for (let i = 0; i < 30; i++) {
        confetti.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -5 - 2,
            color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
            life: 60
        });
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === GAME_STATE.WORKSHOP) {
        updateWorkshop(deltaTime);
        drawWorkshop();
    } else if (gameState === GAME_STATE.SLEIGH) {
        updateSleigh(deltaTime);
        drawSleigh();
    }
    
    if (gameState !== GAME_STATE.MENU && gameState !== GAME_STATE.GAME_OVER) {
        requestAnimationFrame(gameLoop);
    }
}

function updateWorkshop(deltaTime) {
    // Update timer
    workshopTimer -= deltaTime;
    timerEl.textContent = Math.max(0, Math.ceil(workshopTimer));
    
    if (workshopTimer <= 0) {
        gameOver(false, "Time's up! Not enough toys made!");
        return;
    }
    
    // Check if all parts are connected (only one group left)
    if (partGroups.length === 1 && partGroups[0].length === currentToy.partsNeeded) {
        if (!currentToy.assembled) {
            currentToy.assembled = true;
            // Find the top-left piece to center the completed toy
            const topLeftPart = toyParts.find(p => p.quadrant.gridRow === 0 && p.quadrant.gridCol === 0);
            if (topLeftPart) {
                currentToy.completedX = topLeftPart.x;
                currentToy.completedY = topLeftPart.y;
            }
        }
    }
}

function drawWorkshop() {
    // Background - workshop
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Floor
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
    
    // Workbench
    ctx.fillStyle = '#deb887';
    ctx.fillRect(50, canvas.height - 200, 500, 30);
    
    // Toy bin
    ctx.fillStyle = '#228b22';
    ctx.fillRect(toyBin.x, toyBin.y, toyBin.width, toyBin.height);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(toyBin.x, toyBin.y, toyBin.width, toyBin.height);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOY BIN', toyBin.x + toyBin.width / 2, toyBin.y - 10);
    
    // Current toy name and instructions
    if (currentToy) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Building: ' + currentToy.name, 20, 30);
        ctx.font = '16px Arial';
        ctx.fillText('Drag puzzle pieces together to assemble!', 20, 55);
        
        // Show progress
        const totalParts = currentToy.partsNeeded;
        const totalConnected = toyParts.reduce((sum, part) => sum + part.connectedParts.length, 0) / 2;
        ctx.fillText(`Groups: ${partGroups.length} | Connections: ${totalConnected}`, 20, 78);
        
        if (currentToy.assembled) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('✓ Complete! Drop in bin! →', 20, 105);
        }
    }
    
    // If toy is assembled, draw the complete emoji instead of pieces
    if (currentToy && currentToy.assembled && currentToy.completedX !== undefined) {
        // Draw complete emoji without clipping
        ctx.save();
        const fontSize = currentToy.fullSize * 1.4; // Make it slightly larger
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Add a subtle glow effect
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillText(currentToy.emoji, currentToy.completedX, currentToy.completedY);
        ctx.shadowBlur = 0;
        
        // Draw a success border around it
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(
            currentToy.completedX - 5,
            currentToy.completedY - 5,
            currentToy.fullSize + 10,
            currentToy.fullSize + 10
        );
        ctx.restore();
    } else {
        // Draw toy parts as masked emoji pieces
        toyParts.forEach(part => {
            ctx.save();
            
            // Create clipping region for this piece
            ctx.beginPath();
            ctx.rect(part.x, part.y, part.width, part.height);
            ctx.clip();
            
            // Calculate the "anchor" position - this is where the top-left of the full emoji should be
            const pieceSize = currentToy.pieceSize;
            const anchorX = part.x - (part.quadrant.clipX * currentToy.fullSize);
            const anchorY = part.y - (part.quadrant.clipY * currentToy.fullSize);
            
            // Draw the full emoji starting at the anchor
            const fontSize = currentToy.fullSize * 1.4;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(currentToy.emoji, anchorX, anchorY);
            
            ctx.restore();
            
            // Border around piece - thicker if connected
            if (part.connectedParts.length > 0) {
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 2;
            }
            ctx.strokeRect(part.x, part.y, part.width, part.height);
            
            // Connection indicator
            if (part.connectedParts.length > 0) {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
                ctx.fillRect(part.x + 2, part.y + 2, 14, 14);
                ctx.fillStyle = '#4caf50';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('✓', part.x + 3, part.y + 2);
            }
        });
    }
}

function updateSleigh(deltaTime) {
    // Move houses (cycle them)
    houses.forEach(house => {
        house.x -= houseSpeed;
        
        // If house goes off screen on the left, move it to the right
        if (house.x < -200) {
            // Find the rightmost house
            let maxX = -1000;
            houses.forEach(h => {
                if (h.x > maxX) maxX = h.x;
            });
            house.x = maxX + 300;
        }
    });
    
    // Update presents
    presents.forEach(present => {
        present.y += 4;
        present.x -= houseSpeed;
        
        // Check collision with chimneys
        houses.forEach(house => {
            const chimneyX = house.x + house.chimneyX;
            const chimneyY = house.y - house.chimneyHeight;
            
            if (!house.hasPresent &&
                present.x > chimneyX && 
                present.x < chimneyX + house.chimneyWidth &&
                present.y > chimneyY && 
                present.y < house.y) {
                house.hasPresent = true;
                present.hit = true;
                
                // Check if correct toy
                if (present.toy === house.wantsToy) {
                    house.status = 'correct';
                    sleighScore++;
                    spawnConfetti(house.x + house.width / 2, house.y);
                    toysCountEl.textContent = `Delivering: ${currentToyIndex < completedToys.length - 1 ? completedToys[currentToyIndex + 1] : '✓ Done!'}`;
                    timerEl.textContent = `Score: ${sleighScore}/5`;
                    
                    // Move to next toy
                    currentToyIndex++;
                    
                    if (sleighScore >= 5) {
                        setTimeout(() => {
                            gameOver(true, "Perfect delivery! All kids are happy! 🎄");
                        }, 1000);
                    }
                } else {
                    // Wrong toy - mark as wrong but can try again
                    house.status = 'wrong';
                    // Reset after a moment so they can try again
                    setTimeout(() => {
                        if (house.status === 'wrong') {
                            house.hasPresent = false;
                            house.status = null;
                        }
                    }, 2000);
                }
            }
        });
    });
    
    presents = presents.filter(p => !p.hit && p.y < canvas.height);
    
    // Update confetti
    confetti.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.2; // gravity
        c.life--;
    });
    confetti = confetti.filter(c => c.life > 0);
}

function drawSleigh() {
    // Sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001f3f');
    gradient.addColorStop(1, '#1a5490');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect((i * 137) % canvas.width, (i * 97) % 300, 2, 2);
    }
    
    // Ground
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Debug - draw a test rectangle to see if drawing works
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(100, 100, 50, 50);
    
    // Houses
    console.log('Drawing houses:', houses.length, houses[0]);
    houses.forEach(house => {
        // House body
        ctx.fillStyle = '#c62828';
        ctx.fillRect(house.x, house.y, house.width, house.height);
        
        // Roof
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.moveTo(house.x - 10, house.y);
        ctx.lineTo(house.x + house.width / 2, house.y - 40);
        ctx.lineTo(house.x + house.width + 10, house.y);
        ctx.closePath();
        ctx.fill();
        
        // Chimney
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(
            house.x + house.chimneyX, 
            house.y - house.chimneyHeight, 
            house.chimneyWidth, 
            house.chimneyHeight
        );
        
        // Window
        ctx.fillStyle = '#fff59d';
        ctx.fillRect(house.x + 35, house.y + 40, 30, 30);
        
        // Kid name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(house.kidName, house.x + house.width / 2, house.y - 50);
        
        // Wish
        ctx.font = '20px Arial';
        ctx.fillText(house.wantsToy, house.x + house.width / 2, house.y - 30);
        
        // Status indicator
        if (house.status === 'correct') {
            ctx.fillStyle = '#4caf50';
            ctx.font = '30px Arial';
            ctx.fillText('✓', house.x + house.chimneyX + 5, house.y - house.chimneyHeight - 10);
            
            // Dim the house if already delivered
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(house.x, house.y - house.chimneyHeight, house.width, house.height + house.chimneyHeight);
        } else if (house.status === 'wrong') {
            ctx.font = '30px Arial';
            ctx.fillText('💩', house.x + house.chimneyX, house.y - house.chimneyHeight - 10);
        }
    });
    
    // Sleigh
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(sleigh.x, sleigh.y + 20, sleigh.width, 20);
    ctx.beginPath();
    ctx.arc(sleigh.x, sleigh.y + 40, 10, 0, Math.PI * 2);
    ctx.arc(sleigh.x + sleigh.width, sleigh.y + 40, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(sleigh.x + 30, sleigh.y, 40, 30);
    ctx.fillStyle = '#ffcdd2';
    ctx.beginPath();
    ctx.arc(sleigh.x + 50, sleigh.y + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Presents being dropped (show emoji)
    presents.forEach(present => {
        ctx.font = '25px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(present.toy, present.x, present.y);
    });
    
    // Confetti
    confetti.forEach(c => {
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, 4, 4);
    });
    
    // Current toy indicator on sleigh
    if (currentToyIndex < completedToys.length) {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(completedToys[currentToyIndex], sleigh.x + 50, sleigh.y - 10);
    }
}

function gameOver(won, message) {
    gameState = GAME_STATE.GAME_OVER;
    instructionsDiv.innerHTML = `
        <h2>${won ? '🎉 Success! 🎉' : '😔 Game Over'}</h2>
        <p>${message}</p>
        <button onclick="showMenu()">Play Again</button>
    `;
    instructionsDiv.style.display = 'block';
}

// Helper function to get coordinates from mouse or touch event
function getEventCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Mouse and touch events for workshop
function handlePointerDown(e) {
    if (gameState !== GAME_STATE.WORKSHOP) return;
    
    e.preventDefault();
    const coords = getEventCoordinates(e, canvas);
    const mouseX = coords.x;
    const mouseY = coords.y;
    
    // If assembled, treat entire toy as one clickable object
    if (currentToy && currentToy.assembled) {
        // Check if clicking on any part
        for (let i = toyParts.length - 1; i >= 0; i--) {
            const part = toyParts[i];
            if (mouseX >= part.x && mouseX <= part.x + part.width &&
                mouseY >= part.y && mouseY <= part.y + part.height) {
                selectedPart = part;
                offsetX = mouseX - part.x;
                offsetY = mouseY - part.y;
                break;
            }
        }
    } else {
        // Check if clicking on a toy part
        for (let i = toyParts.length - 1; i >= 0; i--) {
            const part = toyParts[i];
            if (mouseX >= part.x && mouseX <= part.x + part.width &&
                mouseY >= part.y && mouseY <= part.y + part.height) {
                selectedPart = part;
                offsetX = mouseX - part.x;
                offsetY = mouseY - part.y;
                break;
            }
        }
    }
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('touchstart', handlePointerDown);

function handlePointerMove(e) {
    if (gameState !== GAME_STATE.WORKSHOP || !selectedPart) return;
    
    e.preventDefault();
    const coords = getEventCoordinates(e, canvas);
    const mouseX = coords.x;
    const mouseY = coords.y;
    
    const deltaX = (mouseX - offsetX) - selectedPart.x;
    const deltaY = (mouseY - offsetY) - selectedPart.y;
    
    selectedPart.x = mouseX - offsetX;
    selectedPart.y = mouseY - offsetY;
    
    // Move all connected parts with it
    moveConnectedParts(selectedPart, deltaX, deltaY, [selectedPart.id]);
    
    // If toy is assembled, update the completed position
    if (currentToy && currentToy.assembled && currentToy.completedX !== undefined) {
        currentToy.completedX += deltaX;
        currentToy.completedY += deltaY;
    }
}

canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('touchmove', handlePointerMove);

function moveConnectedParts(part, deltaX, deltaY, movedIds) {
    part.connectedParts.forEach(connectedId => {
        if (movedIds.includes(connectedId)) return; // Already moved
        
        const connectedPart = toyParts.find(p => p.id === connectedId);
        if (connectedPart) {
            connectedPart.x += deltaX;
            connectedPart.y += deltaY;
            movedIds.push(connectedId);
            // Recursively move parts connected to this one
            moveConnectedParts(connectedPart, deltaX, deltaY, movedIds);
        }
    });
}

function handlePointerUp(e) {
    if (gameState !== GAME_STATE.WORKSHOP || !selectedPart) return;
    
    e.preventDefault();
    const snapDistance = 60;
    
    // If toy is assembled, check if dragging to toy bin
    if (currentToy && currentToy.assembled) {
        // Check if the center of the completed toy is in the bin
        const toyCenterX = currentToy.completedX + currentToy.fullSize / 2;
        const toyCenterY = currentToy.completedY + currentToy.fullSize / 2;
        
        const toyInBin = toyCenterX >= toyBin.x &&
                        toyCenterX <= toyBin.x + toyBin.width &&
                        toyCenterY >= toyBin.y &&
                        toyCenterY <= toyBin.y + toyBin.height;
        
        if (toyInBin) {
            // Toy completed!
            toysMade++;
            completedToys.push(currentToy.emoji); // Save the emoji
            toysCountEl.textContent = toysMade;
            
            // Check if enough toys made
            if (toysMade >= toysRequired) {
                setTimeout(() => {
                    startSleighRide();
                }, 500);
            } else {
                // Spawn new toy
                spawnNewToy();
            }
            selectedPart = null;
            return;
        }
    }
    
    // Find any connected part in a group to use as reference point
    let referencePart = null;
    
    // Find the largest group (most connected pieces)
    let largestGroupIndex = 0;
    let largestGroupSize = 0;
    partGroups.forEach((group, index) => {
        if (group.length > largestGroupSize) {
            largestGroupSize = group.length;
            largestGroupIndex = index;
        }
    });
    
    // If there's a group with multiple pieces, use it as reference
    if (largestGroupSize > 1) {
        const largestGroup = partGroups[largestGroupIndex];
        // Find the top-left piece in this group as anchor
        let topLeftPart = null;
        let minGridSum = Infinity;
        
        largestGroup.forEach(partId => {
            const part = toyParts.find(p => p.id === partId);
            if (part) {
                const gridSum = part.quadrant.gridRow + part.quadrant.gridCol;
                if (gridSum < minGridSum) {
                    minGridSum = gridSum;
                    topLeftPart = part;
                }
            }
        });
        
        referencePart = topLeftPart;
    }
    
    // Check if selected part should snap to its correct position relative to reference
    if (referencePart && referencePart.id !== selectedPart.id) {
        // Calculate where this piece SHOULD be relative to the reference
        const colDiff = selectedPart.quadrant.gridCol - referencePart.quadrant.gridCol;
        const rowDiff = selectedPart.quadrant.gridRow - referencePart.quadrant.gridRow;
        
        const expectedX = referencePart.x + (colDiff * currentToy.pieceSize);
        const expectedY = referencePart.y + (rowDiff * currentToy.pieceSize);
        
        // Check if current position is close to expected position
        const dx = selectedPart.x - expectedX;
        const dy = selectedPart.y - expectedY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < snapDistance) {
            // Snap to the correct position!
            connectParts(referencePart, selectedPart);
        }
    } else {
        // No reference yet, or we ARE the reference - try to connect to any nearby piece
        console.log('No reference group yet, trying to connect nearby pieces');
        let connected = false;
        toyParts.forEach(otherPart => {
            if (connected) return;
            if (otherPart.id === selectedPart.id) return;
            if (selectedPart.connectedParts.includes(otherPart.id)) return;
            
            // Check distance between parts
            const dx = (selectedPart.x + selectedPart.width / 2) - (otherPart.x + otherPart.width / 2);
            const dy = (selectedPart.y + selectedPart.height / 2) - (otherPart.y + otherPart.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            console.log(`Distance to other part: ${distance.toFixed(1)} (snap at ${snapDistance})`);
            
            if (distance < snapDistance) {
                // Connect these parts!
                console.log('CONNECTING PARTS!', selectedPart.partName, otherPart.partName);
                connectParts(selectedPart, otherPart);
                connected = true;
            }
        });
    }
    
    selectedPart = null;
}

canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('touchend', handlePointerUp);

function connectParts(part1, part2) {
    console.log('connectParts called:', part1.partName, part2.partName);
    
    // Add to each other's connection lists
    if (!part1.connectedParts.includes(part2.id)) {
        part1.connectedParts.push(part2.id);
    }
    if (!part2.connectedParts.includes(part1.id)) {
        part2.connectedParts.push(part1.id);
    }
    
    console.log('Part1 connections:', part1.connectedParts.length, 'Part2 connections:', part2.connectedParts.length);
    
    // Calculate the expected position of part2 relative to part1 based on grid positions
    const row1 = part1.quadrant.gridRow;
    const col1 = part1.quadrant.gridCol;
    const row2 = part2.quadrant.gridRow;
    const col2 = part2.quadrant.gridCol;
    
    // Calculate how many pieces apart they should be
    const colDiff = col2 - col1;
    const rowDiff = row2 - row1;
    
    // Snap part2 to exact position relative to part1
    const targetX = part1.x + (colDiff * currentToy.pieceSize);
    const targetY = part1.y + (rowDiff * currentToy.pieceSize);
    
    // Calculate offset to apply to part2's entire group
    const offsetX = targetX - part2.x;
    const offsetY = targetY - part2.y;
    
    // Move part2 and all its connected parts
    const group2Index = partGroups.findIndex(g => g.includes(part2.id));
    if (group2Index !== -1) {
        partGroups[group2Index].forEach(partId => {
            const connectedPart = toyParts.find(p => p.id === partId);
            if (connectedPart) {
                connectedPart.x += offsetX;
                connectedPart.y += offsetY;
            }
        });
    }
    
    // Merge groups
    let group1Index = partGroups.findIndex(g => g.includes(part1.id));
    
    if (group1Index !== group2Index) {
        // Merge group2 into group1
        partGroups[group1Index] = [...partGroups[group1Index], ...partGroups[group2Index]];
        partGroups.splice(group2Index, 1);
    }
}

// Keyboard and touch events for sleigh
const keys = {};
let touchControls = { left: false, right: false, up: false, down: false, drop: false };

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (gameState === GAME_STATE.SLEIGH) {
        if (e.key === ' ') {
            e.preventDefault();
            // Only drop if we have toys left
            if (currentToyIndex < completedToys.length) {
                presents.push({
                    x: sleigh.x + sleigh.width / 2,
                    y: sleigh.y + 40,
                    hit: false,
                    toy: completedToys[currentToyIndex]
                });
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for sleigh - tap screen to drop present
canvas.addEventListener('touchstart', (e) => {
    if (gameState === GAME_STATE.SLEIGH) {
        e.preventDefault();
        // Tap to drop present
        if (currentToyIndex < completedToys.length) {
            presents.push({
                x: sleigh.x + sleigh.width / 2,
                y: sleigh.y + 40,
                hit: false,
                toy: completedToys[currentToyIndex]
            });
        }
    }
});

// Update sleigh position based on keys or touch
setInterval(() => {
    if (gameState === GAME_STATE.SLEIGH) {
        if (keys['ArrowUp'] && sleigh.y > 50) {
            sleigh.y -= sleigh.speed;
        }
        if (keys['ArrowDown'] && sleigh.y < canvas.height - 150) {
            sleigh.y += sleigh.speed;
        }
        if (keys['ArrowLeft'] && sleigh.x > 0) {
            sleigh.x -= sleigh.speed;
        }
        if (keys['ArrowRight'] && sleigh.x < canvas.width - sleigh.width) {
            sleigh.x += sleigh.speed;
        }
    }
}, 16);

// Add gyroscope/tilt controls for mobile
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
        if (gameState === GAME_STATE.SLEIGH && e.beta !== null && e.gamma !== null) {
            // beta is front-to-back tilt (-180 to 180)
            // gamma is left-to-right tilt (-90 to 90)
            
            // Use gamma for left-right movement
            if (e.gamma > 10 && sleigh.x < canvas.width - sleigh.width) {
                sleigh.x += sleigh.speed * 0.5;
            } else if (e.gamma < -10 && sleigh.x > 0) {
                sleigh.x -= sleigh.speed * 0.5;
            }
            
            // Use beta for up-down movement
            if (e.beta < 60 && sleigh.y > 50) {
                sleigh.y -= sleigh.speed * 0.3;
            } else if (e.beta > 80 && sleigh.y < canvas.height - 150) {
                sleigh.y += sleigh.speed * 0.3;
            }
        }
    });
}
