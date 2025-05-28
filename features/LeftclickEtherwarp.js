import Settings from "../config.js";

const sneakKeyBind = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i());
const attackKey = Client.getMinecraft().field_71474_y.field_74312_F; // Accessing attack key directly from MCP mappings

// Variable to track if the attack key is being held
let attackKeyHeld = false;

// Check for attack keypress periodically
register("tick", () => {
    if (!Settings().leftClickEtherwarp) return;
    // If attack key is pressed and was not already held
    if (attackKey.func_151470_d()) {
        if (attackKeyHeld) return; // Prevent spamming while the key is held
        attackKeyHeld = true;

        // Check if the player is holding an item named "Aspect of the Void"
        const itemName = Player.getHeldItem()?.getName();
        if (!itemName || !itemName.includes("Aspect of the Void")) return;

        // Hold Shift
        let sneakState = sneakKeyBind.isKeyDown();
        sneakKeyBind.setState(true); // Simulate holding the sneak key

        // Simulate a right click after 20-35ms
        setTimeout(() => {
            Client.getMinecraft().field_71442_b.func_78769_a(Client.getMinecraft().field_71439_g, Client.getMinecraft().field_71441_e, Client.getMinecraft().field_71439_g.func_71045_bC());

            // Release Shift after 10-20ms
            setTimeout(() => {
                sneakKeyBind.setState(sneakState); // Restore the sneak key state
            }, Math.floor(Math.random() * 5) + 10);
        }, Math.floor(Math.random() * 10) + 20);
    } else {
        // Reset the attack key held state when the key is released
        attackKeyHeld = false;
    }
});