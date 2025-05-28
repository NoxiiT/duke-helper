import Settings from "../config.js";
import { 
    chatMessage, playSounds, renderCenter, 
    rightClick, renderDukeHealth, updateDukeHealth,
    getItemIndexOfArray, smoothAimTo,
    renderStatusOverlay, changeDukeFound, changeBladeFound,
    renderBladeHealth
} from "../utils.js";
import { TASController } from "./TASController.js";
import request from "requestV2";

// ====== Constants ======
const DUKE_ZONE = { xMin: -547, xMax: -523, zMin: -918, zMax: -890 };
// const BLADE_ZONE = { xMin: -321, xMax: -269, zMin: -543, zMax: -491 };
const BLADE_ZONE = { xMin: -332, xMax: -273, zMin: -539, zMax: -496 };
const IRON_CHECK = {
    duke: { x: -537, y: 116, z: -905 },
    blade: { x: -297, y: 81, z: -516 
}};

// ====== State Management ======
let state = {
    enabled: false,
    phase: 'idle',
    role: Settings().dukeRole === 0 ? 'leader' : 'member',
    kills: { duke: 4, blade: 0 },
    currentTarget: null,
    tas: new TASController(),
    lobbySwapDelay: Settings().lobbySwapDelay || 1500,
    timers: {},
    alerts: {
        dukeFound: { active: false, startTime: 0 }
    },
    pendingTarget: null,
    tasEvents: new Map(),
    commandLock: false,
    lastCommandTime: 0,
    foundAnnounced: false,
    startScriptDate: null, // Date when the script was started (so we can display the time elapsed)
    loot : {
        "URCHIN": {
            name: "Urchin",
            id: "urchin",
            price: 9193608,
            count: 0
        },
        "FLAMING FIST": {
            name: "Flaming Fist",
            id: "flaming_fist",
            price: 13500000,
            count: 0
        },
        "CYCLAMEN DYE": {
            name: "Cyclamen Dye",
            id: "cyclamen_dye",
            price: 50000000,
            count: 0
        },
        "LEATHER CLOTH": {
            name: "Leather Cloth",
            id: "leather_cloth",
            price: 323000,
            count: 0
        },
        "RAGNAROCK AXE": {
            name: "Ragnarock Axe",
            id: "ragnarock_axe",
            price: 500000,
            count: 0
        }
    },
};

// ====== Overlay Rendering ======
register('renderOverlay', () => {
    // Render Duke Found alert
    if (state.alerts.dukeFound.active && Date.now() - state.alerts.dukeFound.startTime < 2500) {
        renderCenter("&cDuke Found", 3);
    } else {
        state.alerts.dukeFound.active = false;
    }
});

register('renderOverlay', () => {
    if (!state.enabled) return;

    // Rendre les deux overlays dans la même passe
    Renderer.translate(0, 0); // Réinitialise les transformations
    renderDukeHealth();
    
    Renderer.translate(0, 0); // Réinitialise à nouveau
    renderBladeHealth();

    Renderer.translate(0, 0); // Réinitialise à nouveau
    renderStatusOverlay(
        state.phase,
        state.kills, 
        state.currentTarget,
        state.loot,
        state.startScriptDate,
        1
    );
});

// ====== Core Functions ======
function startDukeHelper() {
    if (state.enabled) return;
    state.startScriptDate = new Date();
    state.enabled = true;
    state.phase = 'init';
    chatMessage("&aDuke Helper Started!");
}

function stopDukeHelper() {
    state.enabled = false;
    state.startScriptDate = null;
    clearTimers();
    state.tas.stopReplay();
    state.phase = 'idle';
    clickCount = 0;
    lastClickTime = 0;
    chatMessage("&cDuke Helper Stopped!");
}

function clearTimers() {
    Object.values(state.timers).forEach(timer => {
        if (timer && typeof timer.cancel === 'function') {
            timer.cancel();
        }
    });
    state.timers = {};
}

