import Settings from "../config.js";
import { isInDungeon, useHotbarItem } from "../utils.js";
import { getPlayerEyeCoords, raytraceBlocks, traverseVoxels, getLastSentCoord, getLastSentLook, getCurrentRoom } from "../../BloomCore/utils/Utils";
import Vector3 from "../../BloomCore/utils/Vector3.js";

const attackKey = Client.getMinecraft().field_71474_y.field_74312_F; // Accessing attack key directly from MCP mappings

const getWallToBomb = (useLastPacketPos=true, distance=5) => {
    let lambdaCheck = (block) => {
        if (!block) return false
        if (!(block instanceof Block)) block = World.getBlockAt(...block)
        if (block.type.getID() == 0) return false
        // console.log(block.type.getRegistryName(), block.type.getID(), block.metadata)
        if (block.type.getID() == 98 && block.metadata == 2) return true
    }
    if (!useLastPacketPos) return raytraceBlocks(getPlayerEyeCoords(true), null, distance, lambdaCheck, true, true)

    if (!getLastSentCoord() || !getLastSentLook()) return null

    const [pitch, yaw] = getLastSentLook()
    const lookVec = Vector3.fromPitchYaw(pitch, yaw).multiply(distance)
    const startPos = [...getLastSentCoord()]
    startPos[1] += Player.getPlayer().func_70047_e()
    const endPos = lookVec.getComponents().map((v, i) => v + startPos[i])
    return traverseVoxels(startPos, endPos, lambdaCheck, true, true, false)
}

let wallBlocks = new Set([
    "minecraft:stonebrick",
    // "minecraft:skull" -> Have to improve the check because it's getting every skulls not only the secret ones
])

let lastClick = null
let clickedBlocks = {}
let keyHeld = false

const parseCoordsToText = (coords) => {
    return `${coords[0]}${coords[1]}${coords[2]}`
}

register("tick", () => {
    Object.keys(clickedBlocks).forEach(key => {
        if (new Date().getTime() - clickedBlocks[key] > (Math.random() * 20) + Settings().hoverSecretsCooldown) delete clickedBlocks[key]
    })
})

register("tick", () => {
    if (!Settings().autoTNT) return
    if (!isInDungeon()) return
    if (Client.isInGui() && !Client.isInChat()) return
    if (attackKey.func_151470_d()) {
        if (keyHeld) return
        keyHeld = true
        let wallBlock = getWallToBomb(true)
        const playerBlock = Player.lookingAt()
        if (playerBlock && playerBlock instanceof Block && wallBlocks.has(playerBlock.type.getRegistryName()) && playerBlock.metadata == 2)
            wallBlock = [playerBlock.x, playerBlock.y, playerBlock.z]
        if (!wallBlock) return
        const [x, y, z] = wallBlock
        if (!wallBlocks.has(World.getBlockAt(x, y, z).type.getRegistryName())) return
        if (clickedBlocks[parseCoordsToText(wallBlock)]) return
        lastClick = new Date().getTime()

        useHotbarItem("TNT", true)
        clickedBlocks[parseCoordsToText(wallBlock)] = new Date().getTime()
    } else {
        keyHeld = false
    }
})