import Settings from "../config.js";
import { getItemIndexOf, leftClick, chatMessage } from "../utils.js";

// Variable to track if the player is ghost blocking
let isGhostBlocking = false;

register("tick", () => {
    // If the player is right-clicking
    if (Keyboard.isKeyDown(Settings().pickSwapKey)) {
        // If no menu is opened
        if (Client.currentGui.get() != null) return;
        // If the player is ghost blocking
        if (isGhostBlocking) return;
        isGhostBlocking = true; // Set the ghost blocking state

        // Swap to the first slot
        let pickaxeSlot = getItemIndexOf("Pickaxe");
        if (pickaxeSlot < 0) {
            pickaxeSlot = getItemIndexOf("Stonk");
        }

        if (pickaxeSlot < 0) {
            chatMessage("No pickaxe found in the hotbar");
            return;
        }
        Player.setHeldItemIndex(parseInt(Settings().ghostSwapSlot)); // Switch to the first slot

        // Wait for 75-100ms, then swap back to the pickaxe slot
        setTimeout(() => {
            Player.setHeldItemIndex(pickaxeSlot); // Switch back to the pickaxe

            // Wait for 10-15ms and then left-click
            setTimeout(() => {
                leftClick(); // Left-click to place a ghost block
                setTimeout(() => {
                    isGhostBlocking = false; // Reset the ghost blocking state
        //         }, Math.floor(Math.random() * 15) + 35); // 20
        //     }, Math.floor(Math.random() * 10) + 10);
        // }, Math.floor(Math.random() * 15) + 15); // 60
                }, Math.floor(Math.random() * 15) + 40); // 20
            }, Math.floor(Math.random() * 10) + 10);
        }, Math.floor(Math.random() * 15) + 15); // 60
    }
});