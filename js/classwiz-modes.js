/**
 * Casio fx-580VN X Emulator - ClassWiz Modes & On-Screen Display OS
 * Implements the 12-Icon Menu screen, Mode 6 (Statistics for Grouped Data),
 * Mode 9 (Table f(x)), Mode A (Equation Solver), and Mode B (Inequalities)
 * directly rendered onto the Casio LCD screen.
 */

class ClassWizOS {
    constructor(engine, mathTree) {
        this.engine = engine;
        this.mathTree = mathTree;

        // Current state
        this.activeMode = 1; // 1: COMP, 2: CMPLX, 3: BASE-N, 6: STAT, 9: TABLE, 10: EQN (A), 11: INEQ (B)
        this.isMenuOpen = false;
        this.menuSelection = 0; // 0 to 11

        // Statistics Data State (Mode 6)
        this.statData = [
            { x: 10, freq: 2 },
            { x: 20, freq: 5 },
            { x: 30, freq: 8 },
            { x: 40, freq: 3 }
        ];
        this.statRow = 0;
        this.statCol = 0; // 0: x, 1: freq
        this.statInputBuffer = "";
        this.statShowingResult = false;
        this.statResults = null;

        // Table Mode State (Mode 9)
        this.tableStep = 0; // 0: input f(x), 1: input g(x), 2: Start, 3: End, 4: Step, 5: viewing table
        this.tableFX = "x^2 - 4";
        this.tableGX = "";
        this.tableStart = -2;
        this.tableEnd = 2;
        this.tableStepVal = 1;
        this.tableInputBuffer = "";
        this.tableRows = [];
        this.tableSelectedRow = 0;

        // Equation Mode State (Mode A)
        this.eqnStep = 0; // 0: select type (1: Simult, 2: Poly), 1: select deg/unknowns, 2: input coeffs, 3: viewing results
        this.eqnType = "POLY"; // "POLY" or "SIMULT"
        this.eqnDegree = 2; // 2, 3, 4
        this.eqnCoeffs = [1, -5, 6]; // a, b, c...
        this.eqnCoeffIndex = 0;
        this.eqnInputBuffer = "";
        this.eqnResults = null;
        this.eqnResultIndex = 0;

        // Inequality Mode State (Mode B)
        this.ineqStep = 0; // 0: select degree, 1: select relation, 2: input coeffs, 3: view result
        this.ineqDegree = 2;
        this.ineqRel = ">";
        this.ineqCoeffs = [1, -3, 2];
        this.ineqCoeffIndex = 0;
        this.ineqInputBuffer = "";
        this.ineqResult = null;

        // Overlay Menus: SETUP (SHIFT MENU)
        this.isSetupOpen = false;
        this.setupPage = 0; // 0, 1, 2, 3 (4 pages)
        this.setupCursor = 0; // 0..3 row index
        this.setupSubmenu = null;
        this.submenuCursor = 0;

        // Overlay Menus: RESET (SHIFT 9)
        this.isResetOpen = false;
        this.resetStep = 0; // 0: select, 1: confirm, 2: done
        this.resetTarget = 1; // 1: Setup, 2: Memory, 3: All

        // Overlay Menus: RECALL (SHIFT STO)
        this.isRecallOpen = false;

        // Overlay Menus: CONST (SHIFT 7)
        this.isConstOpen = false;
        this.constCat = null; // 1: Universal, 2: Electromagnetic, 3: Atomic, 4: Phys-Chem

        // Overlay Menus: CONV (SHIFT 8)
        this.isConvOpen = false;
        this.convCat = null; // 1 to 8

        // SOLVE Mode State (SHIFT CALC)
        this.solveActive = false;
        this.solveStep = 0; // 0: prompt var?, 1: view solution
        this.solveExpr = "";
        this.solveDisplayExpr = "";
        this.solveGuess = 0;
        this.solveInputBuffer = "";
        this.solveResult = null;
        this.solveVars = [];
        this.solveVarIndex = 0;
        this.solveTargetVar = "x";

        // Ratio Mode State (Mode 12 / C)
        this.ratioStep = 0; // 0: select type, 1: input coeffs, 2: view result
        this.ratioType = 1; // 1: A:B=X:D, 2: A:B=C:X
        this.ratioCoeffs = [1, 2, 10]; // A, B, D or A, B, C
        this.ratioIndex = 0;
        this.ratioInputBuffer = "";
        this.ratioResult = null;

        // Icons definition for 12 Casio ClassWiz modes (4x3 layout)
        this.menuIcons = [
            { id: 1, key: "1", title: "Tính toán", subtitle: "Calculate", icon: "+−×÷" },
            { id: 2, key: "2", title: "Số phức", subtitle: "Complex", icon: "i" },
            { id: 3, key: "3", title: "Hệ đếm", subtitle: "Base-N", icon: "1010" },
            { id: 4, key: "4", title: "Ma trận", subtitle: "Matrix", icon: "[ ]" },
            { id: 5, key: "5", title: "Véc-tơ", subtitle: "Vector", icon: "→" },
            { id: 6, key: "6", title: "Thống kê", subtitle: "Statistics", icon: "📊" },
            { id: 7, key: "7", title: "Phân phối", subtitle: "Distribution", icon: "🔔" },
            { id: 8, key: "8", title: "Bảng giá trị", subtitle: "Table", icon: "f(x)" },
            { id: 9, key: "9", title: "P.Trình", subtitle: "Equation", icon: "x²=0" },
            { id: 10, key: "A", title: "Bất PT", subtitle: "Inequality", icon: "x²>0" },
            { id: 11, key: "B", title: "Tỉ số", subtitle: "Ratio", icon: "A:B" },
            { id: 12, key: "C", title: "Đúng/Sai", subtitle: "Verify", icon: "✓/✗" }
        ];
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    closeMenu() {
        this.isMenuOpen = false;
    }

    closeAllOverlays() {
        this.isSetupOpen = false;
        this.setupSubmenu = null;
        this.setupCursor = 0;
        this.submenuCursor = 0;
        this.isResetOpen = false;
        this.resetStep = 0;
        this.isRecallOpen = false;
        this.isConstOpen = false;
        this.constCat = null;
        this.isConvOpen = false;
        this.convCat = null;
        this.solveActive = false;
        this.solveStep = 0;
        this.isMenuOpen = false;
    }

    isAnyOverlayOpen() {
        return this.isSetupOpen || this.isResetOpen || this.isRecallOpen || 
               this.isConstOpen || this.isConvOpen || this.solveActive || 
               this.isMenuOpen || (this.ratioStep > 0) ||
               (this.activeMode === 5 && (this.vctStep < 3 || this.vctOptnOpen || this.vctResult !== null));
    }

    selectMenuIndex(index) {
        if (index >= 0 && index < this.menuIcons.length) {
            const item = this.menuIcons[index];
            this.setMode(item.id);
            this.closeMenu();
        }
    }

    selectMenuByKey(keyChar) {
        if (!keyChar) return false;
        const upper = keyChar.toUpperCase();
        if (upper === "8") {
            this.setMode(8);
            this.closeMenu();
            return true;
        }
        if (upper === "9") {
            this.setMode(9);
            this.closeMenu();
            return true;
        }
        if (upper === "A" || keyChar === "(-)" || keyChar === "-") {
            this.setMode(10);
            this.closeMenu();
            return true;
        }
        if (upper === "B" || keyChar === "°" || keyChar === "d_m_s") {
            this.setMode(11);
            this.closeMenu();
            return true;
        }
        if (upper === "C" || keyChar === "x^-1") {
            this.setMode(12);
            this.closeMenu();
            return true;
        }
        const item = this.menuIcons.find(m => m.key.toUpperCase() === upper);
        if (item) {
            this.setMode(item.id);
            this.closeMenu();
            return true;
        }
        return false;
    }

    moveMenu(dx, dy) {
        let col = this.menuSelection % 4;
        let row = Math.floor(this.menuSelection / 4);

        col = (col + dx + 4) % 4;
        row = (row + dy + 3) % 3;

        this.menuSelection = row * 4 + col;
    }

    setMode(modeId) {
        this.activeMode = modeId;
        this.engine.mode = modeId;

        if (modeId === 5) {
            // Setup Mode 5: Vector
            this.vctStep = 0; // 0: Select vector, 1: Select dimension, 2: Input data, 3: Calculation screen
            this.vctSelected = "VctA";
            this.vctDim = 3;
            this.vctData = [0, 0, 0];
            this.vctIndex = 0;
            this.vctInputBuffer = "";
            this.vctOptnOpen = false;
            this.vctOptnPage = 0;
            this.vctResult = null;
            this.mathTree.clear();
        } else if (modeId === 6) {
            // Setup Mode 6: Statistics
            this.statShowingResult = false;
            this.statRow = 0;
            this.statCol = 0;
            this.statInputBuffer = "";
        } else if (modeId === 8) {
            // Setup Mode 8: Table
            this.tableStep = 0;
            this.tableInputBuffer = "";
        } else if (modeId === 9) {
            // Setup Mode 9 (A): Equation
            this.eqnStep = 0;
            this.eqnCoeffIndex = 0;
            this.eqnInputBuffer = "";
        } else if (modeId === 10) {
            // Setup Mode 10 (A): Inequality
            this.ineqStep = 0;
            this.ineqCoeffIndex = 0;
            this.ineqInputBuffer = "";
        } else if (modeId === 11) {
            // Setup Mode 11 (B): Ratio
            this.ratioStep = 0;
            this.ratioIndex = 0;
            this.ratioInputBuffer = "";
            this.ratioResult = null;
        } else if (modeId === 12) {
            // Setup Mode 12 (C): Verify
            this.verifyResult = null;
        }
    }

    // ==========================================
    // KEY DISPATCHER FOR NON-COMP MODES & OVERLAYS
    // ==========================================
    handleKey(keyVal, action) {
        // Priority 1: Casio Overlay Systems
        if (this.isSetupOpen) return this.handleSetupKey(keyVal, action);
        if (this.isResetOpen) return this.handleResetKey(keyVal, action);
        if (this.isRecallOpen) return this.handleRecallKey(keyVal, action);
        if (this.isConstOpen) return this.handleConstKey(keyVal, action);
        if (this.solveActive) return this.handleSolveKey(keyVal, action);

        // Priority 2: 12-Icon Menu
        if (this.isMenuOpen) {
            if (action === "dpad") {
                if (keyVal === "left") this.moveMenu(-1, 0);
                if (keyVal === "right") this.moveMenu(1, 0);
                if (keyVal === "up") this.moveMenu(0, -1);
                if (keyVal === "down") this.moveMenu(0, 1);
            } else if (action === "equals") {
                this.selectMenuIndex(this.menuSelection);
            } else if (action === "ac") {
                this.closeMenu();
            } else if (keyVal) {
                this.selectMenuByKey(keyVal);
            }
            return true;
        }

        // Mode 5: Vector
        if (this.activeMode === 5) {
            return this.handleVectorKey(keyVal, action);
        }

        // Mode 6: Statistics
        if (this.activeMode === 6) {
            return this.handleStatKey(keyVal, action);
        }

        // Mode 8: Table
        if (this.activeMode === 8) {
            return this.handleTableKey(keyVal, action);
        }

        // Mode 9: Equation
        if (this.activeMode === 9) {
            return this.handleEqnKey(keyVal, action);
        }

        // Mode 10: Inequality
        if (this.activeMode === 10) {
            return this.handleIneqKey(keyVal, action);
        }

        // Mode 11: Ratio
        if (this.activeMode === 11) {
            return this.handleRatioKey(keyVal, action);
        }

        // Mode 12: Verify
        if (this.activeMode === 12) {
            return this.handleVerifyKey(keyVal, action);
        }

        return false;
    }

    // ==========================================
    // OVERLAY: SETUP (SHIFT MENU)
    // ==========================================
    handleSetupKey(keyVal, action) {
        if (action === "ac") {
            if (this.setupSubmenu !== null) {
                this.setupSubmenu = null;
                this.submenuCursor = 0;
            } else {
                this.isSetupOpen = false;
                this.setupCursor = 0;
                this.submenuCursor = 0;
            }
            return true;
        }

        // Inside a submenu
        if (this.setupSubmenu !== null) {
            if (this.setupSubmenu === "contrast") {
                if (action === "dpad") {
                    const cur = this.engine.contrast !== undefined ? this.engine.contrast : 8;
                    if (keyVal === "left") {
                        this.engine.contrast = Math.max(0, cur - 1);
                    } else if (keyVal === "right") {
                        this.engine.contrast = Math.min(16, cur + 1);
                    }
                    const screen = document.getElementById("lcd-screen");
                    if (screen) {
                        screen.style.filter = `contrast(${0.7 + this.engine.contrast * 0.0375})`;
                    }
                    return true;
                }
                if (action === "equals" || action === "ac") {
                    this.setupSubmenu = null;
                    this.isSetupOpen = false;
                    this.setupCursor = 0;
                    this.submenuCursor = 0;
                    return true;
                }
                return true;
            }

            const subMenus = {
                input_output: [
                    () => { this.engine.inputOutputMode = "MathI/MathO"; },
                    () => { this.engine.inputOutputMode = "MathI/DecimalO"; },
                    () => { this.engine.inputOutputMode = "LineI/LineO"; },
                    () => { this.engine.inputOutputMode = "LineI/DecimalO"; }
                ],
                angle_unit: [
                    () => { this.engine.setAngleUnit("DEG"); },
                    () => { this.engine.setAngleUnit("RAD"); },
                    () => { this.engine.setAngleUnit("GRA"); }
                ],
                number_format: [
                    () => { this.engine.displayFormat = "FIX"; },
                    () => { this.engine.displayFormat = "SCI"; },
                    () => { this.engine.displayFormat = "NORMAL"; }
                ],
                engineer_symbol: [
                    () => { this.engine.engineerSymbol = true; },
                    () => { this.engine.engineerSymbol = false; }
                ],
                fraction_format: [
                    () => { this.engine.fractionFormat = "ab/c"; },
                    () => { this.engine.fractionFormat = "d/c"; }
                ],
                complex_format: [
                    () => { this.engine.complexFormat = "a+bi"; },
                    () => { this.engine.complexFormat = "r∠θ"; }
                ],
                stat_freq: [
                    () => { this.engine.statFreq = true; },
                    () => { this.engine.statFreq = false; }
                ],
                equation_func: [
                    () => { this.engine.equationComplex = true; },
                    () => { this.engine.equationComplex = false; }
                ],
                table_type: [
                    () => { this.engine.tableType = "f(x)"; },
                    () => { this.engine.tableType = "f(x)/g(x)"; }
                ],
                recurring_dec: [
                    () => { this.engine.recurringDec = true; },
                    () => { this.engine.recurringDec = false; }
                ],
                decimal_mark: [
                    () => { this.engine.decimalMark = "."; },
                    () => { this.engine.decimalMark = ","; }
                ],
                digit_separator: [
                    () => { this.engine.digitSeparator = true; },
                    () => { this.engine.digitSeparator = false; }
                ],
                language: [
                    () => { this.engine.language = "en"; },
                    () => { this.engine.language = "vi"; }
                ],
                contrast: [
                    () => { this.engine.contrast = Math.max(0, (this.engine.contrast || 8) - 1); },
                    () => { this.engine.contrast = Math.min(16, (this.engine.contrast || 8) + 1); }
                ],
                auto_power_off: [
                    () => { this.engine.autoPowerOff = 10; },
                    () => { this.engine.autoPowerOff = 60; }
                ]
            };

            const actionsList = subMenus[this.setupSubmenu] || [];

            if (action === "dpad") {
                if (keyVal === "down") this.submenuCursor = (this.submenuCursor + 1) % actionsList.length;
                if (keyVal === "up") this.submenuCursor = (this.submenuCursor + actionsList.length - 1) % actionsList.length;
                return true;
            }

            let chosenIdx = -1;
            if (action === "equals") {
                chosenIdx = this.submenuCursor;
            } else if (keyVal >= "1" && keyVal <= String(actionsList.length)) {
                chosenIdx = parseInt(keyVal, 10) - 1;
            }

            if (chosenIdx >= 0 && chosenIdx < actionsList.length) {
                actionsList[chosenIdx]();
                this.setupSubmenu = null;
                this.isSetupOpen = false;
                this.setupCursor = 0;
                this.submenuCursor = 0;
                return true;
            }
            return true;
        }

        // On main 4-page Setup screen (Authentic Casio fx-580VN X)
        const isVi = this.engine.language !== "en";
        const pageItems = [
            [
                { label: isVi ? "1: Nhập/Xuất" : "1: Input/Output", sub: "input_output" },
                { label: isVi ? "2: Đơn vị góc" : "2: Angle Unit", sub: "angle_unit" },
                { label: isVi ? "3: Định dạng số" : "3: Number Format", sub: "number_format" },
                { label: isVi ? "4: Ký hiệu k.thuật" : "4: Engineer Symbol", sub: "engineer_symbol" }
            ],
            [
                { label: isVi ? "1: Dạng phân số" : "1: Fraction Result", sub: "fraction_format" },
                { label: isVi ? "2: Số phức" : "2: Complex", sub: "complex_format" },
                { label: isVi ? "3: Thống kê" : "3: Statistics", sub: "stat_freq" },
                { label: isVi ? "4: Phương trình" : "4: Equation/Func", sub: "equation_func" }
            ],
            [
                { label: isVi ? "1: Bảng giá trị" : "1: Table", sub: "table_type" },
                { label: isVi ? "2: S.thập phân t.hoàn" : "2: Recurring Dec", sub: "recurring_dec" },
                { label: isVi ? "3: Dấu thập phân" : "3: Decimal Mark", sub: "decimal_mark" },
                { label: isVi ? "4: Dấu phân cách" : "4: Digit Separator", sub: "digit_separator" }
            ],
            [
                { label: isVi ? "1: Ngôn ngữ" : "1: Language", sub: "language" },
                { label: isVi ? "2: Độ tương phản" : "2: Contrast", sub: "contrast" },
                { label: isVi ? "3: Tự động tắt" : "3: Auto Power Off", sub: "auto_power_off" }
            ]
        ];

        const curPageList = pageItems[this.setupPage] || pageItems[0];

        if (action === "dpad") {
            if (keyVal === "down") {
                if (this.setupCursor < curPageList.length - 1) {
                    this.setupCursor++;
                } else {
                    this.setupPage = (this.setupPage + 1) % 4;
                    this.setupCursor = 0;
                }
                return true;
            }
            if (keyVal === "up") {
                if (this.setupCursor > 0) {
                    this.setupCursor--;
                } else {
                    this.setupPage = (this.setupPage + 3) % 4;
                    const prevList = pageItems[this.setupPage];
                    this.setupCursor = prevList.length - 1;
                }
                return true;
            }
            if (keyVal === "right") {
                this.setupPage = (this.setupPage + 1) % 4;
                this.setupCursor = 0;
                return true;
            }
            if (keyVal === "left") {
                this.setupPage = (this.setupPage + 3) % 4;
                this.setupCursor = 0;
                return true;
            }
            return true;
        }

        // Selection via [ = ]
        if (action === "equals") {
            if (curPageList[this.setupCursor]) {
                this.setupSubmenu = curPageList[this.setupCursor].sub;
                this.submenuCursor = 0;
                return true;
            }
        }

        // Selection via number key 1..4
        const numIdx = parseInt(keyVal, 10) - 1;
        if (!isNaN(numIdx) && curPageList[numIdx]) {
            this.setupSubmenu = curPageList[numIdx].sub;
            this.submenuCursor = 0;
            return true;
        }

        return true;
    }

    // ==========================================
    // OVERLAY: RESET (SHIFT 9)
    // ==========================================
    handleResetKey(keyVal, action) {
        if (this.resetStep === 0) {
            if (action === "ac") {
                this.isResetOpen = false;
                return true;
            }
            if (keyVal === "1" || keyVal === "2" || keyVal === "3") {
                this.resetTarget = parseInt(keyVal, 10);
                this.resetStep = 1;
                return true;
            }
            return true;
        }

        if (this.resetStep === 1) {
            if (action === "equals") {
                if (this.resetTarget === 1) {
                    this.engine.resetSetup();
                } else if (this.resetTarget === 2) {
                    this.engine.resetMemory();
                } else if (this.resetTarget === 3) {
                    this.engine.resetAll();
                    this.activeMode = 1;
                }
                this.resetStep = 2;
                return true;
            }
            if (action === "ac") {
                this.isResetOpen = false;
                return true;
            }
            return true;
        }

        if (this.resetStep === 2) {
            if (action === "ac" || action === "equals") {
                this.isResetOpen = false;
                return true;
            }
            return true;
        }

        return false;
    }

    // ==========================================
    // OVERLAY: RECALL (SHIFT STO)
    // ==========================================
    handleRecallKey(keyVal, action) {
        if (action === "ac") {
            this.isRecallOpen = false;
            return true;
        }

        // If variable key pressed, insert it and close recall
        const varMap = {
            "(- )": "A", "d_m_s": "B", "x^-1": "C", "sin": "D", "cos": "E", "tan": "F",
            "sto": "x", "eng": "y", "left_paren": "z", "m_plus": "M",
            "A": "A", "B": "B", "C": "C", "D": "D", "E": "E", "F": "F",
            "x": "x", "y": "y", "z": "z", "M": "M"
        };
        const varName = varMap[action] || varMap[keyVal];
        if (varName && this.engine.registers.hasOwnProperty(varName)) {
            this.mathTree.insertChar(varName);
            this.isRecallOpen = false;
            return true;
        }
        return true;
    }

    // ==========================================
    // OVERLAY: CONSTANTS (SHIFT 7)
    // ==========================================
    handleConstKey(keyVal, action) {
        if (action === "ac") {
            if (this.constCat !== null) {
                this.constCat = null;
            } else {
                this.isConstOpen = false;
            }
            return true;
        }

        if (this.constCat === null) {
            const cat = parseInt(keyVal, 10);
            if (cat >= 1 && cat <= 4) {
                this.constCat = cat;
            }
            return true;
        }

        const idx = parseInt(keyVal, 10) - 1;
        const catObj = this.engine.constructor.CONSTANTS[this.constCat];
        if (catObj && catObj.list[idx]) {
            const item = catObj.list[idx];
            // Insert constant value into mathTree
            const valStr = item.value.toString();
            for (const ch of valStr) {
                this.mathTree.insertChar(ch);
            }
            this.isConstOpen = false;
            this.constCat = null;
            return true;
        }
        return true;
    }

    // ==========================================
    // OVERLAY: CONVERSIONS (SHIFT 8)
    // ==========================================
    handleConvKey(keyVal, action) {
        if (action === "ac") {
            if (this.convCat !== null) {
                this.convCat = null;
            } else {
                this.isConvOpen = false;
            }
            return true;
        }

        if (this.convCat === null) {
            const cat = parseInt(keyVal, 10);
            if (cat >= 1 && cat <= 8) {
                this.convCat = cat;
            }
            return true;
        }

        const idx = parseInt(keyVal, 10) - 1;
        const catObj = this.engine.constructor.CONVERSIONS[this.convCat];
        if (catObj && catObj.list[idx]) {
            const conv = catObj.list[idx];
            const currentVal = (typeof window !== "undefined" && window.calcUI && window.calcUI.result !== null)
                ? Number(window.calcUI.result)
                : Number(this.engine.ans || 0);

            let converted = 0;
            if (conv.op === "mul") converted = currentVal * conv.factor;
            else if (conv.op === "div") converted = currentVal / conv.factor;
            else if (conv.fn) converted = conv.fn(currentVal);

            if (typeof window !== "undefined" && window.calcUI) {
                window.calcUI.result = converted;
            }
            this.engine.ans = converted;
            this.isConvOpen = false;
            this.convCat = null;
            return true;
        }
        return true;
    }

    // ==========================================
    // OVERLAY: SOLVE (SHIFT CALC)
    // ==========================================
    initSolve(exprStr, displayStr, htmlExpr = null) {
        this.closeAllOverlays();
        if (typeof exprStr !== "string") {
            if (exprStr && typeof exprStr.toExpressionString === "function") {
                displayStr = exprStr.toReadableString ? exprStr.toReadableString() : exprStr.toExpressionString();
                htmlExpr = exprStr.renderHTML ? exprStr.renderHTML(false) : null;
                exprStr = exprStr.toExpressionString();
            } else {
                exprStr = String(exprStr || "x = 0");
            }
        }
        this.solveActive = true;
        this.solveStep = 0;
        this.solveExpr = exprStr || "x = 0";
        this.solveDisplayExpr = displayStr || exprStr || "x = 0";
        this.solveHtmlExpr = htmlExpr || null;
        this.solveInputBuffer = "";
        this.solveResult = null;

        // Detect all variables in equation (A, B, C, D, E, F, M, x, y)
        const varMatches = exprStr.match(/\b([A-Fa-fMmxXyY])\b/g) || [];
        const uniqueVars = [];
        for (const v of varMatches) {
            const u = v.toLowerCase();
            if (["a", "b", "c", "d", "e", "f", "m", "x", "y"].includes(u)) {
                if (!uniqueVars.includes(u)) uniqueVars.push(u);
            }
        }

        let target = uniqueVars.includes("x") ? "x" : (uniqueVars.length > 0 ? uniqueVars[uniqueVars.length - 1] : "x");
        this.solveTargetVar = target;

        const otherVars = uniqueVars.filter(v => v !== target);
        this.solveVars = [...otherVars, target];
        if (this.solveVars.length === 0) {
            this.solveVars = ["x"];
        }
        this.solveVarIndex = 0;
    }

    handleSolveKey(keyVal, action) {
        const currentVar = (this.solveVars[this.solveVarIndex] || "x").toLowerCase();

        if (this.solveStep === 0) {
            // Variable prompt step
            if (action === "equals" || action === "calc") {
                if (this.solveInputBuffer.trim() !== "") {
                    try {
                        const parsed = this.engine.calculate(this.solveInputBuffer);
                        this.engine.registers[currentVar] = typeof parsed === "number" ? parsed : parseFloat(parsed) || 0;
                    } catch (e) {
                        this.engine.registers[currentVar] = parseFloat(this.solveInputBuffer) || 0;
                    }
                    this.solveInputBuffer = "";
                }

                if (currentVar === this.solveTargetVar) {
                    const SolversClass = typeof CasioSolvers !== "undefined" ? CasioSolvers : require("./solvers.js").CasioSolvers;
                    const solvers = new SolversClass(this.engine);
                    const guess = this.engine.registers[this.solveTargetVar] || 0;
                    const res = solvers.solveEquationNewton(this.solveExpr, guess, this.solveTargetVar);
                    if (res) {
                        this.solveResult = res;
                        this.engine.registers[this.solveTargetVar] = res.x;
                        this.engine.ans = res.x;
                        this.solveStep = 1;
                    }
                    return true;
                } else {
                    this.solveVarIndex = (this.solveVarIndex + 1) % this.solveVars.length;
                    return true;
                }
            }

            if (action === "down") {
                if (this.solveInputBuffer.trim() !== "") {
                    try {
                        const parsed = this.engine.calculate(this.solveInputBuffer);
                        this.engine.registers[currentVar] = typeof parsed === "number" ? parsed : parseFloat(parsed) || 0;
                    } catch (e) {
                        this.engine.registers[currentVar] = parseFloat(this.solveInputBuffer) || 0;
                    }
                    this.solveInputBuffer = "";
                }
                this.solveVarIndex = (this.solveVarIndex + 1) % this.solveVars.length;
                return true;
            }

            if (action === "up") {
                if (this.solveInputBuffer.trim() !== "") {
                    try {
                        const parsed = this.engine.calculate(this.solveInputBuffer);
                        this.engine.registers[currentVar] = typeof parsed === "number" ? parsed : parseFloat(parsed) || 0;
                    } catch (e) {
                        this.engine.registers[currentVar] = parseFloat(this.solveInputBuffer) || 0;
                    }
                    this.solveInputBuffer = "";
                }
                this.solveVarIndex = (this.solveVarIndex - 1 + this.solveVars.length) % this.solveVars.length;
                return true;
            }

            if (action === "ac") {
                this.solveActive = false;
                return true;
            }

            if (action === "del") {
                if (this.solveInputBuffer.length > 0) {
                    this.solveInputBuffer = this.solveInputBuffer.slice(0, -1);
                }
                return true;
            }

            if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-" || keyVal === "+" || keyVal === "*" || keyVal === "/") {
                this.solveInputBuffer += keyVal;
                return true;
            }

            return true;
        }

        if (this.solveStep === 1) {
            if (action === "ac") {
                this.solveActive = false;
                return true;
            }
            if (action === "left") {
                this.solveActive = false;
                return "cursor_start";
            }
            if (action === "right") {
                this.solveActive = false;
                return "cursor_end";
            }
            if (action === "equals") {
                return true; // Stay on solution screen
            }
            return true;
        }

        return false;
    }

