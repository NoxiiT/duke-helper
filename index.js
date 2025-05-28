/// <reference lib="es2015" />

import "./features/AutoGFS"
import "./features/ZeroPingEtherwarp"
import "./features/FireFreezeTimer"
import "./features/SwapGhostblocks"
import "./features/LeftclickEtherwarp"
import { initialize } from "./features/DukeHelper"
import "./features/HoverSecrets"
import "./features/AutoTNT"
import "./features/NoParticleInDungeon"
// import "./features/AutoCloseChests"

let particleLoopActive = false;
let particleLoopTimer = null;

function spawnGuardianCurseParticle() {
    if (!particleLoopActive) return;
    const player = Player.getPlayer();
    if (player) {
        World.particle.spawnParticle(
            "MOB_APPEARANCE",
            Player.getX(),
            Player.getY(),
            Player.getZ(),
            1, 1, 1
        );
    }
    particleLoopTimer = setTimeout(spawnGuardianCurseParticle, 100); // 10 times per second
}

// Register command to start the particle loop
register("command", () => {
    if (particleLoopActive) {
        ChatLib.chat("Particle loop is already running!");
        return;
    }
    particleLoopActive = true;
    ChatLib.chat("Guardian curse particle loop started. Use /stopParticleLoop to stop.");
    spawnGuardianCurseParticle();
}).setName("spawnParticleToPlayer");

// Register command to stop the particle loop
register("command", () => {
    particleLoopActive = false;
    if (particleLoopTimer) {
        clearTimeout(particleLoopTimer);
        particleLoopTimer = null;
    }
    ChatLib.chat("Guardian curse particle loop stopped.");
}).setName("stopParticleLoop");

initialize();