function warp(target, callback) {
    if (state.commandLock) return;
    
    state.commandLock = true;
    ChatLib.command(`warp ${target}`);
    
    let attempts = 0;
    const checkWarp = () => {
        if (isInCorrectDimension(target) || attempts++ > 5) {
            state.commandLock = false;
            if (callback) callback();
        } else {
            state.timers.warpCheck = setTimeout(checkWarp, 500);
        }
    };
    
    state.timers.warpCheck = setTimeout(checkWarp, 500);
}

function isInCorrectDimension(target) {
    const targetAreas = {
        'kuudra': 'Forgotten Skull',
        'nether': 'Crimson Isle',
        'gold': 'Gold Mine'
    };

    const lines = Scoreboard.getLines();
    let currentArea = '';

    lines.some(line => {
        const cleanLine = line.getName().removeFormatting();
        if (cleanLine.includes("⏣")) {
            currentArea = cleanLine.split("⏣ ")[1].trim();
            return true;
        }
        return false;
    });

    switch(target) {
        case 'kuudra':
            return currentArea === targetAreas.kuudra;
        case 'nether':
            return currentArea === targetAreas.nether;
        case 'gold':
            return currentArea === targetAreas.gold;
        default:
            return false;
    }
}

function handlePhase() {
    if (!state.enabled || state.commandLock) return;

    switch (state.phase) {
        case 'init':
            if (state.tas.isReplaying) return;
            state.phase = 'waiting';
            initializeSession();
            break;
        case 'searching':
            handleSearchPhase();
            break;
        case 'approachingBlade':
            handleApproachBlade();
            break;
        case 'walkToBlade':
            handleWalkToBlade();
            break;
        case 'targeting':
            handleTargeting();
            break;
        case 'attacking':
            handleAttack();
            break;
        case 'cooldown':
            handleCooldown();
            break;
        case 'waiting':
            // Ne rien faire
            break;
    }
}

// ====== Phase Handlers ======
function initializeSession() {
    state.currentTarget = state.kills.duke < 4 ? 'duke' : 'blade';
    
    if (state.role === 'leader') {
        const warpCmd = state.currentTarget === 'duke' ? 'kuudra' : 'nether';
        warp(warpCmd, () => {
            // state.tas.startReplay(`go_to_${state.currentTarget}`);
            startTASReplay(`go_to_${state.currentTarget}`);
            state.phase = 'searching';
        });
    }
}

function handleSearchPhase() {
    // Check iron block first
    if (checkIronBlock(state.currentTarget)) {
        chatMessage("&cMob absent, swapping lobby...");
        swapLobby();
        return;
    }

    const mob = scanForMob(state.currentTarget);
    if (mob) {
        if (!checkMobInZone(state.currentTarget, mob)) {
            mobName = state.currentTarget === 'duke' ? 'Barbarian Duke' : 'Bladesoul';
            chatMessage(`&c${mobName} not in zone, swapping lobby...`);
            swapLobby();
            return;
        }
        // Warp party immédiatement
        if (state.role === 'leader' && !state.foundAnnounced) { // Only announce once per world
            ChatLib.command('p warp');
            setTimeout(() => {
                ChatLib.command('pc FOUND');
                state.foundAnnounced = true;
            }, 300);
        }
        
        if (state.tas.isReplaying) {
            // Stocker la cible et attendre la fin du replay
            state.pendingTarget = mob;
            state.tas.once('replay_end', () => {
                state.phase = 'targeting';
            });
        } else {
            handleMobFound();
        }
    } else if (!checkInZone(state.currentTarget) && !state.tas.isReplaying) {
        chatMessage("&cFailed to reach zone, retrying...");
        warp(state.currentTarget === 'duke' ? 'kuudra' : 'nether', () => {
            // state.tas.startReplay(`go_to_${state.currentTarget}`);
            startTASReplay(`go_to_${state.currentTarget}`);
            state.phase = 'searching';
        });
    } else if (checkInZone(state.currentTarget) && !state.tas.isReplaying) {
        chatMessage("&cMob absent, swapping lobby...");
        swapLobby();
    }
}

function handleMobFound() {
    state.alerts.dukeFound.active = true;
    state.alerts.dukeFound.startTime = Date.now();
    playSounds();

    state.phase = 'targeting';
}

