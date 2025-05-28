import Settings from "../config"
let leapAmount = null;
let enderPearl = null;

let refilledInBoss = false;
let playerX = 0;
let playerZ = 0;

let isInSkyblock = false;
let isInDungeon = false;
let dungeonFloor = undefined;
let stats = {};

const checkItems = () => {
	new Thread(() => {
		leapAmount = null;
		enderPearl = null;

		Player.getInventory().getItems().slice(0, 44).forEach((item, i) => {
			if (item !== null) {
				if (item.getName().includes("Spirit Leap") || item.getName() == "Spirit Leap")
					leapAmount = item.getStackSize();

				if (item.getName().includes("Ender Pearl") || item.getName() == "Ender Pearl")
					enderPearl = item.getStackSize();
			}
		});
	}).start();
}

const refill = new Thread(() => {
	checkItems();

	Thread.sleep(100);

	ChatLib.chat("&aGFS >> &7Refilling: &3" + (16 - leapAmount) + "&7 Spirit Leap, &3" + (16 - enderPearl) + "&7 Ender Pearl&f");

	let quantity = 0;
	if (leapAmount !== null && leapAmount < 16) {
		quantity = 16 - leapAmount;
		ChatLib.command("gfs spirit leap " + quantity);
		Thread.sleep(2000);
	}

	// checkItems();

	quantity = 0;
	if (enderPearl !== null && enderPearl < 16) {
		quantity = 16 - enderPearl;
		ChatLib.command("gfs ender pearl " + quantity);
	}
});

register("command", () => {
	refill.start();
}).setName("refill", true);

register("step", () => {
	if (!Settings().autoGFS) return;
	isInSkyblock = Scoreboard.getTitle()?.removeFormatting().includes("SKYBLOCK") || Scoreboard.getTitle()?.removeFormatting().includes("SKIBLOCK");

    if (!isInSkyblock) {
		stats = {};
		isInDungeon = false;
		dungeonFloor = undefined;
		return;
    }

	stats["Area"] = undefined;
    stats["Dungeon"] = undefined;

    if (World.isLoaded() && TabList.getNames()) {
      	TabList.getNames().forEach((n) => {
			n = ChatLib.removeFormatting(n);
			if (!n.includes(": ")) return;
			if (n.includes('Secrets Found')) {
				if (n.includes('%')) {
					stats["Secrets Found%"] = n.split(": ")[1];
				} else {
					stats["Secrets Found"] = n.split(": ")[1];
				}
			} else {
				stats[n.split(": ")[0].trim()] = n.split(": ")[1].trim();
			}
      	});
    }

    if (stats["Dungeon"]) {
    	isInDungeon = true;
    }

	if (isInDungeon && playerX > -10 && playerZ > -10 && !refilledInBoss) {
		refill.start();
		refilledInBoss = true;

		ChatLib.chat("&aGFS >> &7Refilling in boss room");
	}
	
	playerX = Player.getX();
	playerZ = Player.getZ();
}).setFps(1);

register("worldLoad", () => {
	refilledInBoss = false;
	isInDungeon = false;
	dungeonFloor = undefined;
	stats = {};
});