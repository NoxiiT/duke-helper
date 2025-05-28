import Settings from "../config.js";
import { renderDukeHealth, updateDukeHealth, rightClick, renderCenter, chatMessage, playSounds, changeDukeFound, renderStatusOverlay, changeBladeFound, renderBladeHealth, updateBladeHealth } from "../utils.js"
import { TASController } from './TASController.js';
import RenderLibV2 from "../../RenderLibV2/index.js";
import axios from "axios";

// Quand le Duke est trouvé, on affiche et met à jour sa santé
register("renderOverlay", renderDukeHealth);

register("renderOverlay", renderBladeHealth);

// Commande alertduke pour déclencher la lecture des sons
register("command", playSounds).setName('alertduke', true);

let displayText = false;
let duke = undefined;
let searchingForDuke = true;
let searchingForBladesoul = false;
let warpoutIndex = 0;
let warpCooldown = 0;
let lastDisplayTime = new Date();

const tas = new TASController();
let pendingAttack = null;
let attackTimer = null;

// smoothing lock state
let isSmoothing = false;
let lockPrevYaw = 0, lockPrevPitch = 0;
let lockTargetYaw = 0, lockTargetPitch = 0;
let lockStartTime = 0, lockDuration = 200; // ms

let state = {
    startScriptDate: null,
    kills: { duke: 4, blade: 0 },
    loot: {
        "MAGMA URCHIN": {
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
    paused: false,
    pauseTime: null,
    lastActionTime: null,
    totalPausedDuration: 0
}

// Affichage d'alerte "Duke Found" pendant 2.5 secondes
register("renderOverlay", () => {
    if (!displayText) return;
    renderCenter("&cDuke Found", 3);
    if (new Date().getTime() - lastDisplayTime.getTime() > 2500) {
        displayText = false;
    }
});

register("renderOverlay", () => {
    if (!Settings().dukeEnabled) return;
    renderStatusOverlay(
        Settings().dukeRole === 0 ? "Leader" : "Member",
        state.paused,
        state.kills,
        state.kills.duke % 4 === 0 ? "BLADE" : "DUKE",
        state.loot,
        state.startScriptDate,
        1,
        state.totalPausedDuration, // pass paused duration
        state.pauseTime // pass pauseTime
    );
});

// Commande /duke pour gérer l'activation et le rôle
register("command", (name, role) => {
    switch (name?.toLowerCase()) {
        case "on":
            Settings().dukeEnabled = true;
            chatMessage("&aDuke Enabled");
            break;
        case "off":
            Settings().dukeEnabled = false;
            chatMessage("&cDuke Disabled");
            break;
        case "role":
            if (role?.toLowerCase() === "leader") {
                Settings().dukeRole = 0;
                chatMessage("&aYou are now a Duke leader");
            } else if (role?.toLowerCase() === "member") {
                Settings().dukeRole = 1;
                chatMessage("&aYou are now a Duke member");
            } else {
                chatMessage("&cInvalid role. Available roles: leader, member");
            }
            break;
        case "help":
            ChatLib.chat("&c ------- &6Duke Helper &c-------");
            chatMessage("&4/duke on - Enables Duke");
            chatMessage("&4/duke off - Disables Duke");
            chatMessage("&4/duke role leader - Sets the role as leader");
            chatMessage("&4/duke role member - Sets the role as member");
            chatMessage("&4/duke help - Shows this message");
            chatMessage("&4/dukedebug setdukekilled <number> - Sets the number of Duke killed");
            ChatLib.chat("&c -------------------------");
            break;
        default:
            Settings().getConfig().openGui();
    }
}).setName("duke", true).setTabCompletions(["on", "off", "role", "help"]);

// Affichage du message "Duke Found" et lancement de l'alerte sonore
register("renderWorld", () => {
    if (!Settings().dukeEnabled) return;

    // smooth lock-on interpolation
    if (isSmoothing) {
        const now = Date.now();
        const t = Math.min((now - lockStartTime) / lockDuration, 1);
        const yaw = lockPrevYaw + ((lockTargetYaw - lockPrevYaw + 540) % 360 - 180) * t;
        const pitch = lockPrevPitch + (lockTargetPitch - lockPrevPitch) * t;
        Player.getPlayer().field_70177_z = yaw;
        Player.getPlayer().field_70125_A = pitch;
        if (t >= 1) isSmoothing = false;
    }

    duke = undefined;

    duke = World.getAllEntities().filter(entity =>
        searchingForDuke && !entity.isDead() && entity.name.includes("DukeBarb")
    );

    // console.log(duke);

    if (duke !== undefined && duke.length > 0) {
        searchingForDuke = false;
        displayText = true;
        changeDukeFound(true);
        lastDisplayTime = new Date();
        pendingAttack = 'duke';
        if (Settings().dukeRole === 0) {
            chatMessage("&cDuke Found");
            playSounds();
            ChatLib.command('p warp', false);
            setTimeout(() => ChatLib.command('pc DUKE FOUND', false), 300);
            if (Settings().enableUseItem && Settings().itemToUse !== "")
                setTimeout(() => sendUseItem(Settings().itemToUse), Settings().useItemDelay);
        }
    }

    if (searchingForBladesoul) {
        const blades = World.getAllEntities().filter(e =>
            !e.isDead() && e.name.includes("Bladesoul")
        );
        if (blades.length > 0) {
            searchingForBladesoul = false;
            chatMessage("&cBladeSoul Found, warping in");
            ChatLib.command('p warp', false);
            changeBladeFound(true);
            setTimeout(() => {
                ChatLib.command('pc BLADESOUL FOUND', false);
            }, 300);
            if (Settings().enableUseItem && Settings().itemToUse !== "")
                setTimeout(() => sendUseItem(Settings().itemToUse), Settings().useItemDelay);
        }
    }
});

register("renderWorld", () => {
    updateDukeHealth(World.getAllEntities().find(entity => !entity.isDead() && entity.name.includes("Barbarian Duke")));
    updateBladeHealth(World.getAllEntities().find(entity => !entity.isDead() && entity.name.includes("Bladesoul")));
});

register("renderWorld", (partialTicks) => {
    if (!Settings().dukeEnabled || !Settings().enableEspDuke) return;

    const DukeWrap = World.getAllEntities().find(e =>
        !e.isDead() && e.getName().includes("DukeBarb")
    );
    if (!DukeWrap) return;
    const duke = DukeWrap.getEntity();

    // Interpolation
    const interpX = duke.field_70169_q + (duke.field_70165_t - duke.field_70169_q) * partialTicks;
    const interpY = duke.field_70167_r + (duke.field_70163_u - duke.field_70167_r) * partialTicks;
    const interpZ = duke.field_70166_s + (duke.field_70161_v - duke.field_70166_s) * partialTicks;

    const x = interpX;
    const y = interpY + 0.1;
    const z = interpZ;

    const w = 0.6;
    const h = 1.8;
    const d = w;

    // Pulsation
    const t     = (Date.now() % 1000) / 1000.0;
    const alpha = 0.75 + 0.25 * Math.sin(t * Math.PI * 2);
    let r = 0.788, g = 0.647, b = 0.522;

    RenderLibV2.drawEspBoxV2(
        x, y, z, w, h, d,
        r, g, b, alpha,
        true,
        1.5     // lineWidth
    );

    // 84, 66, 48
    r = 0.33, g = 0.26, b = 0.19;

    RenderLibV2.drawInnerEspBoxV2(
        x, y, z, w, h, d,
        r, g, b, 0.5,
        true,
        0.5     // lineWidth
    );
});

register("renderWorld", (partialTicks) => {
    if (!Settings().dukeEnabled || !Settings().enableEspDuke) return;

    const BladeSoulWrap = World.getAllEntities().find(e =>
        !e.isDead() && e.getName().includes("Bladesoul")
    );
    if (!BladeSoulWrap) return;
    const bladesoul = BladeSoulWrap.getEntity();

    // Interpolation
    const interpX = bladesoul.field_70169_q + (bladesoul.field_70165_t - bladesoul.field_70169_q) * partialTicks;
    const interpY = bladesoul.field_70167_r + (bladesoul.field_70163_u - bladesoul.field_70167_r) * partialTicks;
    const interpZ = bladesoul.field_70166_s + (bladesoul.field_70161_v - bladesoul.field_70166_s) * partialTicks;

    const x = interpX;
    const y = interpY - 5.0;
    const z = interpZ;

    const w = 0.7;
    const h = 2.4;
    const d = w;

    // Pulsation
    const t     = (Date.now() % 1000) / 1000.0;
    const alpha = 0.75 + 0.25 * Math.sin(t * Math.PI * 2);
    let r = 0.788, g = 0.647, b = 0.522;

    RenderLibV2.drawEspBoxV2(
        x, y, z, w, h, d,
        r, g, b, alpha,
        true,
        1.5     // lineWidth
    );

    // 84, 66, 48
    r = 0.33, g = 0.26, b = 0.19;

    RenderLibV2.drawInnerEspBoxV2(
        x, y, z, w, h, d,
        r, g, b, 0.5,
        true,
        0.5     // lineWidth
    );
});

// Réinitialisation des états de recherche lors du chargement du monde
register("worldLoad", () => {
    stopAttack();
    searchingForDuke = true;
	duke = [];
	warpingOut = false;
    changeDukeFound(false);
    changeBladeFound(false);
    state.lastActionTime = Date.now(); // Update last action on world load
});

// Fonction de gestion du "warp out" selon l'index
function warpOut() {
    setTimeout(() => {
        switch (warpoutIndex) {
            case 0:
                ChatLib.command('pc BLADE TIME', false);
                playSounds();
                setTimeout(() => ChatLib.command('warp nether', false), Settings().netherWarpDelay);
                if (Settings().autoTAS) {
                    setTimeout(() => {
                        tas.startReplay("go_to_blade");
                    }, Settings().netherWarpDelay + Settings().tasReplayDelayBlade);
                }
                break;
            case 1:
                ChatLib.command('warp gold', false);
                if (Settings().dukeRole === 0) {
                    setTimeout(() => ChatLib.command('warp kuudra', false), Settings().lobbySwapDelay);
                    if (Settings().autoTAS) {
                        setTimeout(() => {
                            tas.startReplay("go_to_duke");
                        }, Settings().lobbySwapDelay + Settings().tasReplayDelayDuke);
                    }
                }
                break;
            case 2:
                setTimeout(() => ChatLib.command('warp kuudra', false), Settings().kuudraWarpDelay);
                if (Settings().autoTAS) {
                    setTimeout(() => {
                        tas.startReplay("go_to_duke");
                    }, Settings().kuudraWarpDelay + Settings().tasReplayDelayDuke);
                }
                break;
            case 3:
                ChatLib.command('warp nether', false);
                if (Settings().autoTAS) {
                    setTimeout(() => {
                        tas.startReplay("go_to_blade");
                    }, Settings().tasReplayDelayBlade);
                }
                break;
            case 4:
                ChatLib.command('warp gold', false);
                setTimeout(() => ChatLib.command('warp nether', false), Settings().lobbySwapDelay);
                if (Settings().autoTAS) {
                    setTimeout(() => {
                        tas.startReplay("go_to_blade");
                    }, Settings().lobbySwapDelay + Settings().tasReplayDelayDuke);
                }
                break;
        }
    }, 1000);
}

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

// Gestion des événements de chat pour l'interaction avec Duke et BladeSoul
register("chat", (event) => {
    if (!Settings().dukeEnabled) return;
    const msg = ChatLib.getChatMessage(event);
    if (msg.includes("DUKE FOUND")) {
        if (Settings().dukeRole === 0) return;
        chatMessage("&cDuke Found, warping in");
        warpoutIndex = 2;
        warpOut();
        cancel(event);
    } else if (msg.includes("BLADESOUL DOWN!")) {
        setTimeout(() => {
            searchingForBladesoul = false;
            pendingAttack = null;
            state.kills.blade++;
            state.lastActionTime = Date.now(); // Update last action
            warpoutIndex = 1;
            scanForLoot();
            warpOut();
        }, 500);
        // Resume the pause session if it was paused
        if (state.paused) {
            state.paused = false;
            const pausedDuration = Date.now() - state.pauseTime;
            state.totalPausedDuration += pausedDuration; // Update total paused duration
            state.pauseTime = null; // Reset pause time
            chatMessage("&aSession resumed after BladeSoul kill.");
        }
    } else if (msg.includes("BARBARIAN DUKE X DOWN!")) {
        setTimeout(() => {
            pendingAttack = null;
            state.kills.duke++;
            state.lastActionTime = Date.now(); // Update last action
            warpoutIndex = 1;
            if (state.kills.duke % 4 === 0)
                warpoutIndex = 0
            searchingForBladesoul = state.kills.duke % 4 === 0;
            scanForLoot();
            warpOut();
        }, 500);
        // Resume the pause session if it was paused
        if (state.paused) {
            state.paused = false;
            const pausedDuration = Date.now() - state.pauseTime;
            state.totalPausedDuration += pausedDuration; // Update total paused duration
            state.pauseTime = null; // Reset pause time
            chatMessage("&aSession resumed after Duke kill.");
        }
    }
});

register("command", (x, y, z) => {
    // check block at coordinates
    if (x && y && z) {
        const block = World.getBlockAt(parseInt(x), parseInt(y), parseInt(z));
        if (block) {
            chatMessage(`&aBlock at (${x}, ${y}, ${z}): ${block.type.getName()}`);
        } else {
            chatMessage("&cNo block found at those coordinates");
        }
    }
}).setName("checkblock", true).setTabCompletions(["x", "y", "z"]);

// Vérification de l'environnement pour déclencher les "warp outs" en cas d'absence de Duke ou de BladeSoul
register("tick", () => {
    if (!Settings().dukeEnabled) return;

    if (World.getBlockAt(-537, 116, -905).type.getName() === "Block of Iron" && searchingForDuke && Settings().dukeRole === 0) {
        chatMessage("&cNo Duke Found, warping out");
        searchingForDuke = false;
        warpoutIndex = 1;
        tas.stopReplay();
        warpOut();
    }
    if (World.getBlockAt(-554, 103, -918).type.getName() === "Hardened Clay" && searchingForDuke && Settings().dukeRole === 0) {
        chatMessage("&cNo Duke Found, warping out");
        searchingForDuke = false;
        warpoutIndex = 1;
        tas.stopReplay();
        warpOut();
    }
    // if (Player.getX() < -523 && Player.getX() > -550 && Player.getZ() < -886 && Player.getZ() > -913 && searchingForDuke && Settings().dukeRole === 0) {
    //     chatMessage("&cNo Duke Found, warping out");
    //     searchingForDuke = false;
    //     warpoutIndex = 1;
    //     tas.stopReplay();
    //     warpOut();
    // }
    if (World.getBlockAt(-297, 81, -516).type.getName() === "Block of Iron" && searchingForBladesoul && warpCooldown++ > 60) {
        chatMessage("&cNo Blade Found, warping out");
        warpCooldown = 0;
        tas.stopReplay();
        warpoutIndex = Settings().dukeRole === 0 ? 4 : 1;
        warpOut();
    }
    if (Player.getX() > -321 && Player.getX() < -268 && Player.getZ() < -494 && Player.getZ() > -543 && searchingForBladesoul && warpCooldown++ > 60) {
        chatMessage("&cNo Blade Found, warping out");
        warpCooldown = 0;
        tas.stopReplay();
        warpoutIndex = Settings().dukeRole === 0 ? 4 : 1;
        warpOut();
    }
});

// Tick pour gérer fin de replay => début attaque
register("tick", () => {
    if (!Settings().dukeEnabled) return;
    if (!Settings().autoKillDuke) return;
    if (pendingAttack === 'duke' && !tas.isReplaying && (Player.getX() < -523 && Player.getX() > -550 && Player.getZ() < -886 && Player.getZ() > -913)) {
        beginDukeAttack();
    }
    if (pendingAttack === 'blade' && !tas.isReplaying && (Player.getX() > -321 && Player.getX() < -268 && Player.getZ() < -494 && Player.getZ() > -543)) {
        beginBladeAttack();
    }
});

register("tick", () => {
    if (!Settings().dukeEnabled) return;
    // check if the player is idle for more than 1 minutes. if so, pause the session
    if (state.startScriptDate && !state.paused) {
        const now = Date.now();
        if (now - state.lastActionTime > 60000) { // 1 minute
            state.paused = true;
            state.pauseTime = now;
            chatMessage("&eSession paused due to inactivity.");
        }
    }
});

function smoothLock(entity) {
    // compute yaw/pitch
    const px = Player.getX(), py = Player.getY() + Player.getPlayer().field_70131_O, pz = Player.getZ();
    const ex = entity.getX(), ey = entity.getY(), ez = entity.getZ();
    const dx = ex - px, dz = ez - pz, dy = ey - py;
    const yaw = Math.atan2(dz, dx) * 180/Math.PI - 90;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const pitch = -Math.atan2(dy, dist) * 180/Math.PI;

    lockPrevYaw = Player.getPlayer().field_70177_z;
    lockPrevPitch = Player.getPlayer().field_70125_A;
    lockTargetYaw = yaw;
    lockTargetPitch = pitch;
    lockStartTime = Date.now();
    isSmoothing = true;
}

// Fonctions d'attaque
function beginDukeAttack() {
    const target = World.getAllEntities()
        .find(e => !e.isDead() && e.name.includes("DukeBarb"));
    if (!target) {
        pendingAttack = null;
        return;
    }
    smoothLock(target);
    attackSpam(true);
}

function beginBladeAttack() {
    const target = World.getAllEntities()
        .find(e => !e.isDead() && e.name.includes("Bladesoul"));
    if (!target) {
        pendingAttack = null;
        return;
    }
    Player.getPlayer().field_70125_A = 90;
    attackSpam(false);
}

let clicked = false;
function attackSpam() {
    // trouve Hyperion
    const idx = Player.getInventory().getItems().slice(0,9)
        .findIndex(i => i && (i.getName().includes("Hyperion") || i.getName().includes("Scylla")));
    if (idx < 0) return chatMessage("Hyperion not found");
    Player.setHeldItemIndex(idx);

    function clickLoop() {
        // if GUI is open, stop
        if (Client.currentGui.get() != null) {
            stopAttack();
            clicked = false;
            return;
        }
        if (pendingAttack) {
            rightClick();
            const delay = 320 + Math.random() * 120;
            attackTimer = setTimeout(clickLoop, delay);
        } else {
            clicked = false;
        }
    }

    if (!clicked) {
        clicked = true;
        setTimeout(() => clickLoop(), 1500);
    }
}

function stopAttack() {
    pendingAttack = null;
    if (attackTimer) clearTimeout(attackTimer);
}

function sendUseItem(itemToSwap, swapBack = true) {
	const index = Player?.getInventory()?.getItems()?.splice(0, 9).findIndex(item => item?.getName()?.includes(itemToSwap))
	if (index < 0 || index > 8) {
        chatMessage("No " + itemToSwap + " Found");
		return;
	} else {
        const previousItem = Player.getHeldItemIndex();
        Player.setHeldItemIndex(index);
        let sleepTime = 120 + Math.floor(Math.random() * 40);
        setTimeout(() => rightClick(), sleepTime);
        if (swapBack){
            setTimeout(() => Player.setHeldItemIndex(previousItem), sleepTime + 120 + Math.floor(Math.random() * 40));
            chatMessage("&a" + itemToSwap + " placed");
        }
    }
}

function searchReset() { searchingForDuke = true; searchingForBladesoul = true; }

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

register("command", (arg1, arg2) => {
    if (arg1 === "setdukekilled") {
        state.kills.duke = parseInt(arg2);
        chatMessage(`&cSet Duke Killed: ${state.kills.duke}`);
    } else {
        chatMessage("&cInvalid command");
    }
}).setName("dukedebug", true).setTabCompletions(["setdukekilled"]);

register("command", (arg) => {
    if (arg === "pause") {
        if (!state.paused) {
            state.paused = true;
            state.pauseTime = Date.now();
            chatMessage("&eSession paused.");
        } else {
            chatMessage("&eSession is already paused.");
        }
    } else if (arg === "resume") {
        if (state.paused) {
            // Adjust totalPausedDuration to account for pause duration
            if (state.pauseTime && state.startScriptDate) {
                const pausedDuration = Date.now() - state.pauseTime;
                state.totalPausedDuration += pausedDuration;
            }
            state.paused = false;
            state.pauseTime = null;
            state.lastActionTime = Date.now();
            chatMessage("&aSession resumed.");
        } else {
            chatMessage("&aSession is not paused.");
        }
    } else {
        // Reset session
        state.startScriptDate = new Date();
        state.kills.duke = 0;
        state.kills.blade = 0;
        state.paused = false;
        state.pauseTime = null;
        state.lastActionTime = Date.now();
        state.totalPausedDuration = 0; // reset paused duration
        // Reset loot counts
        keys = Object.keys(state.loot);
        for (let i = 0; i < keys.length; i++) {
            state.loot[keys[i]].count = 0;
        }
        chatMessage("&aSession started and stats reset.");
    }
}).setName("dukesession", true).setTabCompletions(["pause", "resume", "reset"]);

export function initialize() {
    chatMessage("&aDuke Helper Loaded! Use /duke to start");
}

export function checkForUpdates() {
    axios.get("https://raw.githubusercontent.com/NoxiiT/duke-helper/main/metadata.json")
        .then(response => {
            const metadata = response.data;
            const downloadUrl = "https://github.com/NoxiiT/duke-helper"
            const currentVersion = JSON.parse(FileLib.read("Duke Helper", "metadata.json")).version;
            if (metadata.version !== currentVersion) {
                chatMessage(`A new version of Duke Helper is available: ${metadata.version}`);
                chatMessage(`Download it from: ${downloadUrl}`);
            } else {
                chatMessage("Duke Helper is up to date.");
            }
        })
        .catch(err => {
            console.error("Failed to fetch metadata:", err);
        });
}
