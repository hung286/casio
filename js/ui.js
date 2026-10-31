/**
 * Casio fx-580VN X Emulator - UI Controller & Event Dispatcher (100% Standalone Web App)
 */

class CasioUI {
    constructor() {
        this.engine = new CasioEngine();
        this.mathTree = new MathTree();
        this.classwizOS = new ClassWizOS(this.engine, this.mathTree);
        window.classwizOS = this.classwizOS;

        // UI States
        this.result = null;
        this.shiftActive = false;
        this.alphaActive = false;
        this.stoActive = false;
        this.rclActive = false;
        this.calcActive = false;
        this.calcVarIndex = 0;
        this.calcVars = [];
        this.calcInputBuffer = "";
        this.soundEnabled = true;
        this.displayFormatToggleState = 0; // 0: improper fraction, 1: mixed fraction, 2: decimal
        this.stoDisplayMsg = null;

        this.audioCtx = null;

        this.initDOM();
        this.initAudio();
        this.bindEvents();
        this.updateScreen();
    }

    initDOM() {
        this.exprEl = document.getElementById("lcd-expression");
        this.resultEl = document.getElementById("lcd-result");
        this.menuOverlayEl = document.getElementById("lcd-menu-overlay");

        // Indicators
        this.indShift = document.getElementById("ind-shift");
        this.indAlpha = document.getElementById("ind-alpha");
        this.indMem = document.getElementById("ind-mem");
        this.indSto = document.getElementById("ind-sto");
        this.indAngle = document.getElementById("ind-angle");
        this.indMath = document.getElementById("ind-math");
        this.indUp = document.getElementById("ind-up");
        this.indDown = document.getElementById("ind-down");
        this.indVct = document.getElementById("ind-vct");

        // Panels
        this.historyPanel = document.getElementById("history-panel");
        this.historyList = document.getElementById("history-list");
        this.shortcutPanel = document.getElementById("shortcut-panel");
        this.backdrop = document.getElementById("panel-backdrop");
    }

    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {}

