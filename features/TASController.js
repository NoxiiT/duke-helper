// ==== REFLECTION & KEYBINDS ====
const rightClickMethod = Client.getMinecraft().class.getDeclaredMethod("func_147121_ag");
const clickMouseMethod = Client.getMinecraft().class.getDeclaredMethod("func_147116_af");
rightClickMethod.setAccessible(true);
clickMouseMethod.setAccessible(true);

const leftClickKeyBind = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74312_F.func_151463_i());
const rightClickKeyBind = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74313_G.func_151463_i());
const forwardKeyBind    = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i());
const backwardKeyBind   = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i());
const leftKeyBind       = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i());
const rightKeyBind      = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i());
const jumpKeyBind       = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i());
const sneakKeyBind      = Client.getKeyBindFromKey(Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i());

function doLeftClick() { try { clickMouseMethod.invoke(Client.getMinecraft()); } catch (e) { console.error(e); } }
function doRightClick() { try { rightClickMethod.invoke(Client.getMinecraft()); } catch (e) { console.error(e); } }

// ==== TAS Controller ====
export class TASController {
    /**
     * @param {string} basePath - base directory for all sessions, e.g. "./TAS/"
     */
    constructor(basePath = "./TAS/") {
        this.basePath = basePath;
        this.session = null;
        this.isRecording = false;
        this.isReplaying = false;
        this.tickIndex = 0;
        this.cameras = [];
        this.movements = [];
        this.clicks = [];
        this.jumps = [];
        this.sneaks = [];
        this.hotbar = [];
        this.prevYaw = 0;
        this.prevPitch = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.events = new Map();

        register("tick", () => this._onTick());
        register("renderWorld", partial => this._onRender(partial));
    }

    /**
     * Register an event to be called when the session is started.
     * @param {string} event - event name
     * @param {function} callback - function to call when the event is triggered
     * @param {boolean} once - if true, the event will be removed after being called once
    */
    on(event, callback) {
        this.events.set(event, { callback, once: false });
    }

    once(event, callback) {
        this.events.set(event, { callback, once: true });
    }

    emit(event) {
        const handler = this.events.get(event);
        if (handler) {
            handler.callback();
            if (handler.once) this.events.delete(event);
        }
    }

    /**
     * Start recording into a named session.
     * Creates folder `${basePath}/${name}/`.
     * @param {string} name
     */
    startRecording(name) {
        if (this.isRecording) return;
        this.session = name;
        const dir = this.basePath + name + "/";
        FileLib.makeDir(this.basePath);
        FileLib.makeDir(dir);
        this._resetArrays();
        this.isRecording = true;
        ChatLib.chat(`&aTAS >> &7Recording '${name}' Started`);
    }

    /** Stop current recording and save files */
    stopRecording() {
        if (!this.isRecording || !this.session) return;
        this.isRecording = false;
        this._save();
        ChatLib.chat(`&aTAS >> &7Recording '${this.session}' Stopped & Saved`);
    }

    /** Start replay for named session */
    startReplay(name) {
        if (this.isReplaying || this.isRecording) return;
        this.emit('start');
        this.session = name;
        this.isReplaying = true;
        this._load();
        this.tickIndex = 0;
        [this.prevYaw, this.prevPitch] = this.cameras[0] || [Player.getYaw(), Player.getPitch()];
        [this.targetYaw, this.targetPitch] = this.cameras[0] || [this.prevYaw, this.prevPitch];
        ChatLib.chat(`&aTAS >> &7Replay '${name}' Started`);
    }

    /** Stop current replay */
    stopReplay() {
        if (!this.isReplaying) return;
        ChatLib.chat(`&aTAS >> &7Replay '${this.session}' Stopped`);
        // Set key press states to false
        forwardKeyBind.setState(false);
        backwardKeyBind.setState(false);
        leftKeyBind.setState(false);
        rightKeyBind.setState(false);
        jumpKeyBind.setState(false);
        sneakKeyBind.setState(false);
        this.isReplaying = false;
        this.emit('end');
    }

