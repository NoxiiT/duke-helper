import Settings from "../config.js";
import { chatMessage, isInDungeon } from "../utils.js";

// [EXPLOSION_NORMAL, EXPLOSION_LARGE, EXPLOSION_HUGE, FIREWORKS_SPARK, WATER_BUBBLE, WATER_SPLASH, WATER_WAKE, SUSPENDED, SUSPENDED_DEPTH, CRIT, CRIT_MAGIC, SMOKE_NORMAL, SMOKE_LARGE, SPELL, SPELL_INSTANT, SPELL_MOB, SPELL_MOB_AMBIENT, SPELL_WITCH, DRIP_WATER, DRIP_LAVA, VILLAGER_ANGRY, VILLAGER_HAPPY, TOWN_AURA, NOTE, PORTAL, ENCHANTMENT_TABLE, FLAME, LAVA, FOOTSTEP, CLOUD, REDSTONE, SNOWBALL, SNOW_SHOVEL, SLIME, HEART, BARRIER, ITEM_CRACK, BLOCK_CRACK, BLOCK_DUST, WATER_DROP, ITEM_TAKE, MOB_APPEARANCE]

register("spawnParticle", (particle, type, event) => {
    if (!Settings().noParticleInDungeon) return;
    if (!isInDungeon()) return;
    // Water-related particles are causing issues when canceled due to Optifine custom colors.
    let typeString = type ? type.toString() : "UNKNOWN";
    if (
        typeString == "WATER_BUBBLE" ||
        typeString == "WATER_SPLASH" ||
        typeString == "WATER_WAKE" ||
        typeString == "DRIP_WATER" ||
        typeString == "WATER_DROP"
    ) {} else if (event) {
        cancel(event);
    }
});