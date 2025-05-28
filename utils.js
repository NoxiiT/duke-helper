let dukeHealth = "70M";
let dukeMaxHealth = "70M";
let dukeFound = false;

let bladeHealth = "50M";
let bladeMaxHealth = "50M";
let bladeFound = false;

import Settings from "./config.js";

export function renderDukeHealth() {
    if (!dukeFound) return;
    if (!Settings().displayHealth) return;
    if (dukeHealth === 0 || dukeMaxHealth === 0) return;
    if (typeof dukeHealth !== "string") return;
    if (!dukeHealth.includes("M") && !dukeHealth.includes("K") && !dukeHealth.includes("B")) return;

    let x = 0;
    let y = 0;

    switch (Settings().healthDisplayPosition) {
        case 0:
            x = Renderer.screen.getWidth() / 4;
            y = 10;
            break;
        case 1:
            x = Renderer.screen.getWidth() / 4 * 3;
            y = 10;
            break;
        case 2:
            x = Renderer.screen.getWidth() / 4;
            y = Renderer.screen.getHeight() - 30;
            break;
        case 3:
            x = Renderer.screen.getWidth() / 4 * 3;
            y = Renderer.screen.getHeight() - 30;
            break;
        case 4:
            x = Renderer.screen.getWidth() / 2;
            y = 35;
            break;
    }

    // Center x position
    x -= (Renderer.getStringWidth(`Duke HP: ${dukeHealth} / ${dukeMaxHealth}`)) / 2;

    let dukeHealthWithSym = dukeHealth;
    let dukeMaxHealthWithSym = dukeMaxHealth;
    let dukeMaxHealthFloat = 0;
    let dukeHealthFloat = 0;

    // Check si c'est M, K ou B 
    let symboles = ["K", "M", "B"];
    for (let i = 0; i < symboles.length; i++) {
        if (dukeMaxHealth?.includes(symboles[i])) {
            dukeMaxHealthFloat = parseFloat(dukeMaxHealth.replace(symboles[i], "")) * Math.pow(1000, i + 1);
        }
        if (dukeHealth?.includes(symboles[i])) {
            dukeHealthFloat = parseFloat(dukeHealth.replace(symboles[i], "")) * Math.pow(1000, i + 1);
        }
    }

    // Calcul du pourcentage de vie
    const healthPercentage = dukeHealthFloat / dukeMaxHealthFloat;

    if (isNaN(healthPercentage)) {
        dukeHealth = "70M";
        dukeMaxHealth = "70M";
        return;
    }

    // Largeur de la barre de vie
    let barWidth = 100;
    let barHeight = 3;
    const borderRadius = Math.min(4, barHeight / 2);

    // Nouvelle palette de couleurs brown/black
    const backgroundColor = Renderer.color(84, 66, 48, 230);  // Marron foncé #544230
    const borderColor = Renderer.color(121, 97, 75, 255);    // Marron semi-foncé #79614b
    const textColor = Renderer.color(255, 240, 200, 255);    // Crème pour texte
    const barBackgroundColor = Renderer.color(58, 45, 33, 190); // Marron très foncé pour fond de barre

    // Variables pour le smoothing
    if (typeof renderDukeHealth.lastHealthPercentage === 'undefined') {
        renderDukeHealth.lastHealthPercentage = healthPercentage;
    }
    if (typeof renderDukeHealth.lastUpdate === 'undefined') {
        renderDukeHealth.lastUpdate = Date.now();
    }

    // Calcul du smoothing (interpolation linéaire)
    const now = Date.now();
    const deltaTime = now - renderDukeHealth.lastUpdate;
    const smoothingFactor = Math.min(deltaTime / 200, 1);
    const smoothedHealthPercentage = renderDukeHealth.lastHealthPercentage + 
                                   (healthPercentage - renderDukeHealth.lastHealthPercentage) * smoothingFactor;

    // Mise à jour des valeurs pour la prochaine frame
    renderDukeHealth.lastHealthPercentage = smoothedHealthPercentage;
    renderDukeHealth.lastUpdate = now;

    let healthTextSize = Renderer.getStringWidth(`Duke HP: ${dukeHealthWithSym} / ${dukeMaxHealthWithSym}`);
    if (barWidth > healthTextSize) {
        barWidth = healthTextSize;
    }

    // Dessin du fond du cadre (style brown/black)
    Renderer.drawRect(backgroundColor, x - 5, y - 5, healthTextSize + 10, 28);
    
    // Bordures stylisées
    Renderer.drawRect(borderColor, x - 5, y - 5, healthTextSize + 10, 1); // Top border
    Renderer.drawRect(borderColor, x - 5, y + 23, healthTextSize + 10, 1); // Bottom border
    Renderer.drawRect(borderColor, x - 5, y - 5, 1, 28); // Left border
    Renderer.drawRect(borderColor, x + healthTextSize + 5, y - 5, 1, 28); // Right border

    // Coin décoratifs
    const cornerSize = 3;
    const highlightColor = Renderer.color(201, 165, 133, 255); // Marron clair #c9a585
    Renderer.drawRect(highlightColor, x - 5, y - 5, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 5, y - 5, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5 - cornerSize + 1, y - 5, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5, y - 5, 1, cornerSize);
    Renderer.drawRect(highlightColor, x - 5, y + 23, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 5, y + 23 - cornerSize + 1, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5 - cornerSize + 1, y + 23, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5, y + 23 - cornerSize + 1, 1, cornerSize);

    // Affichage du texte de vie (couleur crème)
    Renderer.drawString(`§fDuke HP: §f${dukeHealthWithSym} / §f${dukeMaxHealthWithSym}`, x, y);

    // Affichage de la barre de vie avec bords arrondis
    const barY = y + 15;
    
    // Fond de la barre (marron très foncé) avec bords arrondis
    drawRoundedBar(barBackgroundColor, x, barY, barWidth, barHeight, borderRadius);
    
    // Barre de vie ajustée avec smoothing
    const currentWidth = barWidth * smoothedHealthPercentage;
    if (currentWidth > 0) {
        // Couleur de la barre de vie (dégradé de marron)
        const startColor = [160, 130, 103]; // Marron #a08267
        const endColor = [201, 165, 133];   // Marron clair #c9a585
        const r = Math.floor(startColor[0] + (endColor[0] - startColor[0]) * smoothedHealthPercentage);
        const g = Math.floor(startColor[1] + (endColor[1] - startColor[1]) * smoothedHealthPercentage);
        const b = Math.floor(startColor[2] + (endColor[2] - startColor[2]) * smoothedHealthPercentage);
        
        const barColor = Renderer.color(r, g, b, 255);
        drawRoundedBar(barColor, x, barY, currentWidth, barHeight, borderRadius);
    }
}