    // internal tick handler
    _onTick() {
        if (this.isRecording) {
            if (Client.currentGui.get() != null) {
                this.stopRecording();
                return;
            }
            this._recordTick();
        }
        if (this.isReplaying) {
            if (Client.currentGui.get() != null) {
                this.stopReplay();
                return;
            }
            this._replayTick();
        }
    }

    // internal render handler for smooth look
    _onRender(partial) {
        if (!this.isReplaying) return;
        const t = partial;
        const yaw = this._lerpAngle(this.prevYaw, this.targetYaw, t);
        const pitch = this._lerpAngle(this.prevPitch, this.targetPitch, t);
        Player.getPlayer().field_70177_z = yaw;
        Player.getPlayer().field_70125_A = pitch;
    }

    // record a single tick
    _recordTick() {
        this.cameras.push([Player.getYaw(), Player.getPitch()]);
        this.movements.push([
            forwardKeyBind.isKeyDown(), backwardKeyBind.isKeyDown(),
            leftKeyBind.isKeyDown(),    rightKeyBind.isKeyDown()
        ]);
        this.clicks.push([leftClickKeyBind.isKeyDown(), rightClickKeyBind.isKeyDown()]);
        this.jumps.push(jumpKeyBind.isKeyDown());
        this.sneaks.push(sneakKeyBind.isKeyDown());
        this.hotbar.push(Player.getHeldItemIndex());
    }

    // replay a single tick
    _replayTick() {
        if (this.tickIndex >= this.cameras.length) {
            this.stopReplay();
            return;
        }
        this.prevYaw = this.targetYaw;
        this.prevPitch = this.targetPitch;
        [this.targetYaw, this.targetPitch] = this.cameras[this.tickIndex];

        const mov = this.movements[this.tickIndex];
        forwardKeyBind.setState(mov[0]); backwardKeyBind.setState(mov[1]);
        leftKeyBind.setState(mov[2]);    rightKeyBind.setState(mov[3]);

        if (this.tickIndex > 0) {
            const prev = this.clicks[this.tickIndex-1];
            const curr = this.clicks[this.tickIndex];
            if (curr[0] && !prev[0]) doLeftClick();
            if (curr[1] && !prev[1]) doRightClick();
        }
        jumpKeyBind.setState(this.jumps[this.tickIndex]);
        sneakKeyBind.setState(this.sneaks[this.tickIndex]);
        Player.setHeldItemIndex(this.hotbar[this.tickIndex]);

        this.tickIndex++;
    }

    // save arrays to files in session dir
    _save() {
        const p = this.basePath + this.session + "/";
        const data = {
            cameras: this.cameras,
            movements: this.movements,
            clicks: this.clicks,
            jumps: this.jumps,
            sneaks: this.sneaks,
            hotbar: this.hotbar
        };
        FileLib.write(p + "tas.json", JSON.stringify(data, null, 2));
    }

    // load arrays from session dir
    _load() {
        const p = this.basePath + this.session + "/";
        this._resetArrays();
        const data = JSON.parse(FileLib.read(p + "tas.json"));
        this.cameras.push(...data.cameras);
        this.movements.push(...data.movements);
        this.clicks.push(...data.clicks);
        this.jumps.push(...data.jumps);
        this.sneaks.push(...data.sneaks);
        this.hotbar.push(...data.hotbar);
    }

    // helpers
    _resetArrays() {
        this.tickIndex = 0;
        this.cameras.length = this.movements.length = this.clicks.length = 0;
        this.jumps.length = this.sneaks.length = this.hotbar.length = 0;
    }
    _normalizeAngle(a) { return ((a % 360) + 540) % 360 - 180; }
    _lerpAngle(f, t, x) { return f + this._normalizeAngle(t - f) * x; }
}