    // ==========================================
    // MODE 12 (C): RATIO (TỈ SỐ)
    // ==========================================
    handleRatioKey(keyVal, action) {
        if (this.ratioStep === 0) {
            if (keyVal === "1") {
                this.ratioType = 1; // A:B = X:D
                this.ratioCoeffs = [1, 2, 10];
                this.ratioIndex = 0;
                this.ratioInputBuffer = "";
                this.ratioStep = 1;
            } else if (keyVal === "2") {
                this.ratioType = 2; // A:B = C:X
                this.ratioCoeffs = [1, 2, 10];
                this.ratioIndex = 0;
                this.ratioInputBuffer = "";
                this.ratioStep = 1;
            }
            return true;
        }

        if (this.ratioStep === 1) {
            if (action === "equals") {
                if (this.ratioInputBuffer.trim() !== "") {
                    this.ratioCoeffs[this.ratioIndex] = parseFloat(this.ratioInputBuffer) || 0;
                    this.ratioInputBuffer = "";
                }
                this.ratioIndex++;
                if (this.ratioIndex >= 3) {
                    const SolversClass = typeof CasioSolvers !== "undefined" ? CasioSolvers : require("./solvers.js").CasioSolvers;
                    const solvers = new SolversClass(this.engine);
                    const [c1, c2, c3] = this.ratioCoeffs;
                    if (this.ratioType === 1) {
                        // A:B = X:D
                        this.ratioResult = solvers.solveRatio(1, c1, c2, null, c3);
                    } else {
                        // A:B = C:X
                        this.ratioResult = solvers.solveRatio(2, c1, c2, c3, null);
                    }
                    this.ratioStep = 2;
                }
                return true;
            }
            if (action === "del" && this.ratioInputBuffer.length > 0) {
                this.ratioInputBuffer = this.ratioInputBuffer.slice(0, -1);
                return true;
            }
            if (action === "ac") {
                this.ratioInputBuffer = "";
                return true;
            }
            if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-") {
                this.ratioInputBuffer += keyVal;
                return true;
            }
            return true;
        }