function handleApproachBlade() {
    if (Client.currentGui.get() != null) return;

    const mob = scanForMob('blade');
    if (!mob) {
        state.phase = 'searching';
        return;
    }

    // Smooth aim to target
    const targetPos = {
        x: Math.floor(mob.getX()) + 0.5,
        y: Math.floor(mob.getY()) + 0.5 - 1,
        z: Math.floor(mob.getZ()) + 0.5
    };

    smoothAimTo(targetPos, 350, () => {
        state.phase = 'walkToBlade';
        chatMessage("&aApproaching Blade...");
    });
}

function handleWalkToBlade() {
    if (Client.currentGui.get() != null) return;

    // We start walking until we are close enough to the mob (dist2D < 3)
    const mob = scanForMob('blade');
    if (!mob) {
        state.phase = 'searching';
        return;
    }

    const mobPos = {
        x: Math.floor(mob.getX()) + 0.5,
        y: Math.floor(mob.getY()) + 0.5 - 1,
        z: Math.floor(mob.getZ()) + 0.5
    };

    const playerPos = {
        x: Math.floor(Player.getX()),
        y: Math.floor(Player.getY()) - 2,
        z: Math.floor(Player.getZ())
    };

    const dist2D = Math.sqrt(Math.pow(mobPos.x - playerPos.x, 2) + Math.pow(mobPos.z - playerPos.z, 2));
    if (dist2D > 3) {
        // Smoothly walk towards the mob with the keybind (Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i()))
        state.phase = 'waiting';
        let forwardKeyBind = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i());
        forwardKeyBind.setState(true);
        setTimeout(() => {
            forwardKeyBind.setState(false);
            state.phase = 'walkToBlade';
        }, 100);
    } else {
        state.phase = 'targeting';
        chatMessage("&aTargeting Blade...");
    }
}
        

function handleTargeting() {
    if (Client.currentGui.get() != null) return;

    const mob = scanForMob(state.currentTarget);
    if (!mob) {
        state.phase = 'searching';
        return;
    }

    // Smooth aim to target
    const targetPos = {
        x: Math.floor(mob.getX()) + 0.5,
        y: Math.floor(mob.getY()) + 0.5 - 1,
        z: Math.floor(mob.getZ()) + 0.5
    };

    if (state.currentTarget === 'blade') {
        // Aim at our feet
        targetPos.x = Math.floor(Player.getX());
        targetPos.y = Math.floor(Player.getY()) - 2;
        targetPos.z = Math.floor(Player.getZ());
    }

    smoothAimTo(targetPos, 350, () => {
        chatMessage("&aAttacking target!");
        state.phase = 'attacking';
    });
}

function handleAttack() {
    if (Client.currentGui.get() != null) return;

    const mob = scanForMob(state.currentTarget);
    if (!mob) {
        state.phase = 'searching';
        return;
    }

    const hyperionSlot = getItemIndexOfArray(['Hyperion', 'Valkyrie', 'Astraea', 'Scylla']);
    if (hyperionSlot === -1) {
        chatMessage("&cHyperion not found in hotbar!");
        return;
    }

    Player.setHeldItemIndex(hyperionSlot);

    // Keep smooth look at the target while attacking
    const targetPos = {
        x: Math.floor(mob.getX()) + 0.5,
        y: Math.floor(mob.getY()) + 0.5 - 1,
        z: Math.floor(mob.getZ()) + 0.5
    };

    if (state.currentTarget === 'blade') {
        // Aim at our feet
        targetPos.x = Math.floor(Player.getX());
        targetPos.y = Math.floor(Player.getY()) - 2;
        targetPos.z = Math.floor(Player.getZ());
    }

    function keepAiming() {
        if (!state.enabled || state.phase !== 'attacking') return;
        if (Client.currentGui.get() != null) {
            keepAiming();
            return;
        }

        smoothAimTo(targetPos, 300, () => {
            state.timers.aim = setTimeout(keepAiming, 50);
        });
    }
    keepAiming();
}

function handleCooldown() {
    warp('gold', () => {
        state.timers.synchronize_members = setTimeout(() => {
            if (state.role === 'leader') {
                // Synchronize the kills to the party
                ChatLib.command('pc ' + state.kills.duke + ' kills');
            }
        }, state.lobbySwapDelay / 2);
        state.timers.lobbyCooldown = setTimeout(() => {
            state.phase = 'init';
        }, state.lobbySwapDelay);
    });
}