function drawRoundedBar(color, x, y, width, height, radius) {
    if (width <= 0 || height <= 0) return;
    
    // Ajuster le rayon si nécessaire
    radius = Math.min(radius, height / 2, width / 2);
    
    // Parties gauches
    Renderer.drawCircle(color, x + radius, y + radius, radius, 180, 90); // Haut-gauche
    Renderer.drawCircle(color, x + radius, y + height - radius, radius, 90, 90); // Bas-gauche
    
    // Parties droites
    Renderer.drawCircle(color, x + width - radius, y + radius, radius, 270, 90); // Haut-droit
    Renderer.drawCircle(color, x + width - radius, y + height - radius, radius, 0, 90); // Bas-droit
    
    // Centre horizontal
    Renderer.drawRect(color, x + radius, y, width - 2 * radius, height);
    
    // Centre vertical gauche
    Renderer.drawRect(color, x, y + radius, radius, height - 2 * radius);
    
    // Centre vertical droit
    Renderer.drawRect(color, x + width - radius, y + radius, radius, height - 2 * radius);
    
    // Lignes supérieure/inférieure si nécessaire
    if (width > 2 * radius) {
        Renderer.drawRect(color, x + radius, y, width - 2 * radius, radius); // Haut
        Renderer.drawRect(color, x + radius, y + height - radius, width - 2 * radius, radius); // Bas
    }
}

