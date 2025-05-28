# Duke Helper (ChatTriggers Module)

Duke Helper is a powerful [ChatTriggers](https://chattriggers.com/) module designed to automate and enhance various aspects of Hypixel Skyblock, with a primary focus on the Barbarian Duke X and Bladesoul boss encounters in the Crimson Isle. In addition to Duke-specific features, it also provides a suite of dungeon and utility tools to streamline your gameplay.

## Features

### Duke & Bladesoul Automation
- **Automatic Duke/Blade Detection:** Instantly detects the presence of Duke or Bladesoul and notifies you.
- **Auto Warp & Party Coordination:** Automatically warps your party and announces boss findings.
- **TAS (Tool-Assisted Speedrun) Integration:** Replays pre-recorded movement paths to automate traveling to bosses.
- **Auto Kill:** Optionally automates Hyperion spam to kill bosses.
- **Loot Tracking:** Tracks and displays valuable loot drops and calculates coins per hour.
- **Session Stats:** Displays session duration, kills, loot, and more in a customizable overlay.

### Dungeon Utilities
- **Hover Secrets:** Instantly clicks chests and (optionally) skulls when you hover over them in dungeons.
- **Auto TNT:** Automatically places TNT on bombable walls in dungeons.
- **Left Click Etherwarp:** Allows left-clicking to use Etherwarp abilities.
- **Pickaxe Swap Ghostblocks:** Quickly creates ghost blocks using a configurable pickaxe swap key.
- **Fire Freeze Timer:** Alerts or automatically uses Fire Freeze Staff at the right time in boss fights.
- **Auto GFS:** Automatically refills Spirit Leaps and Ender Pearls in boss rooms.
- **No Particles in Dungeon:** Optionally disables most particles in dungeons for better visibility.
- **Auto Close Chests:** (Optional) Automatically closes chests in dungeons.

### General Utilities
- **ESP Boxes:** Highlights Duke and Bladesoul with ESP boxes for easy tracking.
- **Customizable Overlays:** Move and style health/status overlays to your preference.
- **Configurable Delays and Keybinds:** Fine-tune timings and controls for all automated actions.

## Installation

1. **Download the Module:**
   - Go to the [Duke Helper GitHub repository](https://github.com/NoxiiT/duke-helper).
   - Download the repository as a ZIP file.

2. **Extract the Files:**
   - Unzip the downloaded file.

3. **Move to ChatTriggers Modules Folder:**
   - Copy the entire `Duke Helper` folder into your `.minecraft/config/ChatTriggers/modules/` directory.

   ```
   .minecraft/
     config/
       ChatTriggers/
         modules/
           Duke Helper/
             (all Duke Helper files and folders)
   ```

4. **Reload ChatTriggers:**
   - In Minecraft, run `/ct reload` or restart your game.

5. **Configure the Module:**
   - Use `/duke` to open the configuration GUI and adjust settings to your liking.

## Requirements

- [ChatTriggers](https://chattriggers.com/) (latest version)
- Minecraft 1.8.9 (recommended for Hypixel Skyblock)
- Some features require [Amaterasu](https://github.com/UnclaimedBloom6/Amaterasu) core for configuration support.

## Usage

- `/duke` — Open the Duke Helper configuration menu.
- `/dukesession` — Manage and reset your session stats.
- `/alertduke` — Play the Duke found alert sound.
- `/scanArmorStands` — Debug: List all armor stands in the world. (Debug purpose)
- Other features are automatic or configurable via the settings GUI.

## Support

For issues, suggestions, or updates, visit the [GitHub repository](https://github.com/NoxiiT/duke-helper).

---

Enjoy faster, smarter, and more efficient boss runs and dungeon experiences with Duke Helper!