// ====== Helper Functions ======
function checkIronBlock(targetType) {
    const pos = IRON_CHECK[targetType];
    return World.getBlockAt(pos.x, pos.y, pos.z).type.getName() === "Block of Iron";
}

function checkInZone(targetType) {
    const playerX = Player.getX();
    const playerZ = Player.getZ();
    const zone = targetType === 'duke' ? DUKE_ZONE : BLADE_ZONE;
    
    return playerX >= zone.xMin && playerX <= zone.xMax && 
           playerZ >= zone.zMin && playerZ <= zone.zMax;
}

function checkMobInZone(targetType, mob) {
    const zone = targetType === 'duke' ? DUKE_ZONE : BLADE_ZONE;
    const mobX = mob.getX();
    const mobZ = mob.getZ();

    return mobX >= zone.xMin && mobX <= zone.xMax &&
           mobZ >= zone.zMin && mobZ <= zone.zMax;
}

function scanForMob(targetType) {
    const mobName = targetType === 'duke' ? 'Barbarian Duke' : 'Bladesoul';
    return World.getAllEntities().find(e => 
        !e.isDead() && 
        e.getName().includes(mobName) && 
        checkInZone(targetType)
    );
}

let clickCount = 0;
let lastClickTime = 0;

register('tick', () => {
    if (state.phase !== 'attacking') return;

    const now = Date.now();
    const targetCPS = Settings().CPS_MIN + Math.random() * (Settings().CPS_MAX - Settings().CPS_MIN);
    const delay = 1000 / targetCPS;

    if (now - lastClickTime >= delay) {
        rightClick();
        lastClickTime = now;
        clickCount++;
        
        // Anti-spam vérification
        if (clickCount > 15) {
            clickCount = 0;
            setTimeout(() => {}, 1000); // Pause de sécurité
        }
    }
});

function swapLobby() {
    warp('gold', () => {
        state.timers.lobbySwap = setTimeout(() => {
            initializeSession();
        }, state.lobbySwapDelay);
    });
}

// ====== Modified TAS Control ======
function startTASReplay(name) {
    if (state.tas.isReplaying || state.commandLock) return;
    
    state.commandLock = true;
    state.tas.once('end', () => {
        state.commandLock = false;
    });
    
    state.tas.startReplay(name);
}

// ====== TAS Event Integration ======
function setupTASEvents() {
    state.tas.on('replay_end', () => {
        if (state.pendingTarget) {
            handleMobFound(state.pendingTarget);
            state.pendingTarget = null;
        }
        if (state.phase === 'approaching') {
            state.phase = 'searching';
        }
    });
}

// ====== Event Handlers ======
register('tick', () => {
    handlePhase();
    updateDukeHealth(scanForMob('duke'));
});

register('renderWorld', () => {
    // Scan for mobs in the world
    const dukeMob = scanForMob('duke');
    const bladeMob = scanForMob('blade');
    if (dukeMob) {
        changeDukeFound(true);
    }
    if (bladeMob) {
        changeBladeFound(true);
    }
});

register('worldLoad', () => {
    clickCount = 0;
    lastClickTime = 0;
    lastWarpTime = 0;
    changeDukeFound(false);
    changeBladeFound(false);
    state.tas.stopReplay();
    state.foundAnnounced = false; // Reset on world load
});

function scanForLoot() {
    // Scan for loot in the world (ArmorStands)
    const loots = World.getAllEntities().filter(e => e.getClassName() === 'EntityArmorStand');
    loots.forEach(loot => {
        const name = loot.getName();
        const nameWithoutColor = name.replace(/§./g, '').toUpperCase();
        // chatMessage(`Loot Name: ${name}&r | ${nameWithoutColor}`);
        if (name) {
            const lootItem = state.loot[nameWithoutColor];
            if (lootItem) {
                lootItem.count++;
                // chatMessage(`&aLoot found: ${lootItem.name} (${lootItem.count})`);
            }
        }
    });
}

