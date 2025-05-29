import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("Duke Helper", "data/settings.json")

config
    .addToggle({
        configName: "dukeEnabled",
        title: "Enabled",
        description: "Enable or disable the mod",
        category: "General",
        subcategory: ""
    })
    .addDropDown({
        configName: "dukeRole",
        title: "Role",
        description: "Select your role",
        category: "General",
        subcategory: "",
        options: ["Leader", "Member"],
        value: 1
    })
    // .addSlider({
    //     configName: "CPS_MIN",
    //     title: "CPS Min",
    //     description: "Minimum CPS to spam the Hyperion",
    //     category: "General",
    //     subcategory: "CPS",
    //     options: [1, 20],
    //     value: 2
    // })
    // .addSlider({
    //     configName: "CPS_MAX",
    //     title: "CPS Max",
    //     description: "Maximum CPS to spam the Hyperion",
    //     category: "General",
    //     subcategory: "CPS",
    //     options: [1, 20],
    //     value: 5
    // })
    .addSwitch({
        configName: "enableUseItem",
        title: "Use Item",
        description: "Use an item when Duke is found",
        category: "General",
        subcategory: "Use Item"
    })
    // .addToggle({
    //     configName: "autoKillDuke",
    //     title: "Auto Kill Duke & Blade",
    //     description: "Automatically kill Duke & Blade",
    //     category: "General",
    //     subcategory: "Auto",
    //     shouldShow(data) {
    //         return data.dukeEnabled
    //     }
    // })
    .addToggle({
        configName: "autoTAS",
        title: "Auto TAS Replay",
        description: "Automatically start the TAS replay",
        category: "General",
        subcategory: "Auto",
        shouldShow(data) {
            return data.dukeEnabled
        }
    })
    .addTextInput({
        configName: "itemToUse",
        title: "Item to Use",
        description: "Item to use when Duke is found (leave empty to not use any item)",
        category: "General",
        subcategory: "Use Item",
        placeholder: "Flare",
        value: "Flare",
        shouldShow(data) {
            return data.enableUseItem
        }
    })
    .addSlider({
        configName: "useItemDelay",
        title: "Use Item Delay",
        description: "Delay in milliseconds before using the item",
        category: "General",
        subcategory: "Use Item",
        options: [1000, 3000],
        value: 1,
        shouldShow(data) {
            return data.enableUseItem
        }
    })
    .addSwitch({
        configName: "displayHealth",
        title: "Display Health",
        description: "Display the health of the Duke and Blade",
        category: "General",
        subcategory: "Display"
    })
    .addSelection({
        configName: "healthDisplayPosition",
        title: "Health Display Position",
        description: "Position of the health display",
        category: "General",
        subcategory: "Display",
        options: ["Top Left", "Top Right", "Bottom Left", "Bottom Right", "Center"],
        value: 1,
        shouldShow(data) {
            return data.displayHealth
        }
    })
    .addSelection({
        configName: "infoDisplayPosition",
        title: "Info Display Position",
        description: "Position of the info display",
        category: "General",
        subcategory: "Display",
        options: ["Top Left", "Top Right", "Bottom Left", "Bottom Right", "Center"],
        value: 1,
    })
    .addSwitch({
        configName: "enableEspDuke",
        title: "ESP Duke",
        description: "Enable ESP for Duke",
        category: "General",
        subcategory: "ESP"
    })
    .addSlider({
        configName: "lobbySwapDelay",
        title: "Lobby Swap Delay",
        description: "Delay in milliseconds before swapping back to kuudra",
        category: "Delay",
        subcategory: "",
        options: [3000, 5000],
        value: 1
    })
    .addSlider({
        configName: "netherWarpDelay",
        title: "Nether Warp Delay",
        description: "Delay in milliseconds before warping to nether",
        category: "Delay",
        subcategory: "",
        options: [10, 50],
        value: 1
    })
    .addSlider({
        configName: "kuudraWarpDelay",
        title: "Kuudra Warp Delay",
        description: "Delay in milliseconds before warping to kuudra when warped in as a member",
        category: "Delay",
        subcategory: "",
        options: [50, 200],
        value: 1
    })
    .addSlider({
        configName: "tasReplayDelayDuke",
        title: "TAS Replay Delay Duke",
        description: "Delay in milliseconds before starting the TAS replay",
        category: "Delay",
        subcategory: "",
        options: [1500, 5000],
        value: 2500
    })
    .addSlider({
        configName: "tasReplayDelayBlade",
        title: "TAS Replay Delay Blade",
        description: "Delay in milliseconds before starting the TAS replay",
        category: "Delay",
        subcategory: "",
        options: [250, 1000],
        value: 500
    })
    .addSwitch({
        configName: "leftClickEtherwarp",
        title: "Left Click Etherwarp",
        description: "Left click to use etherwarp",
        category: "Dungeon"
    })
    .addSwitch({
        configName: "rightClickPickSwap",
        title: "Pick Swap",
        description: "Create ghostblocks using pickaxe swap",
        category: "Dungeon",
    })
    .addKeybind({
        configName: "pickSwapKey",
        title: "Pick Swap Key",
        description: "Keybind to swap to pickaxe",
        category: "Dungeon",
        shouldShow(data) {
            return data.rightClickPickSwap
        }
    })
    .addTextInput({
        configName: "ghostSwapSlot",
        title: "Ghost Swap Slot",
        description: "Slot to swap to when creating ghost blocks (not your pickaxe)",
        category: "Dungeon",
        value: "0",
        shouldShow(data) {
            return data.rightClickPickSwap
        }
    })
    .addSwitch({
        configName: "fireFreezeTimer",
        title: "Fire Freeze Staff Timer",
        description: "Warns you to fire freeze in dungeons",
        category: "Dungeon"
    })
    .addSwitch({
        configName: "autoFireFreeze",
        title: "Auto Fire Freeze",
        description: "Automatically fire freeze in dungeons",
        category: "Dungeon"
    })
    .addSwitch({
        configName: "autoGFS",
        title: "Auto GFS",
        description: "Automatically refill in dungeons",
        category: "Dungeon"
    })
    .addSwitch({
        configName: "zeroPingEtherwarp",
        title: "Zero Ping Etherwarp",
        description: "Etherwarp with zero ping",
        category: "Dungeon"
    })
    .addSwitch({
        configName: "keepMotion",
        title: "Keep Motion",
        description: "Keep your motion when zero ping etherwarping",
        category: "Dungeon",
        shouldShow(data) {
            return data.zeroPingEtherwarp
        }
    })
    .addSwitch({
        configName: "hoverSecrets",
        title: "Hover Secrets",
        description: "Automatically get the secret (chest & skulls) when hovering over it",
        category: "Dungeon",
        subcategory: "Secrets"
    })
    .addSlider({
        configName: "hoverSecretsCooldown",
        title: "Hover Secrets Cooldown",
        description: "Cooldown in milliseconds before clicking the same secret again",
        category: "Dungeon",
        subcategory: "Secrets",
        options: [50, 2000],
        value: 1,
        shouldShow(data) {
            return data.hoverSecrets
        }
    })
    .addToggle({
        configName: "enableHoverSecretsInWeirdos",
        title: "Enable in Weirdos",
        description: "Enable hover secrets in three weirdos",
        category: "Dungeon",
        subcategory: "Secrets",
        shouldShow(data) {
            return data.hoverSecrets
        }
    })
    .addToggle({
        configName: "autoTNT",
        title: "Auto TNT",
        description: "Automatically place TNT on walls",
        category: "Dungeon",
        subcategory: "TNT"
    })
    .addToggle({
        configName: "noParticleInDungeon",
        title: "No Particle in Dungeon",
        description: "Disable particles in dungeons",
        category: "Dungeon",
        subcategory: "Particles"
    })
    // .addToggle({
    //     configName: "autoCloseChests",
    //     title: "Auto Close Chests",
    //     description: "Automatically close chests when opened",
    //     category: "Dungeon",
    //     subcategory: "Chests"
    // })

const settings = new Settings("Duke Helper", config, "data/ColorScheme.json")
export default () => settings.settings