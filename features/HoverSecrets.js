import Settings from "../config.js";
import { useHotbarItem, isInDungeon } from "../utils.js";
import { getPlayerEyeCoords, raytraceBlocks, traverseVoxels, getLastSentCoord, getLastSentLook, getCurrentRoom } from "../../BloomCore/utils/Utils";
import Vector3 from "../../BloomCore/utils/Vector3.js";

const getSecretBlock = (useLastPacketPos=true, distance=5) => {
    let lambdaCheck = (block) => {
        if (!block) return false
        if (!(block instanceof Block)) block = World.getBlockAt(...block)
        if (block.type.getID() == 0) return false
        if (block.type.getID() == 54) return true
        if (block.type.getID() == 144) return true
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

let secretsBlocks = new Set([
    "minecraft:chest",
    // "minecraft:skull" -> Have to improve the check because it's getting every skulls not only the secret ones
])

let clickedBlocks = {}

const parseCoordsToText = (coords) => {
    return `${coords[0]}${coords[1]}${coords[2]}`
}

register("tick", () => {
    Object.keys(clickedBlocks).forEach(key => {
        if (new Date().getTime() - clickedBlocks[key] > (Math.random() * 20) + Settings().hoverSecretsCooldown) delete clickedBlocks[key]
    })
})

register("tick", () => {
    if (!Settings().hoverSecrets) return
    if (!isInDungeon()) return
    if (!Settings().enableHoverSecretsInWeirdos && getCurrentRoom() !== null && getCurrentRoom().name === "Three Weirdos") return
    if (Client.isInGui() && !Client.isInChat()) return
    let secretBlock = null;
    const playerBlock = Player.lookingAt()
    if (playerBlock && playerBlock instanceof Block && secretsBlocks.has(playerBlock.type.getRegistryName()))
        secretBlock = [playerBlock.x, playerBlock.y, playerBlock.z]
    if (!secretBlock) return
    const [x, y, z] = secretBlock
    if (!secretsBlocks.has(World.getBlockAt(x, y, z).type.getRegistryName())) return
    if (clickedBlocks[parseCoordsToText(secretBlock)]) return
    lastClick = new Date().getTime()

    useHotbarItem("Pickaxe", true)
    clickedBlocks[parseCoordsToText(secretBlock)] = new Date().getTime()
})