        // Unlock Web Audio on first user interaction (crucial for iOS Safari & Android Chrome)
        const unlockAudio = () => {
            if (this.audioCtx && this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
            window.removeEventListener("pointerdown", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
        };
        window.addEventListener("pointerdown", unlockAudio, { passive: true });
        window.addEventListener("touchstart", unlockAudio, { passive: true });
    }

    triggerHaptic() {
        if (navigator && typeof navigator.vibrate === "function") {
            try {
                navigator.vibrate(10);
            } catch (e) {}
        }
    }

    playClickSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1300, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(160, this.audioCtx.currentTime + 0.012);

            gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.012);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.015);
        } catch (e) {}
    }

    bindEvents() {
        // Calculator button clicks with instant touch & mouse handling
        let lastTouchTime = 0;
        document.querySelectorAll(".c-btn, .dpad-btn").forEach(btn => {
            const press = () => {
                const action = btn.dataset.action;
                const value = btn.dataset.val;
                this.handleButtonPress(action, value, btn);
            };

            btn.addEventListener("pointerdown", (e) => {
                if (e.pointerType === "touch" || e.pointerType === "pen") {
                    lastTouchTime = Date.now();
                }
                press();
            }, { passive: true });

            btn.addEventListener("click", () => {
                if (Date.now() - lastTouchTime < 450) {
                    return; // Ignore synthetic click following pointerdown
                }
                press();
            });
        });

        // PC Keyboard Shortcuts
        window.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            const key = e.key;

            if (key >= "0" && key <= "9") {
                this.handleInput(key, "num");
            } else if (key === ".") {
                this.handleInput(".", "dot");
            } else if (key === "+") {
                this.handleInput("+", "plus");
            } else if (key === "-") {
                this.handleInput("-", "minus");
            } else if (key === "*") {
                this.handleInput("*", "times");
            } else if (key === "/") {
                e.preventDefault();
                this.handleButtonPress("frac", "/");
            } else if (key === "^") {
                this.handleButtonPress("pow", "^");
            } else if (key === "(") {
                this.handleInput("(", "left_paren");
            } else if (key === ")") {
                this.handleInput(")", "right_paren");
            } else if (key === "Enter" || key === "=") {
                e.preventDefault();
                this.handleButtonPress("equals", "=");
            } else if (key === "Backspace") {
                this.handleButtonPress("del", "");
            } else if (key === "Escape" || key === "Delete") {
                this.handleButtonPress("ac", "");
            } else if (key === "ArrowLeft") {
                this.handleButtonPress("dpad", "left");
            } else if (key === "ArrowRight") {
                this.handleButtonPress("dpad", "right");
            } else if (key === "ArrowUp") {
                this.handleButtonPress("dpad", "up");
            } else if (key === "ArrowDown") {
                this.handleButtonPress("dpad", "down");
            } else if (key === "s" || key === "S") {
                this.handleButtonPress("sin", "sin(");
            } else if (key === "c" || key === "C") {
                this.handleButtonPress("cos", "cos(");
            } else if (key === "t" || key === "T") {
                this.handleButtonPress("tan", "tan(");
            } else if (key === "q" || key === "Q") {
                this.handleButtonPress("sqrt", "sqrt(");
            } else if (key === "x" || key === "X") {
                this.handleInput("x", "var_x");
            } else if (key === "l" || key === "L") {
                this.handleButtonPress("logab", "logab(");
            } else if (key === "n" || key === "N") {
                this.handleButtonPress("ln", "ln(");
            } else if (key === "m" || key === "M") {
                this.handleButtonPress("menu", "");
            } else if (key === "Shift") {
                this.toggleShift();
            } else if (key === "Alt") {
                e.preventDefault();
                this.toggleAlpha();
            }
            this.playClickSound();
        });

        // App toolbar controls
        if (this.exprEl) {
            const handleLcdTap = (e) => {
                const setupRow = e.target.closest(".cw-dialog-row[data-setup-row]");
                if (setupRow) {
                    const idx = parseInt(setupRow.dataset.setupRow, 10);
                    this.classwizOS.setupCursor = idx;
                    this.classwizOS.handleKey(null, "equals");
                    this.updateScreen();
                    return;
                }
                const subRow = e.target.closest(".cw-dialog-row[data-submenu-idx]");
                if (subRow) {
                    const idx = parseInt(subRow.dataset.submenuIdx, 10);
                    this.classwizOS.submenuCursor = idx;
                    this.classwizOS.handleKey(null, "equals");
                    this.updateScreen();
                    return;
                }

                if (this.classwizOS && this.classwizOS.isAnyOverlayOpen && this.classwizOS.isAnyOverlayOpen()) {
                    return;
                }

                // Touch-to-cursor navigation: Pinpoint slot and character position
                const targetEl = e.target.closest("[data-node-id]");
                if (targetEl) {
                    const nodeId = targetEl.dataset.nodeId;
                    const slotName = targetEl.dataset.slot;
                    let targetIdx = targetEl.dataset.idx !== undefined ? parseInt(targetEl.dataset.idx, 10) : 0;

                    if (targetEl.classList.contains("cw-char")) {
                        const rect = targetEl.getBoundingClientRect();
                        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left);
                        if (clientX - rect.left > rect.width / 2) {
                            targetIdx += 1;
                        }
                    } else if (targetEl.dataset.idx === undefined) {
                        targetIdx = 999;
                    }

                    this.mathTree.setCursorByTarget(nodeId, slotName, targetIdx);
                    this.updateScreen();
                    return;
                }

                // Tapped on empty area of LCD: move cursor to end of expression
                this.mathTree.cursor = { list: this.mathTree.root, index: this.mathTree.root.length, parent: null, slot: null };
                this.updateScreen();
            };

            this.exprEl.addEventListener("click", handleLcdTap);
            this.exprEl.addEventListener("touchstart", (e) => {
                if (e.target.closest("[data-node-id]") || e.target.closest(".cw-dialog-row")) {
                    handleLcdTap(e);
                }
            }, { passive: true });
        }

        const btnSound = document.getElementById("btn-sound");
        if (btnSound) {
            btnSound.addEventListener("click", () => {
                this.soundEnabled = !this.soundEnabled;
                btnSound.classList.toggle("active", this.soundEnabled);
                const icon = btnSound.querySelector(".btn-icon");
                const textFull = btnSound.querySelector(".btn-text-full");
                if (icon) icon.textContent = this.soundEnabled ? "🔊" : "🔇";
                if (textFull) textFull.textContent = this.soundEnabled ? " Âm: BẬT" : " Âm: TẮT";
                if (!icon && !textFull) {
                    btnSound.innerHTML = this.soundEnabled ? "🔊 Âm phím: BẬT" : "🔇 Âm phím: TẮT";
                }
            });
        }

        const btnAngle = document.getElementById("btn-angle-toggle");
        if (btnAngle) {
            btnAngle.addEventListener("click", () => {
                const units = ["DEG", "RAD", "GRA"];
                let idx = units.indexOf(this.engine.angleUnit);
                idx = (idx + 1) % units.length;
                this.engine.setAngleUnit(units[idx]);
                const unitText = document.getElementById("angle-unit-text");
                if (unitText) {
                    unitText.textContent = units[idx];
                } else {
                    btnAngle.innerText = `Đơn vị: ${units[idx]}`;
                }
                this.updateScreen();
            });
        }

        const btnTheme = document.getElementById("btn-theme-toggle");
        if (btnTheme) {
            btnTheme.addEventListener("click", () => {
                const body = document.body;
                if (body.classList.contains("theme-white")) {
                    body.classList.remove("theme-white");
                    body.classList.add("theme-retro");
                    btnTheme.innerHTML = `<span class="btn-icon">🎨</span><span class="btn-text-full"> Retro</span>`;
                } else if (body.classList.contains("theme-retro")) {
                    body.classList.remove("theme-retro");
                    btnTheme.innerHTML = `<span class="btn-icon">🎨</span><span class="btn-text-full"> Dark</span>`;
                } else {
                    body.classList.add("theme-white");
                    btnTheme.innerHTML = `<span class="btn-icon">🎨</span><span class="btn-text-full"> Sáng</span>`;
                }
            });
        }

        const btnHistory = document.getElementById("btn-open-history");
        if (btnHistory) {
            btnHistory.addEventListener("click", () => this.toggleHistoryPanel(true));
        }

        const btnShortcuts = document.getElementById("btn-open-shortcuts");
        if (btnShortcuts) {
            btnShortcuts.addEventListener("click", () => this.toggleShortcutPanel(true));
        }

        if (this.backdrop) {
            this.backdrop.addEventListener("click", () => {
                this.toggleHistoryPanel(false);
                this.toggleShortcutPanel(false);
            });
        }

        const btnClearHist = document.getElementById("btn-clear-history");
        if (btnClearHist) {
            btnClearHist.addEventListener("click", (e) => {
                e.stopPropagation();
                this.engine.history = [];
                this.renderHistoryList();
            });
        }

        document.querySelectorAll(".panel-close").forEach(btn => {
            btn.addEventListener("click", () => {
                this.toggleHistoryPanel(false);
                this.toggleShortcutPanel(false);
            });
        });
    }

    handleButtonPress(action, value, btnEl) {
        this.playClickSound();
        this.triggerHaptic();

        if (btnEl) {
            btnEl.classList.add("btn-pressed");
            setTimeout(() => btnEl.classList.remove("btn-pressed"), 110);
        }

        const isShift = this.shiftActive;
        const isAlpha = this.alphaActive;

        if (action !== "shift" && action !== "alpha") {
            this.shiftActive = false;
            this.alphaActive = false;
        }

        // Modifiers
        if (action === "shift") {
            this.toggleShift();
            return;
        }
        if (action === "alpha") {
            this.toggleAlpha();
            return;
        }
        if (action === "on") {
            this.handleOn();
            return;
        }
        if (action === "menu") {
            if (isShift) {
                this.openSetupMenu();
            } else {
                this.classwizOS.toggleMenu();
                this.updateScreen();
            }
            return;
        }

        // Check if ClassWiz OS handles non-COMP modes & overlays
        let keyToSend = value;
        if (this.classwizOS.isMenuOpen) {
            if (action === "(- )") keyToSend = "A";
            else if (action === "d_m_s") keyToSend = "B";
            else if (action === "x^-1") keyToSend = "C";
        }
        const handledByOS = this.classwizOS.handleKey(keyToSend, action);
        if (handledByOS) {
            if (handledByOS === "cursor_start") {
                this.mathTree.cursor = { list: this.mathTree.root, index: 0, parent: null, slot: null };
            } else if (handledByOS === "cursor_end") {
                this.mathTree.cursor = { list: this.mathTree.root, index: this.mathTree.root.length, parent: null, slot: null };
            }
            this.updateScreen();
            return;
        }

        // STO and RCL Variable Operations
        if (action === "sto") {
            if (isShift) {
                this.classwizOS.closeAllOverlays();
                this.classwizOS.isRecallOpen = true;
            } else {
                this.stoActive = true;
                this.rclActive = false;
            }
            this.updateScreen();
            return;
        }

        if (this.stoActive) {
            this.stoActive = false;
            const varMap = {
                "(- )": "A", "d_m_s": "B", "x^-1": "C", "sin": "D", "cos": "E", "tan": "F",
                "left_paren": "x", "right_paren": "y", "sd": "z", "m_plus": "M", "var_x": "x"
            };
            const varName = varMap[action] || (["A", "B", "C", "D", "E", "F", "x", "y", "z", "M"].includes(value) ? value : null);
            if (varName && this.engine.registers.hasOwnProperty(varName)) {
                let valToStore = 0;
                let fromExpr = "Ans";
                if (!this.mathTree.isEmpty()) {
                    try {
                        const exprStr = this.mathTree.toExpressionString();
                        const calculated = this.engine.calculate(exprStr);
                        valToStore = calculated;
                        fromExpr = exprStr;
                    } catch(e) {
                        valToStore = this.engine.ans;
                    }
                } else if (this.result !== null) {
                    valToStore = this.result;
                } else {
                    valToStore = this.engine.ans;
                }
                this.engine.registers[varName] = valToStore;
                this.engine.ans = valToStore;
                this.mathTree.clear();
                this.result = valToStore;
                this.stoDisplayMsg = `${fromExpr} → ${varName}`;
                this.updateScreen();
                return;
            }
        }

        if (this.rclActive) {
            this.rclActive = false;
            const varMap = {
                "(- )": "A", "d_m_s": "B", "x^-1": "C", "sin": "D", "cos": "E", "tan": "F",
                "left_paren": "x", "right_paren": "y", "sd": "z", "m_plus": "M", "var_x": "x"
            };
            const varName = varMap[action] || (["A", "B", "C", "D", "E", "F", "x", "y", "z", "M"].includes(value) ? value : null);
            if (varName && this.engine.registers.hasOwnProperty(varName)) {
                const val = this.engine.registers[varName].toString();
                for (const ch of val) {
                    this.mathTree.insertChar(ch);
                }
                this.updateScreen();
                return;
            }
        }

        // Casio Overlays Activation Shortcuts
        if (isShift) {
            if (action === "num" && value === "9") {
                this.classwizOS.closeAllOverlays();
                this.classwizOS.isResetOpen = true;
                this.classwizOS.resetStep = 0;
                this.updateScreen();
                return;
            }
            if (action === "num" && value === "7") {
                this.classwizOS.closeAllOverlays();
                this.classwizOS.isConstOpen = true;
                this.classwizOS.constCat = null;
                this.updateScreen();
                return;
            }
            if (action === "num" && value === "8") {
                this.classwizOS.closeAllOverlays();
                this.classwizOS.isConvOpen = true;
                this.classwizOS.convCat = null;
                this.updateScreen();
                return;
            }
            if (action === "sto") {
                this.classwizOS.closeAllOverlays();
                this.classwizOS.isRecallOpen = true;
                this.updateScreen();
                return;
            }
            if (action === "calc") {
                const exprStr = this.mathTree.toExpressionString() || "x = 0";
                const displayStr = this.mathTree.toReadableString ? this.mathTree.toReadableString() : exprStr;
                const htmlExpr = this.mathTree.renderHTML(false);
                this.classwizOS.initSolve(exprStr, displayStr, htmlExpr);
                this.updateScreen();
                return;
            }
        }

        // Degree / Minutes / Seconds key (° ' ")
        if (action === "d_m_s") {
            if (isShift) {
                // FACT: prime factorization
                let targetNum = null;
                if (this.result !== null && Number.isInteger(Number(this.result))) {
                    targetNum = Number(this.result);
                } else if (this.engine.ans !== null && Number.isInteger(Number(this.engine.ans))) {
                    targetNum = Number(this.engine.ans);
                }
                if (targetNum !== null && targetNum > 1 && targetNum < 1e12) {
                    this.result = this.engine.primeFactorization(targetNum);
                    this.updateScreen();
                    return;
                }
            } else if (isAlpha) {
                this.mathTree.insertChar("B");
                this.updateScreen();
                return;
            } else {
                // If there is an existing numeric result on screen and math tree is empty, toggle DMS!
                if (this.result !== null && typeof this.result === "number" && this.mathTree.isEmpty()) {
                    this.displayFormatToggleState = this.displayFormatToggleState === "dms" ? 0 : "dms";
                    this.updateScreen();
                    return;
                } else {
                    this.mathTree.insertChar("°");
                    this.updateScreen();
                    return;
                }
            }
        }

        // Modifiers & Functions
        if (action === "ans") {
            if (isShift) {
                this.mathTree.insertChar("%");
                this.updateScreen();
                return;
            } else if (isAlpha) {
                for (const ch of "PreAns") this.mathTree.insertChar(ch);
                this.updateScreen();
                return;
            }
        }

        if (action === "calc" && isAlpha) {
            this.mathTree.insertChar("=");
            this.updateScreen();
            return;
        }

        if (action === "integral") {
            if (isAlpha) {
                this.mathTree.insertChar(":");
                this.updateScreen();
                return;
            } else if (isShift) {
                this.mathTree.insertDerivative();
                this.updateScreen();
                return;
            } else {
                this.mathTree.insertIntegral();
                this.updateScreen();
                return;
            }
        }

        if (action === "var_x") {
            if (isShift) {
                this.mathTree.insertFunc("sum");
                this.updateScreen();
                return;
            } else if (isAlpha) {
                this.mathTree.insertFunc("prod");
                this.updateScreen();
                return;
            } else {
                this.mathTree.insertChar("x");
                this.updateScreen();
                return;
            }
        }

        if (action === "logab") {
            if (isShift) {
                this.mathTree.insertChar("1");
                this.mathTree.insertChar("0");
                this.mathTree.insertPower();
                this.updateScreen();
                return;
            } else if (isAlpha) {
                this.mathTree.insertFunc("prod");
                this.updateScreen();
                return;
            } else {
                this.mathTree.insertLogBase();
                this.updateScreen();
                return;
            }
        }

        if (action === "div") {
            if (isAlpha) {
                this.mathTree.insertFunc("lcm");
                this.updateScreen();
                return;
            } else if (isShift) {
                this.mathTree.insertFunc("ncr");
                this.updateScreen();
                return;
            }
        }

        if (action === "times") {
            if (isAlpha) {
                this.mathTree.insertFunc("gcd");
                this.updateScreen();
                return;
            } else if (isShift) {
                this.mathTree.insertFunc("npr");
                this.updateScreen();
                return;
            }
        }

        if (action === "plus") {
            if (isShift) {
                this.mathTree.insertFunc("pol");
                this.updateScreen();
                return;
            } else if (isAlpha) {
                this.mathTree.insertFunc("int");
                this.updateScreen();
                return;
            }
        }

        if (action === "minus") {
            if (isShift) {
                this.mathTree.insertFunc("rec");
                this.updateScreen();
                return;
            } else if (isAlpha) {
                this.mathTree.insertFunc("intg");
                this.updateScreen();
                return;
            }
        }

        if (action === "dot") {
            if (isShift) {
                for (const ch of "ran()") this.mathTree.insertChar(ch);
                this.updateScreen();
                return;
            } else if (isAlpha) {
                this.mathTree.insertFunc("ranint");
                this.updateScreen();
                return;
            }
        }

        if (action === "num" && value === "0" && isShift) {
            this.mathTree.insertFunc("rnd");
            this.updateScreen();
            return;
        }

        // Automatic Ans prefix if operator pressed after result
        if (this.result !== null && this.mathTree.isEmpty() && ["plus", "minus", "times", "div", "pow", "pow2"].includes(action)) {
            this.mathTree.insertChar("Ans");
            this.result = null;
        }

        // CALC function handler (Ask for variable value)
        if (this.calcActive) {
            if (action === "equals") {
                if (this.calcInputBuffer.trim() !== "") {
                    const varName = this.calcVars[this.calcVarIndex];
                    this.engine.registers[varName] = parseFloat(this.calcInputBuffer);
                }
                this.calcVarIndex++;
                if (this.calcVarIndex >= this.calcVars.length) {
                    this.calcActive = false;
                    this.executeEquals();
                } else {
                    this.calcInputBuffer = "";
                }
                this.updateScreen();
                return;
            }
            if (action === "ac") {
                this.calcActive = false;
                this.updateScreen();
                return;
            }
            if ((value >= "0" && value <= "9") || value === "." || value === "-") {
                this.calcInputBuffer += value;
                this.updateScreen();
                return;
            }
            return;
        }

        // CALC key in COMP mode
        if (action === "calc" && !isShift && !isAlpha) {
            const exprStr = this.mathTree.toExpressionString();
            const varsInExpr = [];
            ["x", "y", "A", "B", "C", "D", "E", "F"].forEach(v => {
                if (exprStr.includes(v)) varsInExpr.push(v);
            });
            if (varsInExpr.length > 0) {
                this.calcActive = true;
                this.calcVars = varsInExpr;
                this.calcVarIndex = 0;
                this.calcInputBuffer = "";
                this.updateScreen();
                return;
            }
        }

        // COMP Mode Key Handling
        if (action === "ac") {
            if (isShift) {
                this.handlePowerOff();
            } else {
                this.handleAllClear();
            }
            return;
        }
        if (action === "del") {
            this.mathTree.deleteBackward();
            this.updateScreen();
            return;
        }
        if (action === "equals") {
            this.executeEquals();
            return;
        }
        if (action === "sd") {
            this.toggleSDFormat();
            return;
        }
        if (action === "dpad") {
            if (value === "left") this.mathTree.moveLeft();
            else if (value === "right") this.mathTree.moveRight();
            else if (value === "up") {
                const moved = this.mathTree.moveUp();
                if (!moved) this.navigateHistory(-1);
            } else if (value === "down") {
                const moved = this.mathTree.moveDown();
                if (!moved) this.navigateHistory(1);
            }
            this.updateScreen();
            return;
        }

        // Natural 2D Math insertions
        if (action === "frac") {
            if (isShift) {
                this.mathTree.insertMixedFraction();
            } else if (isAlpha) {
                this.mathTree.insertFunc("divR");
            } else {
                this.mathTree.insertFraction();
            }
            this.updateScreen();
            return;
        }
        if (action === "sqrt") {
            if (isShift) {
                // Cube root ³√■
                this.mathTree.insertCubeRoot();
            } else {
                this.mathTree.insertSqrt();
            }
            this.updateScreen();
            return;
        }
        if (action === "pow2") {
            if (isShift) {
                this.mathTree.insertPower("3");
            } else {
                this.mathTree.insertPower("2");
            }
            this.updateScreen();
            return;
        }
        if (action === "pow") {
            if (isShift) {
                // n-th root ^■√■
                this.mathTree.insertNthRoot();
            } else {
                this.mathTree.insertPower();
            }
            this.updateScreen();
            return;
        }
        if (action === "(- )") {
            if (isShift) {
                this.mathTree.insertFunc("log");
            } else if (isAlpha) {
                this.mathTree.insertChar("A");
            } else {
                this.mathTree.insertChar("-");
            }
            this.updateScreen();
            return;
        }
        if (action === "left_paren") {
            if (isShift) {
                this.mathTree.insertAbs();
            } else if (isAlpha) {
                this.mathTree.insertChar("x");
            } else {
                this.mathTree.insertChar("(");
            }
            this.updateScreen();
            return;
        }
        if (action === "right_paren") {
            if (isShift) {
                this.mathTree.insertChar(",");
            } else if (isAlpha) {
                this.mathTree.insertChar("y");
            } else {
                this.mathTree.insertChar(")");
            }
            this.updateScreen();
            return;
        }
        if (action === "sd") {
            if (isAlpha) {
                this.mathTree.insertChar("z");
                this.updateScreen();
                return;
            }
            this.toggleSDFormat();
            return;
        }
        if (action === "m_plus" && isAlpha) {
            this.mathTree.insertChar("M");
            this.updateScreen();
            return;
        }
        if (action === "x^-1") {
            if (isShift) {
                // Factorial
                this.mathTree.insertChar("!");
            } else if (isAlpha) {
                this.mathTree.insertChar("C");
            } else {
                this.mathTree.insertPower("-1");
            }
            this.updateScreen();
            return;
        }
        if (action === "ln") {
            if (isShift) {
                this.mathTree.insertChar("e");
                this.mathTree.insertPower();
            } else {
                this.mathTree.insertFunc("ln");
            }
            this.updateScreen();
            return;
        }
        if (["sin", "cos", "tan"].includes(action)) {
            if (isAlpha) {
                if (action === "sin") this.mathTree.insertChar("D");
                if (action === "cos") this.mathTree.insertChar("E");
                if (action === "tan") this.mathTree.insertChar("F");
                this.updateScreen();
                return;
            }
            let fn = action;
            if (isShift) {
                if (action === "sin") fn = "asin";
                if (action === "cos") fn = "acos";
                if (action === "tan") fn = "atan";
            }
            this.mathTree.insertFunc(fn);
            this.updateScreen();
            return;
        }


        // M+ and M- Memory accumulation
        if (action === "m_plus") {
            const val = this.result !== null ? this.result : this.engine.ans;
            const num = typeof val === "number" ? val : parseFloat(val);
            if (!isNaN(num)) {
                if (isShift) {
                    this.engine.registers.M -= num;
                    this.result = `M = ${this.engine.registers.M}`;
                } else {
                    this.engine.registers.M += num;
                    this.result = `M = ${this.engine.registers.M}`;
                }
                this.updateScreen();
                return;
            }
        }

        // ENG key: shift scientific exponent by 3 powers of 10
        if (action === "eng") {
            if (typeof this.result === "number") {
                this.result = this.result * 1000;
                this.resultEl.innerText = this.result.toExponential(3);
                return;
            }
        }

        // Special characters / modifiers insertion
        let toInsert = value;
        if (isShift) {
            if (action === "exp") toInsert = "π";
            else if (action === "ans") toInsert = "PreAns";
            else if (action === "times") { this.mathTree.insertFunc("npr"); this.updateScreen(); return; }
            else if (action === "div") { this.mathTree.insertFunc("ncr"); this.updateScreen(); return; }
            else if (action === "d_m_s") { this.mathTree.insertFunc("fact"); this.updateScreen(); return; }
        } else if (isAlpha) {
            if (action === "var_x") toInsert = "x";
            else if (action === "exp") toInsert = "e";
            else if (action === "(- )") toInsert = "A";
            else if (action === "d_m_s") toInsert = "B";
            else if (action === "x^-1") toInsert = "C";
            else if (action === "sin") toInsert = "D";
            else if (action === "cos") toInsert = "E";
            else if (action === "tan") toInsert = "F";
            else if (action === "eng") toInsert = "y";
        }

        // In Mode 2 (Complex), ENG key inserts 'i'
        if (this.engine.mode === 2 && action === "eng") {
            toInsert = "i";
        }

        if (toInsert) {
            for (const ch of toInsert) {
                this.mathTree.insertChar(ch);
            }
        }

        this.updateScreen();
    }

    handleInput(charVal, action) {
        this.handleButtonPress(action, charVal, null);
    }

    handleAllClear() {
        this.mathTree.clear();
        this.result = null;
        this.stoDisplayMsg = null;
        this.calcActive = false;
        this.displayFormatToggleState = 0;
        this.classwizOS.closeAllOverlays();
        if (this.classwizOS.activeMode === 5) {
            this.classwizOS.vctResult = null;
        } else if (this.classwizOS.activeMode === 6) {
            this.classwizOS.statShowingResult = false;
        } else if (this.classwizOS.activeMode === 8) {
            this.classwizOS.tableStep = 0;
        } else if (this.classwizOS.activeMode === 9) {
            this.classwizOS.eqnStep = 2;
        } else if (this.classwizOS.activeMode === 11) {
            this.classwizOS.ratioStep = 1;
            this.classwizOS.ratioIndex = 0;
        } else if (this.classwizOS.activeMode === 12) {
            this.classwizOS.verifyResult = null;
        }
        this.updateScreen();
    }

    handleOn() {
        this.handleAllClear();
        this.classwizOS.activeMode = 1;
        this.engine.mode = 1;
        this.updateScreen();
    }

    handlePowerOff() {
        this.handleAllClear();
        this.exprEl.innerHTML = "";
        this.resultEl.innerText = "OFF";
        setTimeout(() => {
            if (this.resultEl.innerText === "OFF") this.resultEl.innerText = "";
        }, 800);
    }

    executeEquals() {
        const exprStr = this.mathTree.toExpressionString();
        if (!exprStr || exprStr.trim() === "") {
            if (this.result !== null) return;
            this.result = "0";
            this.updateScreen();
            return;
        }

        try {
            const rawResult = this.engine.calculate(exprStr);
            this.result = rawResult;
            this.displayFormatToggleState = 0;
            this.renderHistoryList();
            this.updateScreen();
        } catch (err) {
            this.result = err.message || "Syntax ERROR";
            this.updateScreen();
        }
    }

    renderFormattedResult(formatted) {
        if (formatted === null || formatted === undefined || formatted === "") {
            this.resultEl.innerText = "";
            return;
        }
        const str = formatted.toString();
        // Check if fraction with π (e.g. "1/3π" or "-1/3π")
        const piFracMatch = str.match(/^(-?\d+)\/(\d+)π$/);
        if (piFracMatch) {
            const num = piFracMatch[1];
            const den = piFracMatch[2];
            this.resultEl.innerHTML = `
                <span class="cw-result-pi-frac" style="display:inline-flex;align-items:center;vertical-align:middle;">
                    <span class="cw-fraction cw-result-frac" style="margin-right:2px;">
                        <span class="cw-num">${num}</span>
                        <span class="cw-bar"></span>
                        <span class="cw-den">${den}</span>
                    </span>
                    <span class="cw-pi-sym" style="font-family:var(--font-casio);font-size:1.1em;line-height:1;">π</span>
                </span>
            `;
            return;
        }

        // Check if improper fraction (e.g. "5/6" or "-5/6")
        const fracMatch = str.match(/^(-?\d+)\/(\d+)$/);
        if (fracMatch) {
            const num = fracMatch[1];
            const den = fracMatch[2];
            this.resultEl.innerHTML = `
                <span class="cw-fraction cw-result-frac">
                    <span class="cw-num">${num}</span>
                    <span class="cw-bar"></span>
                    <span class="cw-den">${den}</span>
                </span>
            `;
            return;
        }

        // Check if mixed fraction (e.g. "1⌟2/3" or "-1⌟2/3")
        const mixedMatch = str.match(/^(-?\d+)⌟(\d+)\/(\d+)$/);
        if (mixedMatch) {
            const whole = mixedMatch[1];
            const num = mixedMatch[2];
            const den = mixedMatch[3];
            this.resultEl.innerHTML = `
                <span class="cw-mixed cw-result-frac">
                    <span class="cw-whole">${whole}</span>
                    <span class="cw-fraction">
                        <span class="cw-num">${num}</span>
                        <span class="cw-bar"></span>
                        <span class="cw-den">${den}</span>
                    </span>
                </span>
            `;
            return;
        }

        this.resultEl.innerText = str;
    }

    toggleSDFormat() {
        if (this.result === null || typeof this.result === "string") return;

        this.displayFormatToggleState = (this.displayFormatToggleState + 1) % 3;
        this.updateScreen();
    }

    toggleShift() {
        this.shiftActive = !this.shiftActive;
        if (this.shiftActive) this.alphaActive = false;
        this.updateScreen();
    }

    toggleAlpha() {
        this.alphaActive = !this.alphaActive;
        if (this.alphaActive) this.shiftActive = false;
        this.updateScreen();
    }

    openSetupMenu() {
        this.classwizOS.closeAllOverlays();
        this.classwizOS.isSetupOpen = true;
        this.classwizOS.setupPage = 0;
        this.classwizOS.setupCursor = 0;
        this.classwizOS.setupSubmenu = null;
        this.classwizOS.submenuCursor = 0;
        this.updateScreen();
    }

    updateScreen() {
        // Status Indicators & Button Glow
        this.indShift.classList.toggle("active", this.shiftActive);
        this.indAlpha.classList.toggle("active", this.alphaActive);
        this.indSto.classList.toggle("active", this.stoActive || this.rclActive);

        const btnShift = document.querySelector(".c-btn.btn-shift");
        if (btnShift) btnShift.classList.toggle("active", this.shiftActive);
        const btnAlpha = document.querySelector(".c-btn.btn-alpha");
        if (btnAlpha) btnAlpha.classList.toggle("active", this.alphaActive);

        const keypadEl = document.querySelector(".keypad");
        if (keypadEl) {
            keypadEl.classList.toggle("shift-active", this.shiftActive);
            keypadEl.classList.toggle("alpha-active", this.alphaActive);
        }

        const hasMem = this.engine.registers.M !== 0;
        this.indMem.classList.toggle("active", hasMem);

        this.indAngle.innerText = this.engine.angleUnit[0];
        this.indAngle.classList.add("active");

        if (this.indVct) {
            this.indVct.classList.toggle("active", this.classwizOS.activeMode === 5);
        }

        const hasHistory = this.engine.history.length > 0;
        this.indUp.classList.toggle("active", hasHistory && this.engine.historyIndex > 0);
        this.indDown.classList.toggle("active", hasHistory && this.engine.historyIndex < this.engine.history.length - 1);

        // CALC prompt active
        if (this.calcActive && this.calcVars[this.calcVarIndex]) {
            const vName = this.calcVars[this.calcVarIndex];
            const currentVal = this.engine.registers[vName];
            this.exprEl.innerHTML = `<div style="font-weight:bold; font-size:14px;">${vName}?</div>`;
            this.resultEl.innerText = this.calcInputBuffer || currentVal.toString();
            return;
        }

        // ClassWiz Modes & Overlays (Menu, Setup, Reset, Recall, Const, Conv, Solve, Stat, Table, Eqn, Ineq, Ratio)
        const osView = this.classwizOS.renderLCD();

        if (osView.type === "MENU" || osView.type === "SCREEN") {
            this.exprEl.innerHTML = osView.html;
            this.resultEl.style.display = "none";
            this.exprEl.style.height = "100%";
            return;
        }

        this.resultEl.style.display = "flex";
        this.exprEl.style.height = "";

        if (osView.type === "PROMPT") {
            this.exprEl.innerHTML = `<div style="font-size:12px; line-height:1.2; font-weight:bold;">${osView.label}</div>`;
            this.resultEl.innerText = osView.val;
            return;
        }

        // Standard COMP Mode: 2D Natural Display
        if (this.stoDisplayMsg) {
            this.exprEl.innerText = this.stoDisplayMsg;
        } else {
            this.exprEl.innerHTML = this.mathTree.renderHTML();
        }

        // Render Result
        if (this.result !== null) {
            let reqFormat = null;
            if (this.displayFormatToggleState === "dms") reqFormat = "dms";
            else if (this.displayFormatToggleState === 1) reqFormat = "decimal";
            else if (this.displayFormatToggleState === 2) reqFormat = "mixed";
            else reqFormat = "fraction";

            if (typeof this.result === "number" || this.result instanceof Complex) {
                const formatted = this.engine.formatResult(this.result, reqFormat);
                this.renderFormattedResult(formatted);
            } else {
                this.renderFormattedResult(this.result);
            }
        } else if (this.mathTree.isEmpty()) {
            this.resultEl.innerText = "0";
        } else {
            this.resultEl.innerText = "";
        }
    }

    navigateHistory(delta) {
        const hist = this.engine.history;
        if (hist.length === 0) return;

        this.engine.historyIndex += delta;
        if (this.engine.historyIndex < 0) this.engine.historyIndex = 0;
        if (this.engine.historyIndex >= hist.length) {
            this.engine.historyIndex = hist.length;
            this.mathTree.clear();
            this.result = null;
            this.updateScreen();
            return;
        }

        const item = hist[this.engine.historyIndex];
        if (item) {
            this.mathTree.clear();
            for (const ch of item.expression) {
                this.mathTree.insertChar(ch);
            }
            this.result = this.engine.formatResult(item.result);
            this.updateScreen();
        }
    }

    toggleHistoryPanel(open) {
        if (open) {
            this.renderHistoryList();
            this.historyPanel.classList.add("open");
            this.shortcutPanel.classList.remove("open");
            if (this.backdrop) this.backdrop.classList.add("active");
        } else {
            this.historyPanel.classList.remove("open");
            if (this.backdrop && !this.shortcutPanel.classList.contains("open")) {
                this.backdrop.classList.remove("active");
            }
        }
    }

    toggleShortcutPanel(open) {
        if (open) {
            this.shortcutPanel.classList.add("open");
            this.historyPanel.classList.remove("open");
            if (this.backdrop) this.backdrop.classList.add("active");
        } else {
            this.shortcutPanel.classList.remove("open");
            if (this.backdrop && !this.historyPanel.classList.contains("open")) {
                this.backdrop.classList.remove("active");
            }
        }
    }

    renderHistoryList() {
        const hist = this.engine.history;
        if (!this.historyList) return;

        if (hist.length === 0) {
            this.historyList.innerHTML = `<div style="color:#64748b; text-align:center; padding:20px;">Chưa có phép tính nào</div>`;
            return;
        }

        let html = "";
        for (let i = hist.length - 1; i >= 0; i--) {
            const item = hist[i];
            const formatted = this.engine.formatResult(item.result);
            html += `
                <div class="history-item" onclick="window.calcUI.recallHistory(${i})">
                    <div class="history-time">${item.timestamp}</div>
                    <div class="history-expr">${item.expression}</div>
                    <div class="history-res">= ${formatted}</div>
                </div>
            `;
        }
        this.historyList.innerHTML = html;
    }

    recallHistory(index) {
        const item = this.engine.history[index];
        if (item) {
            this.mathTree.clear();
            for (const ch of item.expression) {
                this.mathTree.insertChar(ch);
            }
            this.result = this.engine.formatResult(item.result);
            this.updateScreen();
            this.toggleHistoryPanel(false);
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.calcUI = new CasioUI();
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = CasioUI;
}