        if (this.ratioStep === 2) {
            if (action === "ac") {
                this.ratioStep = 1;
                this.ratioIndex = 0;
                this.ratioInputBuffer = "";
                return true;
            }
            return true;
        }

        return false;
    }

    // ==========================================
    // MODE 12 (C): VERIFY (ĐÚNG / SAI)
    // ==========================================
    handleVerifyKey(keyVal, action) {
        if (action === "ac") {
            this.verifyResult = null;
            this.mathTree.clear();
            return true;
        }
        if (action === "equals") {
            const expr = this.mathTree.toExpressionString();
            this.verifyResult = this.evaluateVerify(expr);
            return true;
        }
        return false;
    }

    evaluateVerify(expr) {
        try {
            if (!expr || expr.trim() === "") return "";
            if (expr.includes(">=")) {
                const parts = expr.split(">=");
                return this.engine.calculate(parts[0]) >= this.engine.calculate(parts[1]) ? "ĐÚNG (True)" : "SAI (False)";
            } else if (expr.includes("<=")) {
                const parts = expr.split("<=");
                return this.engine.calculate(parts[0]) <= this.engine.calculate(parts[1]) ? "ĐÚNG (True)" : "SAI (False)";
            } else if (expr.includes("!=")) {
                const parts = expr.split("!=");
                return Math.abs(this.engine.calculate(parts[0]) - this.engine.calculate(parts[1])) >= 1e-9 ? "ĐÚNG (True)" : "SAI (False)";
            } else if (expr.includes("=")) {
                const parts = expr.split("=");
                if (parts.length === 2) {
                    const l = this.engine.calculate(parts[0]);
                    const r = this.engine.calculate(parts[1]);
                    return Math.abs(l - r) < 1e-9 ? "ĐÚNG (True)" : "SAI (False)";
                }
            } else if (expr.includes(">")) {
                const parts = expr.split(">");
                return this.engine.calculate(parts[0]) > this.engine.calculate(parts[1]) ? "ĐÚNG (True)" : "SAI (False)";
            } else if (expr.includes("<")) {
                const parts = expr.split("<");
                return this.engine.calculate(parts[0]) < this.engine.calculate(parts[1]) ? "ĐÚNG (True)" : "SAI (False)";
            }
            return "Cú pháp: [A] = [B]";
        } catch (e) {
            return "Lỗi cú pháp";
        }
    }

    // ==========================================
    // MODE 5: VECTOR (VÉC-TƠ)
    // ==========================================
    handleVectorKey(keyVal, action) {
        // Step 0: Select Vector to define (1: VctA, 2: VctB, 3: VctC, 4: VctD)
        if (this.vctStep === 0) {
            if (["1", "2", "3", "4"].includes(keyVal)) {
                const names = ["VctA", "VctB", "VctC", "VctD"];
                this.vctSelected = names[parseInt(keyVal, 10) - 1];
                this.vctStep = 1;
                return true;
            }
            if (action === "ac") {
                this.vctStep = 3; // Proceed to calculation screen
                return true;
            }
            if (action === "optn") {
                this.vctStep = 3;
                this.vctOptnOpen = true;
                this.vctOptnPage = 0;
                return true;
            }
            return true;
        }

        // Step 1: Select Dimension (2 or 3)
        if (this.vctStep === 1) {
            if (keyVal === "2" || keyVal === "3") {
                this.vctDim = parseInt(keyVal, 10);
                const existing = this.engine.vectors && this.engine.vectors[this.vctSelected];
                if (existing && existing.dim === this.vctDim) {
                    this.vctData = [...existing.data];
                } else {
                    this.vctData = this.vctDim === 2 ? [0, 0] : [0, 0, 0];
                }
                this.vctIndex = 0;
                this.vctInputBuffer = "";
                this.vctStep = 2;
                return true;
            }
            if (action === "ac") {
                this.vctStep = 0;
                return true;
            }
            return true;
        }

        // Step 2: Data Input Editor Matrix [ 0 0 0 ]
        if (this.vctStep === 2) {
            const VectorClass = typeof CasioVector !== "undefined" ? CasioVector : (typeof window !== "undefined" && window.CasioVector ? window.CasioVector : require("./calc-engine.js").CasioVector);

            if (action === "equals") {
                if (this.vctInputBuffer.trim() !== "") {
                    this.vctData[this.vctIndex] = parseFloat(this.vctInputBuffer) || 0;
                    this.vctInputBuffer = "";
                }
                this.engine.vectors[this.vctSelected] = new VectorClass(this.vctData);
                // Cycle to next cell within the vector
                this.vctIndex = (this.vctIndex + 1) % this.vctDim;
                return true;
            }
            if (action === "ac") {
                if (this.vctInputBuffer.trim() !== "") {
                    this.vctData[this.vctIndex] = parseFloat(this.vctInputBuffer) || 0;
                    this.vctInputBuffer = "";
                }
                this.engine.vectors[this.vctSelected] = new VectorClass(this.vctData);
                this.vctStep = 3; // Enter calculation screen
                return true;
            }
            if (action === "optn") {
                if (this.vctInputBuffer.trim() !== "") {
                    this.vctData[this.vctIndex] = parseFloat(this.vctInputBuffer) || 0;
                    this.vctInputBuffer = "";
                }
                this.engine.vectors[this.vctSelected] = new VectorClass(this.vctData);
                this.vctStep = 3;
                this.vctOptnOpen = true;
                this.vctOptnPage = 0;
                return true;
            }
            if (action === "dpad" || action === "left" || action === "right") {
                if (this.vctInputBuffer.trim() !== "") {
                    this.vctData[this.vctIndex] = parseFloat(this.vctInputBuffer) || 0;
                    this.vctInputBuffer = "";
                    this.engine.vectors[this.vctSelected] = new VectorClass(this.vctData);
                }
                if (keyVal === "left" || action === "left") this.vctIndex = Math.max(0, this.vctIndex - 1);
                if (keyVal === "right" || action === "right") this.vctIndex = Math.min(this.vctDim - 1, this.vctIndex + 1);
                return true;
            }
            if (action === "del") {
                if (this.vctInputBuffer.length > 0) {
                    this.vctInputBuffer = this.vctInputBuffer.slice(0, -1);
                }
                return true;
            }
            if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-") {
                this.vctInputBuffer += keyVal;
                return true;
            }
            return true;
        }

        // Step 3: Vector Calculation Screen
        if (this.vctStep === 3) {
            if (action === "optn") {
                this.vctOptnOpen = !this.vctOptnOpen;
                this.vctOptnPage = 0;
                return true;
            }

            if (this.vctOptnOpen) {
                if (action === "ac") {
                    this.vctOptnOpen = false;
                    return true;
                }
                if (action === "dpad" || action === "down" || action === "up") {
                    if (keyVal === "down" || action === "down") this.vctOptnPage = Math.min(2, (this.vctOptnPage || 0) + 1);
                    if (keyVal === "up" || action === "up") this.vctOptnPage = Math.max(0, (this.vctOptnPage || 0) - 1);
                    return true;
                }

                const page = this.vctOptnPage || 0;
                if (page === 0) {
                    if (keyVal === "1") { this.vctStep = 0; this.vctOptnOpen = false; return true; }
                    if (keyVal === "2") { this.vctStep = 0; this.vctOptnOpen = false; return true; }
                    if (keyVal === "3") { this.mathTree.insertVectorToken("VctA"); this.vctOptnOpen = false; return true; }
                    if (keyVal === "4") { this.mathTree.insertVectorToken("VctB"); this.vctOptnOpen = false; return true; }
                } else if (page === 1) {
                    if (keyVal === "1") { this.mathTree.insertVectorToken("VctC"); this.vctOptnOpen = false; return true; }
                    if (keyVal === "2") { this.mathTree.insertVectorToken("VctD"); this.vctOptnOpen = false; return true; }
                    if (keyVal === "3") { this.mathTree.insertVectorToken("VctAns"); this.vctOptnOpen = false; return true; }
                    if (keyVal === "4") { this.mathTree.insertVectorToken("•"); this.vctOptnOpen = false; return true; }
                } else if (page === 2) {
                    if (keyVal === "1") { this.mathTree.insertFunc("angle"); this.vctOptnOpen = false; return true; }
                    if (keyVal === "2") { this.mathTree.insertFunc("unitv"); this.vctOptnOpen = false; return true; }
                }
                return true;
            }

            // In calculation mode (not in OPTN menu)
            if (action === "equals") {
                const expr = this.mathTree.toExpressionString();
                if (!expr || expr.trim() === "") return true;
                try {
                    const res = this.engine.calculate(expr);
                    this.vctResult = res;
                    this.vctSelectedResultIdx = 0;
                    const VectorClass = typeof CasioVector !== "undefined" ? CasioVector : (typeof window !== "undefined" && window.CasioVector ? window.CasioVector : require("./calc-engine.js").CasioVector);
                    if (res instanceof VectorClass) {
                        this.engine.vectors.VctAns = res;
                    } else {
                        this.engine.ans = res;
                    }
                } catch (e) {
                    this.vctResult = e.message || "Math ERROR";
                }
                return true;
            }

            if (this.vctResult !== null) {
                const VectorClass = typeof CasioVector !== "undefined" ? CasioVector : (typeof window !== "undefined" && window.CasioVector ? window.CasioVector : require("./calc-engine.js").CasioVector);
                const isVec = this.vctResult instanceof VectorClass;

                if (action === "ac" || action === "del") {
                    this.vctResult = null;
                    return true;
                }
                if (action === "dpad" || action === "left" || action === "right") {
                    if (isVec) {
                        if (keyVal === "left" || action === "left") this.vctSelectedResultIdx = Math.max(0, (this.vctSelectedResultIdx || 0) - 1);
                        if (keyVal === "right" || action === "right") this.vctSelectedResultIdx = Math.min(this.vctResult.dim - 1, (this.vctSelectedResultIdx || 0) + 1);
                        return true;
                    } else {
                        this.vctResult = null;
                        return true;
                    }
                }
                // When an operator is pressed (+, -, *, /) directly after a result:
                if (["+", "-", "*", "/", "•"].includes(keyVal) || ["add", "sub", "mul", "div"].includes(action)) {
                    if (isVec) {
                        this.mathTree.clear();
                        this.mathTree.insertVectorToken("VctAns");
                    } else {
                        this.mathTree.clear();
                        this.mathTree.insertChar("Ans");
                    }
                    this.vctResult = null;
                    return false; // Let ui.js insert the operator
                }
                // Number pressed: start new calculation
                this.vctResult = null;
                this.mathTree.clear();
                return false;
            }

            if (action === "ac") {
                this.mathTree.clear();
                this.vctResult = null;
                return true;
            }

            // Return false so standard keys (numbers, +, -, *, /, (, ), abs) enter mathTree
            return false;
        }

        return false;
    }

    // ==========================================
    // MODE 6: STATISTICS (THỐNG KÊ GHÉP NHÓM)
    // ==========================================
    handleStatKey(keyVal, action) {
        if (this.statShowingResult) {
            if (action === "ac" || action === "optn") {
                this.statShowingResult = false;
                return true;
            }
            if (action === "dpad" && keyVal === "down") {
                this.statResultIndex = Math.min((this.statResultIndex || 0) + 1, 11);
                return true;
            }
            if (action === "dpad" && keyVal === "up") {
                this.statResultIndex = Math.max((this.statResultIndex || 0) - 1, 0);
                return true;
            }
            return true;
        }

        if (action === "optn") {
            // Calculate 1-Var Statistics
            this.computeStatResults();
            this.statShowingResult = true;
            this.statResultIndex = 0;
            return true;
        }

        if (action === "ac") {
            // Clear input buffer or exit
            this.statInputBuffer = "";
            return true;
        }

        if (action === "del") {
            if (this.statInputBuffer.length > 0) {
                this.statInputBuffer = this.statInputBuffer.slice(0, -1);
            }
            return true;
        }

        if (action === "dpad") {
            if (keyVal === "left") this.statCol = 0;
            if (keyVal === "right") this.statCol = 1;
            if (keyVal === "up") this.statRow = Math.max(0, this.statRow - 1);
            if (keyVal === "down") this.statRow = Math.min(this.statData.length - 1, this.statRow + 1);
            this.statInputBuffer = "";
            return true;
        }

        if (action === "equals") {
            // Commit buffer
            if (this.statInputBuffer.trim() !== "") {
                const num = parseFloat(this.statInputBuffer);
                if (!isNaN(num)) {
                    if (this.statCol === 0) {
                        this.statData[this.statRow].x = num;
                    } else {
                        this.statData[this.statRow].freq = num;
                    }
                }
                this.statInputBuffer = "";
            }

            // Move to next row
            if (this.statRow === this.statData.length - 1 && this.statData.length < 20) {
                this.statData.push({ x: 0, freq: 1 });
            }
            this.statRow = Math.min(this.statData.length - 1, this.statRow + 1);
            return true;
        }

        // Input digits / decimal / negative
        if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-") {
            this.statInputBuffer += keyVal;
            return true;
        }

        return false;
    }

    computeStatResults() {
        let sumX = 0;
        let sumX2 = 0;
        let n = 0;
        const expanded = [];

        for (const row of this.statData) {
            const freq = Math.max(0, row.freq);
            sumX += row.x * freq;
            sumX2 += row.x * row.x * freq;
            n += freq;
            for (let i = 0; i < freq; i++) {
                expanded.push(row.x);
            }
        }

        if (n === 0) {
            this.statResults = null;
            return;
        }

        expanded.sort((a, b) => a - b);
        const mean = sumX / n;
        const variancePop = sumX2 / n - mean * mean;
        const varianceSample = n > 1 ? (sumX2 - (sumX * sumX) / n) / (n - 1) : 0;
        const sigmaPop = Math.sqrt(Math.max(0, variancePop));
        const sSample = Math.sqrt(Math.max(0, varianceSample));

        const min = expanded[0];
        const max = expanded[expanded.length - 1];

        const getQuantile = (q) => {
            const pos = (expanded.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
            if (expanded[base + 1] !== undefined) {
                return expanded[base] + rest * (expanded[base + 1] - expanded[base]);
            }
            return expanded[base];
        };

        const q1 = getQuantile(0.25);
        const med = getQuantile(0.5);
        const q3 = getQuantile(0.75);

        this.statResults = {
            mean: parseFloat(mean.toFixed(6)),
            sumX: parseFloat(sumX.toFixed(6)),
            sumX2: parseFloat(sumX2.toFixed(6)),
            sigmaPop: parseFloat(sigmaPop.toFixed(6)),
            sSample: parseFloat(sSample.toFixed(6)),
            variance: parseFloat(varianceSample.toFixed(6)),
            n: n,
            min: min,
            q1: parseFloat(q1.toFixed(6)),
            med: parseFloat(med.toFixed(6)),
            q3: parseFloat(q3.toFixed(6)),
            max: max
        };
    }

    // ==========================================
    // MODE 9: TABLE (BẢNG GIÁ TRỊ)
    // ==========================================
    handleTableKey(keyVal, action) {
        if (this.tableStep === 5) {
            // Viewing table rows
            if (action === "ac") {
                this.tableStep = 0;
                return true;
            }
            if (action === "dpad") {
                if (keyVal === "down") this.tableSelectedRow = Math.min(this.tableRows.length - 1, this.tableSelectedRow + 1);
                if (keyVal === "up") this.tableSelectedRow = Math.max(0, this.tableSelectedRow - 1);
                return true;
            }
            return true;
        }

        if (action === "equals") {
            if (this.tableStep === 0) {
                // f(x)
                if (this.tableInputBuffer.trim()) this.tableFX = this.tableInputBuffer;
                this.tableInputBuffer = "";
                this.tableStep = 1;
            } else if (this.tableStep === 1) {
                // g(x)
                this.tableGX = this.tableInputBuffer.trim();
                this.tableInputBuffer = "";
                this.tableStep = 2; // Start
            } else if (this.tableStep === 2) {
                if (this.tableInputBuffer.trim()) this.tableStart = parseFloat(this.tableInputBuffer);
                this.tableInputBuffer = "";
                this.tableStep = 3; // End
            } else if (this.tableStep === 3) {
                if (this.tableInputBuffer.trim()) this.tableEnd = parseFloat(this.tableInputBuffer);
                this.tableInputBuffer = "";
                this.tableStep = 4; // Step
            } else if (this.tableStep === 4) {
                if (this.tableInputBuffer.trim()) this.tableStepVal = parseFloat(this.tableInputBuffer);
                this.tableInputBuffer = "";

                // Generate table rows
                this.generateTable();
                this.tableStep = 5;
                this.tableSelectedRow = 0;
            }
            return true;
        }

        if (action === "ac") {
            this.tableInputBuffer = "";
            return true;
        }

        if (action === "del") {
            if (this.tableInputBuffer.length > 0) this.tableInputBuffer = this.tableInputBuffer.slice(0, -1);
            return true;
        }

        // Input
        if (keyVal) {
            this.tableInputBuffer += keyVal;
            return true;
        }

        return false;
    }

    generateTable() {
        const rows = [];
        const start = this.tableStart;
        const end = this.tableEnd;
        const step = Math.max(0.1, this.tableStepVal || 1);
        const total = Math.min(30, Math.floor((end - start) / step) + 1);

        for (let i = 0; i < total; i++) {
            const x = parseFloat((start + i * step).toFixed(6));
            this.engine.registers.x = x;
            let fx = "ERROR";
            try {
                const res = this.engine.calculate(this.tableFX);
                fx = typeof res === "number" ? parseFloat(res.toFixed(4)) : res.toString();
            } catch (e) {
                fx = "ERROR";
            }

            let gx = null;
            if (this.tableGX) {
                try {
                    const resG = this.engine.calculate(this.tableGX);
                    gx = typeof resG === "number" ? parseFloat(resG.toFixed(4)) : resG.toString();
                } catch (e) {
                    gx = "ERROR";
                }
            }
            rows.push({ x, fx, gx });
        }
        this.tableRows = rows;
    }

    // ==========================================
    // MODE 10 (A): EQUATION SOLVER
    // ==========================================
    handleEqnKey(keyVal, action) {
        if (this.eqnStep === 0) {
            // Select 1: Simult Eq, 2: Polynomial
            if (keyVal === "1") {
                this.eqnType = "SIMULT";
                this.eqnStep = 1;
            } else if (keyVal === "2") {
                this.eqnType = "POLY";
                this.eqnStep = 1;
            }
            return true;
        }

        if (this.eqnStep === 1) {
            const d = parseInt(keyVal, 10);
            if (d >= 2 && d <= 4) {
                if (this.eqnType === "POLY") {
                    this.eqnDegree = d;
                    this.eqnCoeffs = new Array(d + 1).fill(0);
                    this.eqnCoeffs[0] = 1; // default a=1
                    this.eqnCoeffIndex = 0;
                    this.eqnInputBuffer = "";
                    this.eqnStep = 2;
                } else {
                    // SIMULT: d unknowns
                    this.simultDim = d;
                    this.simultMatrix = Array.from({ length: d }, () => new Array(d + 1).fill(0));
                    this.simultRow = 0;
                    this.simultCol = 0;
                    this.eqnInputBuffer = "";
                    this.eqnStep = 2;
                }
            }
            return true;
        }

        if (this.eqnStep === 2) {
            if (this.eqnType === "POLY") {
                if (action === "equals") {
                    if (this.eqnInputBuffer.trim() !== "") {
                        this.eqnCoeffs[this.eqnCoeffIndex] = parseFloat(this.eqnInputBuffer);
                        this.eqnInputBuffer = "";
                    }
                    this.eqnCoeffIndex++;
                    if (this.eqnCoeffIndex >= this.eqnCoeffs.length) {
                        this.solveEquation();
                        this.eqnStep = 3;
                        this.eqnResultIndex = 0;
                    }
                    return true;
                }
            } else {
                // SIMULT
                if (action === "equals") {
                    if (this.eqnInputBuffer.trim() !== "") {
                        this.simultMatrix[this.simultRow][this.simultCol] = parseFloat(this.eqnInputBuffer);
                        this.eqnInputBuffer = "";
                    }
                    this.simultCol++;
                    if (this.simultCol > this.simultDim) {
                        this.simultCol = 0;
                        this.simultRow++;
                    }
                    if (this.simultRow >= this.simultDim) {
                        const solvers = new CasioSolvers(this.engine);
                        const res = solvers.solveSimultaneous(this.simultMatrix);
                        const list = [];
                        if (res.status === "SUCCESS") {
                            res.results.forEach(r => list.push({ label: `${r.var} =`, val: r.value.toString() }));
                        } else {
                            list.push({ label: "Kết quả", val: res.message });
                        }
                        this.eqnResults = list;
                        this.eqnStep = 3;
                        this.eqnResultIndex = 0;
                    }
                    return true;
                }
            }

            if (action === "del" && this.eqnInputBuffer.length > 0) {
                this.eqnInputBuffer = this.eqnInputBuffer.slice(0, -1);
                return true;
            }
            if (action === "ac") {
                this.eqnInputBuffer = "";
                return true;
            }
            if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-") {
                this.eqnInputBuffer += keyVal;
                return true;
            }
            return true;
        }

        if (this.eqnStep === 3) {
            // Viewing roots
            if (action === "ac") {
                this.eqnStep = 2;
                if (this.eqnType === "POLY") {
                    this.eqnCoeffIndex = 0;
                } else {
                    this.simultRow = 0;
                    this.simultCol = 0;
                }
                return true;
            }
            if (action === "dpad") {
                if (keyVal === "down" && this.eqnResults) {
                    this.eqnResultIndex = Math.min(this.eqnResults.length - 1, this.eqnResultIndex + 1);
                }
                if (keyVal === "up" && this.eqnResults) {
                    this.eqnResultIndex = Math.max(0, this.eqnResultIndex - 1);
                }
                return true;
            }
            return true;
        }

        return false;
    }

    solveEquation() {
        const solvers = new CasioSolvers(this.engine);
        if (this.eqnDegree === 2) {
            const [a, b, c] = this.eqnCoeffs;
            const res = solvers.solveQuadratic(a, b, c);
            const list = [];
            if (res.status === "SUCCESS") {
                res.roots.forEach(r => list.push({ label: r.name, val: r.value.toString() }));
                if (res.extreme) {
                    list.push({ label: "x-Value " + (a > 0 ? "Min" : "Max"), val: res.extreme.x.toFixed(4) });
                    list.push({ label: "y-Value " + (a > 0 ? "Min" : "Max"), val: res.extreme.y.toFixed(4) });
                }
            } else {
                list.push({ label: "Kết quả", val: res.message });
            }
            this.eqnResults = list;
        } else if (this.eqnDegree === 3) {
            const [a, b, c, d] = this.eqnCoeffs;
            const res = solvers.solveCubic(a, b, c, d);
            const list = [];
            if (res.status === "SUCCESS") {
                res.roots.forEach(r => list.push({ label: r.name, val: r.value.toString() }));
            } else {
                list.push({ label: "Kết quả", val: res.message });
            }
            this.eqnResults = list;
        } else if (this.eqnDegree === 4) {
            const [a, b, c, d, e] = this.eqnCoeffs;
            const res = solvers.solveQuartic(a, b, c, d, e);
            const list = [];
            if (res.status === "SUCCESS") {
                res.roots.forEach(r => list.push({ label: r.name, val: r.value.toString() }));
            } else {
                list.push({ label: "Kết quả", val: res.message });
            }
            this.eqnResults = list;
        }
    }

    // ==========================================
    // MODE 10 (A): INEQUALITY SOLVER (BẬC 2, 3, 4)
    // ==========================================
    handleIneqKey(keyVal, action) {
        if (this.ineqStep === 0) {
            if (keyVal === "2" || keyVal === "3" || keyVal === "4") {
                this.ineqDegree = parseInt(keyVal, 10);
                this.ineqStep = 1;
            }
            return true;
        }

        if (this.ineqStep === 1) {
            const relMap = { "1": ">", "2": "<", "3": ">=", "4": "<=" };
            if (relMap[keyVal]) {
                this.ineqRel = relMap[keyVal];
                this.ineqCoeffs = new Array(this.ineqDegree + 1).fill(0);
                this.ineqCoeffs[0] = 1;
                this.ineqCoeffIndex = 0;
                this.ineqInputBuffer = "";
                this.ineqStep = 2;
            }
            return true;
        }

        if (this.ineqStep === 2) {
            if (action === "equals") {
                if (this.ineqInputBuffer.trim() !== "") {
                    this.ineqCoeffs[this.ineqCoeffIndex] = parseFloat(this.ineqInputBuffer);
                    this.ineqInputBuffer = "";
                }
                this.ineqCoeffIndex++;
                if (this.ineqCoeffIndex >= this.ineqCoeffs.length) {
                    const SolversClass = typeof CasioSolvers !== "undefined" ? CasioSolvers : require("./solvers.js").CasioSolvers;
                    const solvers = new SolversClass(this.engine);
                    this.ineqResult = solvers.solvePolynomialInequality(this.ineqDegree, this.ineqCoeffs, this.ineqRel);
                    this.ineqStep = 3;
                }
                return true;
            }
            if (action === "del" && this.ineqInputBuffer.length > 0) {
                this.ineqInputBuffer = this.ineqInputBuffer.slice(0, -1);
                return true;
            }
            if (action === "ac") {
                this.ineqInputBuffer = "";
                return true;
            }
            if ((keyVal >= "0" && keyVal <= "9") || keyVal === "." || keyVal === "-") {
                this.ineqInputBuffer += keyVal;
                return true;
            }
            return true;
        }

        if (this.ineqStep === 3) {
            if (action === "ac") {
                this.ineqStep = 2;
                this.ineqCoeffIndex = 0;
                return true;
            }
            return true;
        }

        return false;
    }

    // ==========================================
    // RENDER ON-SCREEN LCD DISPLAY
    // ==========================================
    renderLCD() {
        // Overlay 1: SETUP (SHIFT MENU)
        if (this.isSetupOpen) {
            const isVi = this.engine.language !== "en";

            // Dedicated Contrast Screen
            if (this.setupSubmenu === "contrast") {
                const lvl = this.engine.contrast !== undefined ? this.engine.contrast : 8;
                const bar = "■".repeat(lvl) + "□".repeat(16 - lvl);
                let html = `<div class="cw-dialog-screen">`;
                html += `<div class="cw-dialog-title"><span>${isVi ? "Độ tương phản" : "Contrast"}</span><span>[AC:Xong]</span></div>`;
                html += `<div class="cw-dialog-content" style="text-align: center; padding: 10px 0;">`;
                html += `<div style="display: flex; justify-content: space-between; padding: 0 8px; font-weight: bold; margin-bottom: 6px;">`;
                html += `<span>◄ ${isVi ? "Sáng" : "Light"}</span><span>${isVi ? "Tối" : "Dark"} ►</span>`;
                html += `</div>`;
                html += `<div style="letter-spacing: 2px; font-size: 13px; font-family: monospace;">[ ${bar} ]</div>`;
                html += `</div>`;
                html += `<div class="cw-dialog-footer"><span>[◄] [►] : ${isVi ? "Chỉnh" : "Adjust"}</span><span>[= / AC] : ${isVi ? "Xong" : "OK"}</span></div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }

            if (this.setupSubmenu !== null) {
                const subMenus = {
                    input_output: {
                        title: isVi ? "Nhập / Xuất" : "Input / Output",
                        items: ["1: MathI/MathO", "2: MathI/DecimalO", "3: LineI/LineO", "4: LineI/DecimalO"]
                    },
                    angle_unit: {
                        title: isVi ? "Đơn vị góc" : "Angle Unit",
                        items: isVi ? ["1: Độ (Degree)", "2: Radian (rad)", "3: Gradian (gra)"] : ["1: Degree (°)", "2: Radian (rad)", "3: Gradian (gra)"]
                    },
                    number_format: {
                        title: isVi ? "Định dạng số" : "Number Format",
                        items: isVi ? ["1: Fix (Số thập phân)", "2: Sci (Khoa học)", "3: Norm (Bình thường)"] : ["1: Fix", "2: Sci", "3: Norm"]
                    },
                    engineer_symbol: {
                        title: isVi ? "Ký hiệu k.thuật" : "Engineer Symbol",
                        items: isVi ? ["1: Bật (On)", "2: Tắt (Off)"] : ["1: On", "2: Off"]
                    },
                    fraction_format: {
                        title: isVi ? "Dạng phân số" : "Fraction Result",
                        items: isVi ? ["1: ab/c (Hỗn số)", "2: d/c (Phân số)"] : ["1: ab/c", "2: d/c"]
                    },
                    complex_format: {
                        title: isVi ? "Dạng số phức" : "Complex",
                        items: isVi ? ["1: a+bi (Đại số)", "2: r∠θ (Lượng giác)"] : ["1: a+bi", "2: r∠θ"]
                    },
                    stat_freq: {
                        title: isVi ? "Thống kê (Tần số)" : "Statistics",
                        items: isVi ? ["1: Bật (On)", "2: Tắt (Off)"] : ["1: On", "2: Off"]
                    },
                    equation_func: {
                        title: isVi ? "Phương trình" : "Equation/Func",
                        items: isVi ? ["1: Bật (Nghiệm phức)", "2: Tắt (Off)"] : ["1: On (Complex)", "2: Off"]
                    },
                    table_type: {
                        title: isVi ? "Bảng giá trị" : "Table",
                        items: ["1: f(x)", "2: f(x),g(x)"]
                    },
                    recurring_dec: {
                        title: isVi ? "S.thập phân t.hoàn" : "Recurring Dec",
                        items: isVi ? ["1: Bật (On)", "2: Tắt (Off)"] : ["1: On", "2: Off"]
                    },
                    decimal_mark: {
                        title: isVi ? "Dấu thập phân" : "Decimal Mark",
                        items: isVi ? ["1: Dấu chấm (.)", "2: Dấu phẩy (,)"] : ["1: Dot (.)", "2: Comma (,)"]
                    },
                    digit_separator: {
                        title: isVi ? "Dấu phân cách" : "Digit Separator",
                        items: isVi ? ["1: Bật (On)", "2: Tắt (Off)"] : ["1: On", "2: Off"]
                    },
                    language: {
                        title: isVi ? "Ngôn ngữ" : "Language",
                        items: ["1: English", "2: Tiếng Việt"]
                    },
                    auto_power_off: {
                        title: isVi ? "Tự động tắt" : "Auto Power Off",
                        items: isVi ? ["1: 10 phút", "2: 60 phút"] : ["1: 10 Min.", "2: 60 Min."]
                    }
                };
                const sub = subMenus[this.setupSubmenu] || { title: isVi ? "Cài đặt" : "Setup", items: [] };
                let html = `<div class="cw-dialog-screen">`;
                html += `<div class="cw-dialog-title"><span>${sub.title}</span><span>[AC:Quay lại]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                sub.items.forEach((it, idx) => {
                    const isCur = idx === (this.submenuCursor || 0);
                    html += `<div class="cw-dialog-row ${isCur ? 'active' : ''}" data-submenu-idx="${idx}"><span>${isCur ? '► ' : ''}${it}</span></div>`;
                });
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }

            // Main 4-Page Setup Menu (Authentic Casio fx-580VN X)
            const pages = [
                {
                    title: isVi ? "CÀI ĐẶT [1/4] ▼" : "SETUP [1/4] ▼",
                    items: isVi ? ["1: Nhập/Xuất", "2: Đơn vị góc", "3: Định dạng số", "4: Ký hiệu k.thuật"] : ["1: Input/Output", "2: Angle Unit", "3: Number Format", "4: Engineer Symbol"]
                },
                {
                    title: isVi ? "CÀI ĐẶT [2/4] ▲▼" : "SETUP [2/4] ▲▼",
                    items: isVi ? ["1: Dạng phân số", "2: Số phức", "3: Thống kê", "4: Phương trình"] : ["1: Fraction Result", "2: Complex", "3: Statistics", "4: Equation/Func"]
                },
                {
                    title: isVi ? "CÀI ĐẶT [3/4] ▲▼" : "SETUP [3/4] ▲▼",
                    items: isVi ? ["1: Bảng giá trị", "2: S.thập phân t.hoàn", "3: Dấu thập phân", "4: Dấu phân cách"] : ["1: Table", "2: Recurring Dec", "3: Decimal Mark", "4: Digit Separator"]
                },
                {
                    title: isVi ? "CÀI ĐẶT [4/4] ▲" : "SETUP [4/4] ▲",
                    items: isVi ? ["1: Ngôn ngữ", "2: Độ tương phản", "3: Tự động tắt"] : ["1: Language", "2: Contrast", "3: Auto Power Off"]
                }
            ];
            const curP = pages[this.setupPage] || pages[0];
            let html = `<div class="cw-dialog-screen">`;
            html += `<div class="cw-dialog-title"><span>${curP.title}</span><span>[AC:Thoát]</span></div>`;
            html += `<div class="cw-dialog-content">`;
            curP.items.forEach((it, idx) => {
                const isCur = idx === (this.setupCursor || 0);
                html += `<div class="cw-dialog-row ${isCur ? 'active' : ''}" data-setup-row="${idx}"><span>${isCur ? '► ' : ''}${it}</span></div>`;
            });
            html += `</div>`;
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Overlay 2: RESET (SHIFT 9)
        if (this.isResetOpen) {
            let html = `<div class="cw-dialog-screen">`;
            if (this.resetStep === 0) {
                html += `<div class="cw-dialog-title"><span>Khởi tạo lại? (Reset)</span><span>[AC:Thoát]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                html += `<div class="cw-dialog-row"><span>1: Thiết lập dữ liệu</span></div>`;
                html += `<div class="cw-dialog-row"><span>2: Bộ nhớ</span></div>`;
                html += `<div class="cw-dialog-row"><span>3: Khởi tạo tất cả</span></div>`;
                html += `</div>`;
            } else if (this.resetStep === 1) {
                const targetName = this.resetTarget === 1 ? "Thiết lập dữ liệu" : (this.resetTarget === 2 ? "Bộ nhớ" : "Tất cả");
                html += `<div class="cw-dialog-title"><span>Khởi tạo ${targetName}?</span></div>`;
                html += `<div class="cw-dialog-content" style="text-align:center; padding:10px 0;">`;
                html += `<div><strong>[ = ]</strong> : Có (Yes)</div>`;
                html += `<div><strong>[AC]</strong> : Hủy (Cancel)</div>`;
                html += `</div>`;
            } else if (this.resetStep === 2) {
                html += `<div class="cw-dialog-title"><span>Đã hoàn thành!</span></div>`;
                html += `<div class="cw-dialog-content" style="text-align:center; padding:12px 0;">`;
                html += `<div>Bấm phím <strong>[AC]</strong> để trở về</div>`;
                html += `</div>`;
            }
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Overlay 3: RECALL (SHIFT STO)
        if (this.isRecallOpen) {
            const r = this.engine.registers;
            const vars = [
                { name: "A", val: r.A }, { name: "B", val: r.B },
                { name: "C", val: r.C }, { name: "D", val: r.D },
                { name: "E", val: r.E }, { name: "F", val: r.F },
                { name: "x", val: r.x }, { name: "y", val: r.y },
                { name: "z", val: r.z }, { name: "M", val: r.M }
            ];
            let html = `<div class="cw-dialog-screen">`;
            html += `<div class="cw-dialog-title"><span>RECALL (Xem 9 biến)</span><span>[AC:Thoát]</span></div>`;
            html += `<div class="cw-recall-grid">`;
            vars.forEach(v => {
                const clean = typeof v.val === "number" ? parseFloat(v.val.toFixed(4)) : v.val;
                html += `<div class="cw-recall-item"><span>${v.name}=</span><span>${clean}</span></div>`;
            });
            html += `</div>`;
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Overlay 4: CONSTANTS (SHIFT 7)
        if (this.isConstOpen) {
            let html = `<div class="cw-dialog-screen">`;
            if (this.constCat === null) {
                html += `<div class="cw-dialog-title"><span>Hằng số khoa học (CONST)</span><span>[AC:Thoát]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                html += `<div class="cw-dialog-row"><span>1: Phổ quát (Universal)</span></div>`;
                html += `<div class="cw-dialog-row"><span>2: Điện từ (Electromagnetic)</span></div>`;
                html += `<div class="cw-dialog-row"><span>3: Nguyên tử & Hạt nhân</span></div>`;
                html += `<div class="cw-dialog-row"><span>4: Lý - Hóa (Phys-Chem)</span></div>`;
                html += `</div>`;
            } else {
                const catObj = this.engine.constructor.CONSTANTS[this.constCat];
                html += `<div class="cw-dialog-title"><span>${catObj.name}</span><span>[AC:Trở lại]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                catObj.list.slice(0, 4).forEach(it => {
                    html += `<div class="cw-dialog-row"><span>${it.id}: ${it.symbol} (${it.name})</span></div>`;
                });
                html += `</div>`;
            }
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Overlay 5: CONVERSIONS (SHIFT 8)
        if (this.isConvOpen) {
            let html = `<div class="cw-dialog-screen">`;
            if (this.convCat === null) {
                html += `<div class="cw-dialog-title"><span>Chuyển đổi đơn vị (CONV)</span><span>[AC:Thoát]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                html += `<div class="cw-dialog-row"><span>1: Dài  2: D.Tích  3: T.Tích</span></div>`;
                html += `<div class="cw-dialog-row"><span>4: Khối lượng  5: Vận tốc</span></div>`;
                html += `<div class="cw-dialog-row"><span>6: Áp suất  7: Năng lượng</span></div>`;
                html += `</div>`;
            } else {
                const catObj = this.engine.constructor.CONVERSIONS[this.convCat];
                html += `<div class="cw-dialog-title"><span>${catObj.name}</span><span>[AC:Trở lại]</span></div>`;
                html += `<div class="cw-dialog-content">`;
                catObj.list.slice(0, 4).forEach(it => {
                    html += `<div class="cw-dialog-row"><span>${it.id}: ${it.label}</span></div>`;
                });
                html += `</div>`;
            }
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Overlay 6: SOLVE (SHIFT CALC)
        if (this.solveActive) {
            const currentVar = (this.solveVars[this.solveVarIndex] || "x").toUpperCase();
            const currentVal = this.engine.registers[currentVar.toLowerCase()] || 0;
            const displayVal = this.solveInputBuffer !== "" ? this.solveInputBuffer : currentVal;
            const eqHtml = this.solveHtmlExpr || `<span class="cw-plain-expr">${this.solveDisplayExpr || this.solveExpr}</span>`;

            if (this.solveStep === 0) {
                let html = `<div class="cw-lcd-solve-screen">`;
                html += `<div class="cw-solve-eq-line">${eqHtml}</div>`;
                html += `<div class="cw-solve-prompt-line">`;
                html += `<span class="cw-solve-var-prompt">${currentVar}?</span>`;
                html += `<span class="cw-solve-var-val">${displayVal}</span>`;
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
            if (this.solveStep === 1 && this.solveResult) {
                const targetVar = (this.solveTargetVar || "x").toLowerCase();
                let html = `<div class="cw-lcd-solve-screen">`;
                html += `<div class="cw-solve-eq-line">${eqHtml}</div>`;
                html += `<div class="cw-solve-result-body">`;
                html += `<div class="cw-solve-res-row"><span class="cw-solve-lbl">${targetVar}=</span><span class="cw-solve-val">${this.solveResult.x}</span></div>`;
                html += `<div class="cw-solve-res-row"><span class="cw-solve-lbl">L-R=</span><span class="cw-solve-val">${this.solveResult.lr}</span></div>`;
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
        }

        // If Menu is open, render 12 Casio ClassWiz Icons in 4x3 Grid
        if (this.isMenuOpen) {
            let html = `<div class="cw-menu-grid">`;
            this.menuIcons.forEach((item, idx) => {
                const isSelected = idx === this.menuSelection;
                html += `
                    <div class="cw-menu-tile ${isSelected ? 'selected' : ''}" onclick="window.classwizOS.selectMenuIndex(${idx})">
                        <div class="tile-key">[${item.key}]</div>
                        <div class="tile-title">${item.title}</div>
                    </div>
                `;
            });
            html += `</div>`;
            return { type: "MENU", html };
        }

        // Mode 5: Vector
        if (this.activeMode === 5) {
            if (this.vctStep === 0) {
                let html = `<div class="cw-dialog-screen">`;
                html += `<div class="cw-dialog-title"><span>Định nghĩa Vct</span></div>`;
                html += `<div class="cw-dialog-content">`;
                html += `<div class="cw-dialog-row"><span>1: VctA</span><span>2: VctB</span></div>`;
                html += `<div class="cw-dialog-row"><span>3: VctC</span><span>4: VctD</span></div>`;
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
            if (this.vctStep === 1) {
                let html = `<div class="cw-dialog-screen">`;
                html += `<div class="cw-dialog-title"><span>${this.vctSelected}</span></div>`;
                html += `<div class="cw-dialog-content" style="padding:10px 0;">`;
                html += `<div class="cw-dialog-row"><span>Kích thước?</span><span>2~3</span></div>`;
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
            if (this.vctStep === 2) {
                const curVal = this.vctInputBuffer !== "" ? this.vctInputBuffer : (this.vctData[this.vctIndex] !== undefined ? this.vctData[this.vctIndex] : 0);
                let html = `<div class="cw-vct-editor-screen">`;
                html += `<div class="cw-vct-edit-header"><span>${this.vctSelected}</span><span>1x${this.vctDim}</span></div>`;
                html += `<div class="cw-vct-matrix-row">`;
                html += `<span class="cw-vct-bracket">[</span>`;
                this.vctData.forEach((val, idx) => {
                    const isCur = idx === this.vctIndex;
                    const disp = isCur && this.vctInputBuffer !== "" ? this.vctInputBuffer : val;
                    html += `<span class="cw-vct-cell ${isCur ? 'active-cell' : ''}">${disp}</span>`;
                });
                html += `<span class="cw-vct-bracket">]</span>`;
                html += `</div>`;
                html += `<div class="cw-vct-edit-bottom">${curVal}</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
            if (this.vctStep === 3) {
                if (this.vctOptnOpen) {
                    const page = this.vctOptnPage || 0;
                    let html = `<div class="cw-dialog-screen">`;
                    const arrow = page === 0 ? "▼" : (page === 1 ? "▲▼" : "▲");
                    html += `<div class="cw-dialog-title"><span>Tùy chọn Vct (${page + 1}/3) ${arrow}</span><span>[AC:Đóng]</span></div>`;
                    html += `<div class="cw-dialog-content">`;
                    if (page === 0) {
                        html += `<div class="cw-dialog-row"><span>1: Định nghĩa Vct</span></div>`;
                        html += `<div class="cw-dialog-row"><span>2: Dữ liệu Vct</span></div>`;
                        html += `<div class="cw-dialog-row"><span>3: VctA</span><span>4: VctB</span></div>`;
                    } else if (page === 1) {
                        html += `<div class="cw-dialog-row"><span>1: VctC</span><span>2: VctD</span></div>`;
                        html += `<div class="cw-dialog-row"><span>3: VctAns</span></div>`;
                        html += `<div class="cw-dialog-row"><span>4: Tích vô hướng (•)</span></div>`;
                    } else if (page === 2) {
                        html += `<div class="cw-dialog-row"><span>1: Góc (Angle)</span></div>`;
                        html += `<div class="cw-dialog-row"><span>2: Véc-tơ đơn vị</span></div>`;
                    }
                    html += `</div>`;
                    html += `</div>`;
                    return { type: "SCREEN", html };
                }

                if (this.vctResult !== null) {
                    const VectorClass = typeof CasioVector !== "undefined" ? CasioVector : (typeof window !== "undefined" && window.CasioVector ? window.CasioVector : require("./calc-engine.js").CasioVector);
                    if (this.vctResult instanceof VectorClass) {
                        const res = this.vctResult;
                        const curIdx = this.vctSelectedResultIdx || 0;
                        const curVal = res.data[curIdx] !== undefined ? res.data[curIdx] : 0;
                        let html = `<div class="cw-vct-result-screen">`;
                        html += `<div class="cw-vct-res-header"><span>VctAns =</span><span>1x${res.dim}</span></div>`;
                        html += `<div class="cw-vct-matrix-row">`;
                        html += `<span class="cw-vct-bracket">[</span>`;
                        res.data.forEach((val, idx) => {
                            const isCur = idx === curIdx;
                            html += `<span class="cw-vct-cell ${isCur ? 'active-cell' : ''}">${parseFloat(val.toFixed(4))}</span>`;
                        });
                        html += `<span class="cw-vct-bracket">]</span>`;
                        html += `</div>`;
                        html += `<div class="cw-vct-edit-bottom">${parseFloat(curVal.toFixed(6))}</div>`;
                        html += `</div>`;
                        return { type: "SCREEN", html };
                    } else {
                        // Scalar or Error
                        const valStr = typeof this.vctResult === "number" ? parseFloat(this.vctResult.toFixed(8)) : String(this.vctResult);
                        let html = `<div class="cw-vct-scalar-screen">`;
                        html += `<div class="cw-vct-scalar-expr">${this.mathTree.renderHTML(false)}</div>`;
                        html += `<div class="cw-vct-scalar-val">${valStr}</div>`;
                        html += `</div>`;
                        return { type: "SCREEN", html };
                    }
                }

                // Normal calculation screen (handled by UI Natural Display)
                return { type: "NORMAL" };
            }
        }

        // Mode 6: Statistics (Thống kê ghép nhóm)
        if (this.activeMode === 6) {
            if (this.statShowingResult && this.statResults) {
                const res = this.statResults;
                const items = [
                    { label: "x̄ (Trung bình)", val: res.mean },
                    { label: "Σx", val: res.sumX },
                    { label: "Σx²", val: res.sumX2 },
                    { label: "σx (Độ lệch chuẩn)", val: res.sigmaPop },
                    { label: "s²x (Phương sai mẫu)", val: res.variance },
                    { label: "sx (Độ lệch mẫu)", val: res.sSample },
                    { label: "n (Cỡ mẫu)", val: res.n },
                    { label: "min(x)", val: res.min },
                    { label: "Q₁ (Tứ phân vị 1)", val: res.q1 },
                    { label: "Med (Trung vị)", val: res.med },
                    { label: "Q₃ (Tứ phân vị 3)", val: res.q3 },
                    { label: "max(x)", val: res.max }
                ];
                const curIdx = this.statResultIndex || 0;
                const windowStart = Math.max(0, Math.min(curIdx - 1, Math.max(0, items.length - 3)));
                const visible = items.slice(windowStart, windowStart + 3);

                let html = `<div class="cw-stat-result-screen">`;
                html += `<div class="cw-screen-header"><span>1-Biến [${curIdx + 1}/${items.length}] ▲▼</span><span>[AC:Bảng]</span></div>`;
                visible.forEach((it, idx) => {
                    const actualIdx = windowStart + idx;
                    const isCur = actualIdx === curIdx;
                    html += `<div class="cw-result-row ${isCur ? 'active' : ''}"><span>${it.label}</span><strong>${it.val}</strong></div>`;
                });
                html += `</div>`;
                return { type: "SCREEN", html };
            }

            // Data Table Mode (render 3 visible rows around cursor)
            const curRow = this.statRow || 0;
            const windowStart = Math.max(0, Math.min(curRow - 1, Math.max(0, this.statData.length - 3)));
            const visible = this.statData.slice(windowStart, windowStart + 3);

            let html = `<div class="cw-table-screen">`;
            html += `<div class="cw-table-header"><span>No</span><span>x (Giá trị)</span><span>Freq (Tần số)</span></div>`;
            visible.forEach((row, idx) => {
                const rIdx = windowStart + idx;
                const isCurRow = rIdx === this.statRow;
                const isCol0 = isCurRow && this.statCol === 0;
                const isCol1 = isCurRow && this.statCol === 1;

                const valX = isCol0 && this.statInputBuffer !== "" ? this.statInputBuffer : row.x;
                const valFreq = isCol1 && this.statInputBuffer !== "" ? this.statInputBuffer : row.freq;

                html += `
                    <div class="cw-table-row ${isCurRow ? 'active' : ''}">
                        <span class="row-num">${rIdx + 1}</span>
                        <span class="row-cell ${isCol0 ? 'cursor-cell' : ''}">${valX}</span>
                        <span class="row-cell ${isCol1 ? 'cursor-cell' : ''}">${valFreq}</span>
                    </div>
                `;
            });
            html += `</div>`;
            return { type: "SCREEN", html };
        }

        // Mode 8: Table (Bảng giá trị f(x), g(x))
        if (this.activeMode === 8) {
            if (this.tableStep === 0) {
                return { type: "PROMPT", label: "f(x)=", val: this.tableInputBuffer || this.tableFX };
            }
            if (this.tableStep === 1) {
                return { type: "PROMPT", label: "g(x)=", val: this.tableInputBuffer || this.tableGX || "(trống)" };
            }
            if (this.tableStep === 2) {
                return { type: "PROMPT", label: "Table Start?", val: this.tableInputBuffer || this.tableStart };
            }
            if (this.tableStep === 3) {
                return { type: "PROMPT", label: "Table End?", val: this.tableInputBuffer || this.tableEnd };
            }
            if (this.tableStep === 4) {
                return { type: "PROMPT", label: "Table Step?", val: this.tableInputBuffer || this.tableStepVal };
            }
            if (this.tableStep === 5) {
                const curRow = this.tableSelectedRow || 0;
                const windowStart = Math.max(0, Math.min(curRow - 1, Math.max(0, this.tableRows.length - 3)));
                const visible = this.tableRows.slice(windowStart, windowStart + 3);

                let html = `<div class="cw-table-screen">`;
                html += `<div class="cw-table-header"><span>No</span><span>x</span><span>f(x)</span>${this.tableGX ? '<span>g(x)</span>' : ''}</div>`;
                visible.forEach((r, idx) => {
                    const actualIdx = windowStart + idx;
                    const isCur = actualIdx === this.tableSelectedRow;
                    html += `
                        <div class="cw-table-row ${isCur ? 'active' : ''}">
                            <span class="row-num">${actualIdx + 1}</span>
                            <span class="row-cell">${r.x}</span>
                            <span class="row-cell">${r.fx}</span>
                            ${this.tableGX ? `<span class="row-cell">${r.gx}</span>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                return { type: "SCREEN", html };
            }
        }

        // Mode 9: Equation (Phương trình & Hệ PT)
        if (this.activeMode === 9) {
            if (this.eqnStep === 0) {
                return {
                    type: "PROMPT",
                    label: "1: Simult Eq (Hệ PT)<br>2: Polynomial (Đa thức)",
                    val: "[1 hoặc 2]"
                };
            }
            if (this.eqnStep === 1) {
                return {
                    type: "PROMPT",
                    label: this.eqnType === "SIMULT" ? "Simult Unknowns?<br>[2 đến 4 ẩn]" : "Polynomial Degree?<br>[Bậc 2 đến 4]",
                    val: "[Nhấn 2-4]"
                };
            }
            if (this.eqnStep === 2) {
                if (this.eqnType === "POLY") {
                    const labels = ["a", "b", "c", "d", "e"];
                    const curLabel = labels[this.eqnCoeffIndex] || "a";
                    const degStr = this.eqnDegree === 2 ? "ax² + bx + c = 0" : (this.eqnDegree === 3 ? "ax³ + bx² + cx + d = 0" : "ax⁴ + bx³ + cx² + dx + e = 0");
                    return {
                        type: "PROMPT",
                        label: `${degStr}<br>${curLabel} = `,
                        val: this.eqnInputBuffer !== "" ? this.eqnInputBuffer : this.eqnCoeffs[this.eqnCoeffIndex]
                    };
                } else {
                    // Simult
                    const r = this.simultRow;
                    const c = this.simultCol;
                    const varNames = ["x", "y", "z", "t"];
                    const colName = c < this.simultDim ? varNames[c] : "hằng số";
                    return {
                        type: "PROMPT",
                        label: `Hệ PT (PT ${r + 1}, hệ số ${colName}) = `,
                        val: this.eqnInputBuffer !== "" ? this.eqnInputBuffer : this.simultMatrix[r][c]
                    };
                }
            }
            if (this.eqnStep === 3 && this.eqnResults) {
                const curIdx = this.eqnResultIndex || 0;
                const windowStart = Math.max(0, Math.min(curIdx - 1, Math.max(0, this.eqnResults.length - 3)));
                const visible = this.eqnResults.slice(windowStart, windowStart + 3);

                let html = `<div class="cw-stat-result-screen">`;
                html += `<div class="cw-screen-header"><span>Nghiệm [${curIdx + 1}/${this.eqnResults.length}] ▲▼</span><span>[AC:Nhập lại]</span></div>`;
                visible.forEach((it, idx) => {
                    const actualIdx = windowStart + idx;
                    const isCur = actualIdx === curIdx;
                    html += `<div class="cw-result-row ${isCur ? 'active' : ''}"><span>${it.label}</span><strong>${it.val}</strong></div>`;
                });
                html += `</div>`;
                return { type: "SCREEN", html };
            }
        }

        // Mode 10: Inequality (Bất phương trình Bậc 2, 3, 4)
        if (this.activeMode === 10) {
            if (this.ineqStep === 0) return { type: "PROMPT", label: "Bậc Bất Phương Trình?<br>[Chọn 2 đến 4]", val: "[Nhấn 2-4]" };
            if (this.ineqStep === 1) {
                const deg = this.ineqDegree || 2;
                const expr = deg === 2 ? "ax²+bx+c" : (deg === 3 ? "ax³+bx²+cx+d" : "ax⁴+bx³+cx²+dx+e");
                return { type: "PROMPT", label: `1: ${expr} > 0<br>2: ${expr} < 0<br>3: ${expr} ≥ 0<br>4: ${expr} ≤ 0`, val: "[Chọn 1-4]" };
            }
            if (this.ineqStep === 2) {
                const labels = ["a", "b", "c", "d", "e"];
                const cur = labels[this.ineqCoeffIndex] || "a";
                return { type: "PROMPT", label: `Bậc ${this.ineqDegree}: Hệ số ${cur} = `, val: this.ineqInputBuffer !== "" ? this.ineqInputBuffer : this.ineqCoeffs[this.ineqCoeffIndex] };
            }
            if (this.ineqStep === 3 && this.ineqResult) {
                return {
                    type: "PROMPT",
                    label: `Tập nghiệm (${this.ineqRel} 0) [AC:Nhập lại]:`,
                    val: this.ineqResult.message
                };
            }
        }

        // Mode 11: Ratio (Tỉ số)
        if (this.activeMode === 11) {
            if (this.ratioStep === 0) {
                return {
                    type: "PROMPT",
                    label: "1: A : B = X : D<br>2: A : B = C : X",
                    val: "[Nhấn 1 hoặc 2]"
                };
            }
            if (this.ratioStep === 1) {
                const names = this.ratioType === 1 ? ["A", "B", "D"] : ["A", "B", "C"];
                const curName = names[this.ratioIndex] || "A";
                const typeStr = this.ratioType === 1 ? "A:B = X:D" : "A:B = C:X";
                return {
                    type: "PROMPT",
                    label: `Tỉ số (${typeStr})<br>Hệ số ${curName} = `,
                    val: this.ratioInputBuffer !== "" ? this.ratioInputBuffer : this.ratioCoeffs[this.ratioIndex]
                };
            }
            if (this.ratioStep === 2 && this.ratioResult !== null) {
                let html = `<div class="cw-dialog-screen">`;
                html += `<div class="cw-dialog-title"><span>Tỉ số (Ratio)</span><span>[AC:Nhập lại]</span></div>`;
                html += `<div class="cw-dialog-content" style="padding:12px 4px; font-size:14px;">`;
                html += `<div class="cw-dialog-row"><span>X =</span><strong>${this.ratioResult}</strong></div>`;
                html += `</div>`;
                html += `</div>`;
                return { type: "SCREEN", html };
            }
        }

        // Mode 12: Verify (Đúng / Sai)
        if (this.activeMode === 12) {
            let html = `
                <div style="font-family: var(--font-casio); font-size: 13px; padding: 4px;">
                    <div style="font-weight: bold; border-bottom: 1px solid var(--lcd-text); margin-bottom: 4px;">C: ĐÚNG / SAI (VERIFY)</div>
                    <div>${this.mathTree.renderHTML()}</div>
                    ${this.verifyResult ? `<div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 14px;">${this.verifyResult}</div>` : ''}
                </div>
            `;
            return { type: "SCREEN", html };
        }

        // Mode 1 (COMP): Standard Math Tree display
        return { type: "COMP" };
    }
}

if (typeof window !== "undefined") {
    window.ClassWizOS = ClassWizOS;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { ClassWizOS };
}