// Exemple de mise à jour des points de vie du Duke (dans une fonction de mise à jour de l'état)
export function updateDukeHealth(dukeEntity) {
	if (!dukeEntity) return;
    dukeHealth = "70M";
    // §e﴾ §8[§7Lv200§8] §l§8§lBarbarian Duke X§r §a70M§f/§a70M§c❤ §e﴿
    if (dukeEntity?.name.includes("§r §a")) {
        dukeHealth = dukeEntity?.name.split("§r §a")[1].split("§f/")[0];
    }
    if (dukeEntity?.name.includes("§r §e")) {
        dukeHealth = dukeEntity?.name.split("§r §e")[1].split("§f/")[0];
    }
    dukeMaxHealth = dukeEntity?.name.split("§f/§a")[1].split("§c❤")[0] || "70M";
}

export function renderBladeHealth() {
    if (!bladeFound) return;
    if (!Settings().displayHealth) return;
    if (bladeHealth === 0 || bladeMaxHealth === 0) return;
    if (typeof bladeHealth !== "string") return;
    if (!bladeHealth.includes("M") && !bladeHealth.includes("K") && !bladeHealth.includes("B")) return;

    let x = 0;
    let y = 0;
    switch (Settings().healthDisplayPosition) {
        case 0:
            x = Renderer.screen.getWidth() / 4;
            y = 10;
            break;
        case 1:
            x = Renderer.screen.getWidth() / 4 * 3;
            y = 10;
            break;
        case 2:
            x = Renderer.screen.getWidth() / 4;
            y = Renderer.screen.getHeight() - 30;
            break;
        case 3:
            x = Renderer.screen.getWidth() / 4 * 3;
            y = Renderer.screen.getHeight() - 30;
            break;
        case 4:
            x = Renderer.screen.getWidth() / 2;
            y = 35;
            break;
    }

    // Center x position
    x -= (Renderer.getStringWidth(`Blade HP: ${bladeHealth} / ${bladeMaxHealth}`)) / 2;

    let bladeHealthWithSym = bladeHealth;
    let bladeMaxHealthWithSym = bladeMaxHealth;
    let bladeMaxHealthFloat = 0;
    let bladeHealthFloat = 0;

    // Check si c'est M, K ou B
    let symboles = ["K", "M", "B"];
    for (let i = 0; i < symboles.length; i++) {
        if (bladeMaxHealth?.includes(symboles[i])) {
            bladeMaxHealthFloat = parseFloat(bladeMaxHealth.replace(symboles[i], "")) * Math.pow(1000, i + 1);
        }
        if (bladeHealth?.includes(symboles[i])) {
            bladeHealthFloat = parseFloat(bladeHealth.replace(symboles[i], "")) * Math.pow(1000, i + 1);
        }
    }

    // Calcul du pourcentage de vie
    const healthPercentage = bladeHealthFloat / bladeMaxHealthFloat;
    if (isNaN(healthPercentage)) {
        bladeHealth = "50M";
        bladeMaxHealth = "50M";
        return;
    }

    // Largeur de la barre de vie
    let barWidth = 100;
    let barHeight = 3;
    const borderRadius = Math.min(4, barHeight / 2);

    // Nouvelle palette de couleurs brown/black
    const backgroundColor = Renderer.color(84, 66, 48, 230);  // Marron foncé #544230
    const borderColor = Renderer.color(121, 97, 75, 255);    // Marron semi-foncé #79614b
    const textColor = Renderer.color(255, 240, 200, 255);    // Crème pour texte
    const barBackgroundColor = Renderer.color(58, 45, 33, 190); // Marron très foncé pour fond de barre

    // Variables pour le smoothing
    if (typeof renderBladeHealth.lastHealthPercentage === 'undefined') {
        renderBladeHealth.lastHealthPercentage = healthPercentage;
    }
    if (typeof renderBladeHealth.lastUpdate === 'undefined') {
        renderBladeHealth.lastUpdate = Date.now();
    }

    // Calcul du smoothing (interpolation linéaire)
    const now = Date.now();
    const deltaTime = now - renderBladeHealth.lastUpdate;
    const smoothingFactor = Math.min(deltaTime / 200, 1);
    const smoothedHealthPercentage = renderBladeHealth.lastHealthPercentage +
                                   (healthPercentage - renderBladeHealth.lastHealthPercentage) * smoothingFactor;

    // Mise à jour des valeurs pour la prochaine frame
    renderBladeHealth.lastHealthPercentage = smoothedHealthPercentage;
    renderBladeHealth.lastUpdate = now;

    let healthTextSize = Renderer.getStringWidth(`Blade HP: ${bladeHealthWithSym} / ${bladeMaxHealthWithSym}`);
    if (barWidth > healthTextSize) {
        barWidth = healthTextSize;
    }

    // Dessin du fond du cadre (style brown/black)
    Renderer.drawRect(backgroundColor, x - 5, y - 5, healthTextSize + 10, 28);

    // Bordures stylisées
    Renderer.drawRect(borderColor, x - 5, y - 5, healthTextSize + 10, 1); // Top border
    Renderer.drawRect(borderColor, x - 5, y + 23, healthTextSize + 10, 1); // Bottom border
    Renderer.drawRect(borderColor, x - 5, y - 5, 1, 28); // Left border
    Renderer.drawRect(borderColor, x + healthTextSize + 5, y - 5, 1, 28); // Right border

    // Coin décoratifs
    const cornerSize = 3;
    const highlightColor = Renderer.color(201, 165, 133, 255); // Marron clair #c9a585
    Renderer.drawRect(highlightColor, x - 5, y - 5, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 5, y - 5, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5 - cornerSize + 1, y - 5, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5, y - 5, 1, cornerSize);
    Renderer.drawRect(highlightColor, x - 5, y + 23, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 5, y + 23 - cornerSize + 1, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5 - cornerSize + 1, y + 23, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + healthTextSize + 5, y + 23 - cornerSize + 1, 1, cornerSize);

    // Affichage du texte de vie (couleur crème)
    Renderer.drawString(`§fBlade HP: §f${bladeHealthWithSym} / §f${bladeMaxHealthWithSym}`, x, y);

    // Affichage de la barre de vie avec bords arrondis
    const barY = y + 15;

    // Fond de la barre (marron très foncé) avec bords arrondis
    drawRoundedBar(barBackgroundColor, x, barY, barWidth, barHeight, borderRadius);

    // Barre de vie ajustée avec smoothing
    const currentWidth = barWidth * smoothedHealthPercentage;
    if (currentWidth > 0) {
        // Couleur de la barre de vie (dégradé de marron)
        const startColor = [160, 130, 103]; // Marron #a08267
        const endColor = [201, 165, 133];   // Marron clair #c9a585
        const r = Math.floor(startColor[0] + (endColor[0] - startColor[0]) * smoothedHealthPercentage);
        const g = Math.floor(startColor[1] + (endColor[1] - startColor[1]) * smoothedHealthPercentage);
        const b = Math.floor(startColor[2] + (endColor[2] - startColor[2]) * smoothedHealthPercentage);

        const barColor = Renderer.color(r, g, b, 255);
        drawRoundedBar(barColor, x, barY, currentWidth, barHeight, borderRadius);
    }
}

