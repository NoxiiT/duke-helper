import Settings from "../config.js";
import { isInDungeon } from "../utils.js";

// on GUI opened event
register("guiOpened", () => {
    Client.scheduleTask(0, () => {
        const inv = Player.getContainer()
        console.log("Opened GUI: " + inv.getName())
        if ((inv.getName() == "Chest" || inv.getName() == "Large Chest") && Settings().autoCloseChests && isInDungeon()) {
            // close the chest
            console.log("Closing chest")
            Client.scheduleTask(0, () => {
                Client.getMinecraft().field_71439_g.func_71053_j(); // player.closeScreen() in MCP
            });
        }
    });
})