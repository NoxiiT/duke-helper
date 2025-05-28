import Settings from "../config.js";
import { renderCenter, getItemIndexOf, rightClick, chatMessage } from "../utils.js";

let countDown = 0;
let countDownNow = false;
let lastDisplayTime_fireFreeze = new Date();

register("worldLoad", () => {
    countDown = 0;
    countDownNow = false;
});

register("renderOverlay", () => {
    if (!countDownNow) return;
    if (new Date().getTime() < countDown - 2500) {
        renderCenter("&c" + Math.ceil((countDown - new Date().getTime() - 2500) / 1000), 3);
    } else if (new Date().getTime() < countDown) {
        renderCenter("&cNOW", 4);
    } else if (new Date().getTime() - lastDisplayTime_fireFreeze.getTime() > 2500) {
        countDownNow = false;
    }
});

register("chat", (event) => {
    if (!Settings().fireFreezeTimer && !Settings().autoFireFreeze) return;
    const msg = ChatLib.getChatMessage(event);
    if (msg.includes("The Professor: Oh? You found my Guardians' one weakness?")) {
        countDownNow = true;
        countDown = new Date().getTime() + 7500;
        if (Settings().autoFireFreeze) {
            chatMessage("Fire Freezing...");
            setTimeout(() => {
                fireFreeze = getItemIndexOf("Fire Freeze Staff");
                if (fireFreeze === -1) {
                    chatMessage("Fire Freeze Staff not found in inventory.");
                    return;
                }
                Player.setHeldItemIndex(fireFreeze);
                setTimeout(() => {
                    rightClick();
                }, Math.random() * 10 + 10);
            }, 5300 + Math.random() * 100);
        }
    }
});