export function updateBladeHealth(bladeEntity) {
    if (!bladeEntity) return;
    bladeHealth = "50M";
    // §e﴾ §8[§7Lv200§8] §l§8§lBladesoul§r §a50M§f/§a50M§c❤ §e﴿
    if (bladeEntity?.name.includes("§r §a")) {
        bladeHealth = bladeEntity?.name.split("§r §a")[1].split("§f/")[0];
    }
    if (bladeEntity?.name.includes("§r §e")) {
        bladeHealth = bladeEntity?.name.split("§r §e")[1].split("§f/")[0];
    }
    bladeMaxHealth = bladeEntity?.name.split("§f/§a")[1].split("§c❤")[0] || "50M";
}

export function renderStatusOverlay(phase, paused, kills, currentTarget, loot, startedDate, position = 1, totalPausedDuration = 0, pauseTime = null) {
    if (!phase || !kills || !currentTarget) return;

    let now = Date.now();
    let elapsedMs;
    if (paused && pauseTime) {
        elapsedMs = pauseTime - startedDate - totalPausedDuration;
    } else {
        elapsedMs = now - startedDate - totalPausedDuration;
    }
    if (elapsedMs < 0) elapsedMs = 0;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
    const elapsedStr = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`;

    const positions = [
        { x: 10, y: 10 },                                                               // Haut gauche
        { x: Renderer.screen.getWidth() - 160, y: 10 },                                 // Haut droit
        { x: 10, y: Renderer.screen.getHeight() - 100 },                                // Bas gauche
        { x: Renderer.screen.getWidth() - 160, y: Renderer.screen.getHeight() - 100 },  // Bas droit
        { x: Renderer.screen.getWidth() / 2 - 100, y: 35 }                              // Centre haut
    ];

    const pos = positions[position] || positions[0];
    let x = pos.x;
    let y = pos.y;

    // Nouvelle palette de couleurs brown/black
    const backgroundColor = Renderer.color(84, 66, 48, 230);    // Marron foncé #544230
    const borderColor = Renderer.color(121, 97, 75, 255);       // Marron semi-foncé #79614b
    const textColor = Renderer.color(255, 240, 200, 255);       // Crème pour texte
    const highlightColor = Renderer.color(201, 165, 133, 255);  // Marron clair #c9a585
    const separatorColor = Renderer.color(121, 97, 75, 150);    // Marron semi-foncé transparent

    let totalValue = 0;
    for (const item in loot) {
        if (loot[item].count) {
            totalValue += loot[item].count * loot[item].price;
        }
    }
    const totalValueStr = formatNumber(totalValue);
    const coinsPerHour = Math.floor((totalValue / elapsedMs) * 3600000);
    const coinsPerHourStr = formatNumber(coinsPerHour);

    // Données à afficher avec nouvelle palette
    const lines = [
        { label: "§6Info", value: "" },
        { label: "§8----------------------", value: "" },
        { label: "§6Role:", value: `§f${phase.toUpperCase()}` },  // Marron clair
        { label: "§6State:", value: `§f${paused ? "§cPAUSED" : "§aACTIVE"}` },
        { label: "§6Duke Kills:", value: `§f${kills.duke}` },
        { label: "§6Blade Kills:", value: `§f${kills.blade}` },
        { label: "§6Target:", value: `§${currentTarget === 'duke' ? 'a' : 'c'}${currentTarget.toUpperCase()}` },
        { label: "§6Time:", value: `§f${elapsedStr}` },
        { label: "§8----------------------", value: "" },
        { label: "§cUrchin:", value: `§f${loot["MAGMA URCHIN"].count}` },
        { label: "§eFlaming Fist:", value: `§f${loot["FLAMING FIST"].count}` },
        { label: "§6Leather Cloth:", value: `§f${loot["LEATHER CLOTH"].count}` },
        { label: "§eRagnarock Axe:", value: `§f${loot["RAGNAROCK AXE"].count}` },
        { label: "§6Coins/h (est.):", value: "§f$" + coinsPerHourStr },
        { label: "§6Total Value:", value: "§f$" + totalValueStr },
    ];

    // Taille
    const lineHeight = Renderer.getFontRenderer().field_78288_b;
    const padding = 6;
    let maxWidth = 0;

    lines.forEach(line => {
        const lineWidth = Renderer.getStringWidth(line.label + " " + line.value);
        if (lineWidth > maxWidth) maxWidth = lineWidth;
    });

    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;

    // Fond + Bordures - style brown/black
    Renderer.drawRect(backgroundColor, x, y, boxWidth, boxHeight);
    
    // Bordures stylisées
    Renderer.drawRect(borderColor, x - 1, y - 1, boxWidth + 2, 1); // Top border
    Renderer.drawRect(borderColor, x - 1, y + boxHeight, boxWidth + 2, 1); // Bottom border
    Renderer.drawRect(borderColor, x - 1, y, 1, boxHeight); // Left border
    Renderer.drawRect(borderColor, x + boxWidth, y, 1, boxHeight); // Right border

    // Coin décoratifs
    const cornerSize = 3;
    Renderer.drawRect(highlightColor, x - 1, y - 1, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 1, y - 1, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + boxWidth - cornerSize + 1, y - 1, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + boxWidth, y - 1, 1, cornerSize);
    Renderer.drawRect(highlightColor, x - 1, y + boxHeight, cornerSize, 1);
    Renderer.drawRect(highlightColor, x - 1, y + boxHeight - cornerSize + 1, 1, cornerSize);
    Renderer.drawRect(highlightColor, x + boxWidth - cornerSize + 1, y + boxHeight, cornerSize, 1);
    Renderer.drawRect(highlightColor, x + boxWidth, y + boxHeight - cornerSize + 1, 1, cornerSize);

    // Séparateur graphique au lieu de texte
    let separatorY = y + padding + lineHeight + padding/2;
    Renderer.drawRect(separatorColor, x + padding, separatorY, boxWidth - padding*2, 1);

    separatorY = y + padding + 8 * lineHeight + padding/2;
    Renderer.drawRect(separatorColor, x + padding, separatorY, boxWidth - padding*2, 1);

    // Texte
    lines.forEach((line, i) => {
        const yOffset = y + padding + i * lineHeight;
        // On skip la ligne de séparation texte
        if (line.label === "§8----------------------") return;
        if (i === 0) {
            // On affiche le titre "Info" en haut au centre
            Renderer.drawStringWithShadow(line.label, x + boxWidth / 2 - Renderer.getStringWidth(line.label) / 2, yOffset);
        }
        
        if (line.value === "") {
            // Ligne vide (séparateur) - déjà géré graphiquement
        } else {
            Renderer.drawStringWithShadow(line.label, x + padding, yOffset);
            Renderer.drawStringWithShadow(line.value, x + boxWidth - padding - Renderer.getStringWidth(line.value), yOffset);
        }
    });
}

const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag")
rightClickMethod.setAccessible(true)
export function rightClick() {
	rightClickMethod.invoke(Client.getMinecraft())
}

const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af")
leftClickMethod.setAccessible(true)
export function leftClick() {
    leftClickMethod.invoke(Client.getMinecraft())
}

export function renderCenter(text, scale) {
    Renderer.scale(scale);
    const x = (Renderer.screen.getWidth() / scale - Renderer.getStringWidth(text)) / 2;
    const y = Renderer.screen.getHeight() / scale / 2;
    Renderer.drawStringWithShadow(text, x, y);
}

export function chatMessage(message) {
	ChatLib.chat("&c[&6&lDuke Helper&r&c] &6>>> &r" + message);
}

const sounds = [
    { sound: "random.successful_hit", volume: 1.0, pitch: 1.0 },
	{ sound: "random.successful_hit", volume: 1.0, pitch: 1.0 },
	{ sound: "random.successful_hit", volume: 1.0, pitch: 1.0 }
];

export function playSounds() {
    sounds.forEach((sound, index) => {
        setTimeout(() => {
            World.playSound(sound.sound, sound.volume, sound.pitch);
        }, index * 200);
    });
}

// Check if the player has a specific item in their hotbar
export function getItemIndexOf(item) {
    if (!Player.getPlayer()) return -1;
    for (let i = 0; i < 9; i++) {
        if (Player.getInventory()?.getStackInSlot(i)?.name?.includes(item)) {
            return i;
        }
    }
    return -1;
}

export function getItemIndexOfArray(items) {
    if (!Player.getPlayer()) return -1;
    for (let i = 0; i < 9; i++) {
        if (items.some(item => Player.getInventory()?.getStackInSlot(i)?.name?.includes(item))) {
            return i;
        }
    }
    return -1;
}

export function useHotbarItem(item, shouldSwapBack = true, button=0) {
    const index = getItemIndexOf(item);
    if (index === -1) return;
    const previousItem = Player.getHeldItemIndex();
    Player.setHeldItemIndex(index);
    if (index !== previousItem) {
        setTimeout(() => {
            button == 0 ? rightClick() : leftClick();
            if (shouldSwapBack) {
                setTimeout(() => Player.setHeldItemIndex(previousItem), Math.random() * 35 + 15);
            }
        }, Math.random() * 30 + 20);
    } else {
        button == 0 ? rightClick() : leftClick();
    }
}

// Thanks Bloom
export const getScoreboard = (formatted=false) => {
    if (!World.getWorld()) return null
    let sb = Scoreboard.getLines().map(a => a.getName())
    if (formatted) return Scoreboard.getLines()
    return sb.map(a => ChatLib.removeFormatting(a))
}

export function isInDungeon() {
    // Check the scoreboard for "The Catacombs"
    const scoreboard = getScoreboard();
    for (let i = 0; i < scoreboard.length; i++) {
        if (scoreboard[i].includes("The Catac")) return true;
    }
    return false;
}

function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let isSmoothing = false;
let smoothStartTime = 0;
let smoothDuration = 0;
let startYaw = 0;
let startPitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let smoothCallback = null;

// Enregistrement unique de l'event handler
register('renderOverlay', () => {
    if (!isSmoothing) return;

    const elapsed = Date.now() - smoothStartTime;
    const t = Math.min(elapsed / smoothDuration, 1);
    
    // Easing cubic pour mouvement naturel
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    // Interpolation angulaire
    const currentYaw = startYaw + easedT * angleDifference(targetYaw, startYaw);
    const currentPitch = startPitch + easedT * (targetPitch - startPitch);

    // Application de la rotation
    const player = Player.getPlayer();
    player.field_70177_z = normalizeAngle(currentYaw);
    player.field_70125_A = currentPitch;

    if (t >= 1) {
        finishSmoothAim();
    }
});

export function smoothAimTo(targetPos, duration = 350, callback = null) {
    if (isSmoothing || !targetPos) return;

    const player = Player.getPlayer();
    const playerPos = {
        x: Player.getX(),
        y: Player.getY() + player.field_70131_O,
        z: Player.getZ()
    };

    // Calcul sécurisé des deltas
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dy = targetPos.y - playerPos.y;

    // Éviter la division par zéro
    if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) {
        targetYaw = player.field_70177_z; // Conserver l'angle actuel
    } else {
        targetYaw = (Math.atan2(dz, dx) * 180 / Math.PI - 90) % 360;
    }

    const dist2D = Math.sqrt(dx*dx + dz*dz);
    
    // Gérer le cas vertical pur
    if (dist2D < 0.001) {
        targetPitch = dy > 0 ? -90 : 90;
    } else {
        targetPitch = -(Math.atan2(dy, dist2D) * 180 / Math.PI);
    }

    // Normalisation garantie
    startYaw = normalizeAngle(player.field_70177_z);
    startPitch = clampAngle(player.field_70125_A);
    targetYaw = normalizeAngle(targetYaw);
    targetPitch = clampAngle(targetPitch);

    smoothDuration = Math.max(duration, 50); // Minimum 50ms
    smoothStartTime = Date.now();
    smoothCallback = callback;
    isSmoothing = true;
}

function clampAngle(angle) {
    return Math.max(-90, Math.min(90, angle)); // Pitch limité entre -90 et 90
}

function finishSmoothAim() {
    isSmoothing = false;
    
    // Force les angles finaux
    const player = Player.getPlayer();
    player.field_70177_z = normalizeAngle(targetYaw);
    player.field_70125_A = targetPitch;
    
    if (smoothCallback) smoothCallback();
}

// Helper functions
function normalizeAngle(angle) {
    return ((angle % 360) + 540) % 360 - 180;
}

function angleDifference(target, current) {
    const diff = ((target - current + 540) % 360) - 180;
    return diff < -180 ? diff + 360 : diff;
}

export function changeDukeFound(state) {
    dukeFound = state;
}

export function changeBladeFound(state) {
    bladeFound = state;
}

export { dukeFound, bladeFound };