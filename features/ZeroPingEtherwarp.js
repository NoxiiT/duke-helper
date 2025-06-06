import { getEtherwarpBlock, getLastSentLook, getSkyblockItemID, raytraceBlock } from "../../BloomCore/utils/Utils"
import Settings from "../config"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

const FAILWATCHPERIOD = 20 // 20 Seconds
const MAXFAILSPERFAILPERIOD = 5 // 5 fails allowed per 20 seconds. Higher numbers of fails could cause timer bans
const MAXQUEUEDPACKETS = 5 // Longest chain of queued zero ping teleports at a time
const recentFails = [] // Timestamps of the most recent failed teleports
const recentlySentC06s = [] // [{pitch, yaw, x, y, z, sentAt}, ...] in the order the packets were sent

const checkAllowedFails = () => {
    // Queue of teleports too long
    if (recentlySentC06s.length >= MAXQUEUEDPACKETS) return false
    
    // Filter old fails
    while (recentFails.length && Date.now() - recentFails[0] > FAILWATCHPERIOD * 1000) recentFails.shift()

    return recentFails.length < MAXFAILSPERFAILPERIOD
}

const isHoldingEtherwarpItem = () => {
    const held = Player.getHeldItem()
    const sbId = getSkyblockItemID(held)

    if (sbId !== "ASPECT_OF_THE_END" && sbId !== "ASPECT_OF_THE_VOID" && sbId !== "ETHERWARP_CONDUIT") return false
    
    return (held.getNBT()?.toObject()?.tag?.ExtraAttributes?.ethermerge == 1 || sbId == "ETHERWARP_CONDUIT")
}

const isHoldingInstantTransmission = () => {
    const held = Player.getHeldItem()
    const sbId = getSkyblockItemID(held)

    return sbId === "ASPECT_OF_THE_END" || sbId === "ASPECT_OF_THE_VOID"
}

const getTunerBonusDistance = () => {
    return Player.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0
}

const doZeroPingInstantTransmission = () => {
    const tb = raytraceBlock(8 + getTunerBonusDistance())
    console.log(tb)
    if (!tb) return

    let [pitch, yaw] = getLastSentLook()
    yaw %= 360
    if (yaw < 0) yaw += 360

    let [x, y, z] = [ tb.x, tb.y, tb.z ]

    x += 0.5
    y += 0.15
    z += 0.5

    recentlySentC06s.push({ pitch: 0, yaw: 0, x, y, z, sentAt: Date.now() })

    Client.scheduleTask(0, () => {
        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()))
        Player.getPlayer().func_70107_b(x, y, z)
        Player.getPlayer().func_70016_h(0, 0, 0)
    })
}

const doZeroPingEtherwarp = () => {
    const rt = getEtherwarpBlock(true, 57 + getTunerBonusDistance() - 1)
    if (!rt) return

    let [pitch, yaw] = getLastSentLook()
    yaw %= 360
    if (yaw < 0) yaw += 360

    let [x, y, z] = rt

    x += 0.5
    y += 1.05
    z += 0.5

    recentlySentC06s.push({ pitch, yaw, x, y, z, sentAt: Date.now() })

    // The danger zone
    // At the end of this tick, send the C06 packet which would normally be sent after the server teleports you
    // and then set the player's position to the destination. The C06 being sent is what makes this true zero ping.
    Client.scheduleTask(0, () => {
        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()))
        // Player.getPlayer().setPosition(x, y, z)
        Player.getPlayer().func_70107_b(x, y, z)

        // .setVelocity()
        if (!Settings().keepMotion) Player.getPlayer().func_70016_h(0, 0, 0)
    })
}

// Detect when the player is trying to etherwarp
register("packetSent", (packet) => {
    if (!Settings().zeroPingEtherwarp) return
    const held = Player.getHeldItem()
    const item = getSkyblockItemID(held)
    const blockID = Player.lookingAt()?.getType()?.getID();
    if (!isHoldingEtherwarpItem() || !getLastSentLook() || !Player.isSneaking() && item !== "ETHERWARP_CONDUIT" || blockID === 54 || blockID === 146) return
    if (!checkAllowedFails()) return ChatLib.chat(`&cZero ping etherwarp teleport aborted.\n&c${recentFails.length} fails last ${FAILWATCHPERIOD}s\n&c${recentlySentC06s.length} C06's queued currently`)
    doZeroPingEtherwarp()
}).setFilteredClass(C08PacketPlayerBlockPlacement)

// Detect when the player is trying to instant transmission
// register("packetSent", (packet) => {
//     if (!Settings().enabled) return
//     if (!isHoldingInstantTransmission() || !getLastSentLook() || Player.isSneaking()) return
//     if (!checkAllowedFails()) return ChatLib.chat(`&cZero ping instant transmission aborted.\n&c${recentFails.length} fails last ${FAILWATCHPERIOD}s\n&c${recentlySentC06s.length} C06's queued currently`)
//     doZeroPingInstantTransmission()
// }).setFilteredClass(C08PacketPlayerBlockPlacement)

// For whatever rounding errors etc occur
const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4

// Listening for server teleport packets
register("packetReceived", (packet, event) => {
    if (!Settings().zeroPingEtherwarp || !recentlySentC06s.length) return

    const { pitch, yaw, x, y, z, sentAt } = recentlySentC06s.shift()

    const newPitch = packet.func_148930_g()
    const newYaw = packet.func_148931_f()
    const newX = packet.func_148932_c()
    const newY = packet.func_148928_d()
    const newZ = packet.func_148933_e()

    // All of the values of this S08 packet must match up to the last C06 packet which was sent when you teleported.
    const lastPresetPacketComparison = {
        pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0,
        yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
        x: x == newX,
        y: y == newY,
        z: z == newZ
    }

    const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a == true)

    // The etherwarp was predicted correctly, cancel the packet since we've already sent the response back when we tried to teleport
    if (wasPredictionCorrect) return cancel(event)

    // The etherwarp was not predicted correctly
    recentFails.push(Date.now())
    
    // Discard the rest of the queued teleports to check since one earlier in the chain failed
    while (recentlySentC06s.length) recentlySentC06s.shift()

}).setFilteredClass(S08PacketPlayerPosLook)