register('chat', (event) => {
    if (!state.enabled) return;
    
    const msg = ChatLib.getChatMessage(event);
    if (msg.includes('BARBARIAN DUKE X DOWN!')) {
        state.timers.waitForLoot = setTimeout(() => {
            scanForLoot();
            state.kills.duke++;
            state.phase = 'cooldown';
        }, 500);
    }
    if (msg.includes('BLADESOUL DOWN!')) {
        state.timers.waitForLoot = setTimeout(() => {
            scanForLoot();
            state.kills.blade++;
            state.kills.duke = 0;
            state.phase = 'cooldown';
        }, 500);
    }
    if (msg.includes('You were killed by')) {
        state.timers.deathReset = setTimeout(() => {
            warp(state.currentTarget === 'duke' ? 'kuudra' : 'nether', () => {
                state.tas.startReplay(`go_to_${state.currentTarget}`);
                state.phase = 'searching';
            });
        }, 500);
    }
    if (msg.includes('FOUND')) {
        chatMessage("&aLeader found the mob!");
        if (state.role === 'member') {
            chatMessage("&aWarping to location...");
            // Run go_to_duke or go_to_blade TAS and set phase to searching
            setTimeout(() => {
                const warpCmd = state.currentTarget === 'duke' ? 'kuudra' : 'nether';
                warp(warpCmd, () => {
                    // state.tas.startReplay(`go_to_${state.currentTarget}`);
                    startTASReplay(`go_to_${state.currentTarget}`);
                    state.phase = 'searching';
                });
            }, 500);
        }
    }
    if (msg.includes('kills')) {
        if (state.role === 'member') {
            chatMessage("&aSynchronizing kills...");
            const kills = parseInt(msg.split(' ')[4]);
            if (!isNaN(kills)) {
                state.kills.duke = kills;
                chatMessage(`&aDuke kills synchronized: ${kills}`);
            }
        }
    }
});

register('command', () => {
    // Scan the world for armor stands and display their names
    const armorStands = World.getAllEntities().filter(e => e.getClassName() === 'EntityArmorStand');
    armorStands.forEach(stand => {
        const name = stand.getName();
        console.log(name);
        const nameWithoutColor = name.replace(/§./g, '');
        console.log(nameWithoutColor);
        if (name) {
            chatMessage(`Armor Stand Name: ${name}&r | ${nameWithoutColor}`);
        }
    });
}).setName('scanArmorStands');

// ====== Command Handling ======
register('command', (action, param) => {
    switch (action?.toLowerCase()) {
        case 'on':
            startDukeHelper();
            break;
        case 'off':
            stopDukeHelper();
            break;
        case 'role':
            setRole(param);
            break;
        default:
            Settings().getConfig().openGui();
    }
}).setName('duke');

function setRole(newRole) {
    if (newRole === 'leader') {
        state.role = 'leader';
        chatMessage("&aNow acting as party leader");
    } else {
        state.role = 'member';
        chatMessage("&aNow acting as party member");
    }
}

export function initialize() {
    state.tas.on('end', () => {
        if (state.pendingTarget) {
            handleMobFound(state.pendingTarget);
            state.pendingTarget = null;
        }
    });

    setupTASEvents();
    register('worldLoad', () => {
        clearTimers();
        state.tas.stopReplay();
        state.phase = 'idle';
        state.pendingTarget = null;
    });

    const url = `https://api.hypixel.net/skyblock/bazaar/`;
    request({
        url: url,
        json: true
    }, (err, resp, data) => {
        if (!err && data && data.products) {
            let price = data.products["MAGMA_URCHIN"].sell_summary[0].pricePerUnit;
            state.loot["URCHIN"].price = price;
            price = data.products["LEATHER_CLOTH"].sell_summary[0].pricePerUnit;
            state.loot["LEATHER_CLOTH"].price = price;
        }
    });
    
    chatMessage("&aDuke Helper Loaded! Use /duke to start");
}

// TO FIX :
// Cooldown to be adjusted (too long)
// Add death handling (You were killed by...) -> Don't swap lobby but warp kuudra / nether -> Run go_to_duke / go_to_blade -> etc.
// When not in zone, don't swap lobby but retry from the warp kuudra / nether -> Run go_to_duke / go_to_blade -> etc.