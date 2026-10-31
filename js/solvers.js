/**
 * Casio fx-580VN X Emulator - Solvers & Advanced Functions Module
 * Features:
 * - Mode A: Equation / Simultaneous Equation Solver (Bậc 2, 3, 4, Hệ 2, 3, 4 ẩn)
 * - Mode B: Inequality Solver (Bất phương trình Bậc 2, Bậc 3)
 * - Mode 9: Table Function (Bảng giá trị f(x) & g(x))
 * - Mode 3: Base-N (DEC, HEX, BIN, OCT)
 * - Mode 4: Matrix
 * - Mode 5: Vector
 */

var CasioComplex = (typeof window !== "undefined" && window.Complex) ? window.Complex : ((typeof globalThis.Complex !== "undefined") ? globalThis.Complex : (typeof require !== "undefined" ? require("./calc-engine.js").Complex : null));

class CasioSolvers {
    constructor(engine) {
        this.engine = engine;
    }

    // ==========================================
    // 1. SIMULTANEOUS EQUATIONS (HỆ PHƯƠNG TRÌNH)
    // ==========================================
    solveSimultaneous(matrix) {
        // Gaussian elimination with partial pivoting
        // matrix is Nx(N+1)
        const n = matrix.length;
        const A = matrix.map(row => [...row]);

        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
                    maxRow = k;
                }
            }
            // Swap rows
            const tmp = A[i];
            A[i] = A[maxRow];
            A[maxRow] = tmp;

            if (Math.abs(A[i][i]) < 1e-12) {
                // Check if infinite or no solution
                let allZero = true;
                for (let j = i; j < n; j++) {
                    if (Math.abs(A[i][j]) > 1e-12) allZero = false;
                }
                if (allZero && Math.abs(A[i][n]) > 1e-12) {
                    return { status: "NO_SOLUTION", message: "Vô nghiệm (No Solution)" };
                } else if (allZero && Math.abs(A[i][n]) < 1e-12) {
                    return { status: "INFINITE", message: "Vô số nghiệm (Infinite Solutions)" };
                }
            }

            // Pivot normalization
            const pivot = A[i][i];
            if (Math.abs(pivot) > 1e-12) {
                for (let j = i; j <= n; j++) {
                    A[i][j] /= pivot;
                }
            }

            // Eliminate column entries
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = A[k][i];
                    for (let j = i; j <= n; j++) {
                        A[k][j] -= factor * A[i][j];
                    }
                }
            }
        }

        const vars = ["x", "y", "z", "t"];
        const results = [];
        for (let i = 0; i < n; i++) {
            const val = parseFloat(A[i][n].toFixed(10));
            results.push({ var: vars[i] || `x${i+1}`, value: val });
        }

        return { status: "SUCCESS", results };
    }

    // ==========================================
    // 2. POLYNOMIAL EQUATION SOLVER (BẬC 2, 3, 4)
    // ==========================================
    solveQuadratic(a, b, c) {
        if (Math.abs(a) < 1e-12) {
            if (Math.abs(b) < 1e-12) {
                return c === 0 ? { status: "INFINITE", message: "Vô số nghiệm" } : { status: "NO_SOLUTION", message: "Vô nghiệm" };
            }
            return { status: "SUCCESS", roots: [{ name: "x", value: -c / b, type: "REAL" }] };
        }

        const delta = b * b - 4 * a * c;
        const vertexX = -b / (2 * a);
        const vertexY = -delta / (4 * a);
        const extremeType = a > 0 ? "Giá trị nhỏ nhất (Min)" : "Giá trị lớn nhất (Max)";

        if (Math.abs(delta) < 1e-12) {
            const x = vertexX;
            return {
                status: "SUCCESS",
                roots: [{ name: "x₁ = x₂", value: x, type: "DOUBLE_REAL" }],
                extreme: { type: extremeType, x: vertexX, y: vertexY }
            };
        } else if (delta > 0) {
            const sqrtDelta = Math.sqrt(delta);
            const x1 = (-b + sqrtDelta) / (2 * a);
            const x2 = (-b - sqrtDelta) / (2 * a);
            return {
                status: "SUCCESS",
                roots: [
                    { name: "x₁", value: parseFloat(x1.toFixed(10)), type: "REAL" },
                    { name: "x₂", value: parseFloat(x2.toFixed(10)), type: "REAL" }
                ],
                extreme: { type: extremeType, x: vertexX, y: vertexY }
            };
        } else {
            // Complex roots
            const realPart = vertexX;
            const imagPart = Math.sqrt(-delta) / (2 * Math.abs(a));
            return {
                status: "SUCCESS",
                roots: [
                    { name: "x₁", value: new CasioComplex(realPart, imagPart), type: "COMPLEX" },
                    { name: "x₂", value: new CasioComplex(realPart, -imagPart), type: "COMPLEX" }
                ],
                extreme: { type: extremeType, x: vertexX, y: vertexY }
            };
        }
    }

    solveCubic(a, b, c, d) {
        if (Math.abs(a) < 1e-12) return this.solveQuadratic(b, c, d);

        // Normalize to depressed cubic t^3 + pt + q = 0
        const p = (3 * a * c - b * b) / (3 * a * a);
        const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
        const delta = (q * q) / 4 + (p * p * p) / 27;

        const shift = -b / (3 * a);
        const roots = [];

        if (Math.abs(delta) < 1e-12) {
            if (Math.abs(p) < 1e-12) {
                // Triple root
                roots.push({ name: "x₁ = x₂ = x₃", value: shift, type: "REAL" });
            } else {
                const u = Math.cbrt(-q / 2);
                roots.push({ name: "x₁", value: 2 * u + shift, type: "REAL" });
                roots.push({ name: "x₂ = x₃", value: -u + shift, type: "DOUBLE_REAL" });
            }
        } else if (delta < 0) {
            // 3 distinct real roots (casus irreducibilis)
            const r = Math.sqrt(-Math.pow(p / 3, 3));
            const phi = Math.acos(-q / (2 * r));
            const rootR = 2 * Math.cbrt(r);

            roots.push({ name: "x₁", value: rootR * Math.cos(phi / 3) + shift, type: "REAL" });
            roots.push({ name: "x₂", value: rootR * Math.cos((phi + 2 * Math.PI) / 3) + shift, type: "REAL" });
            roots.push({ name: "x₃", value: rootR * Math.cos((phi + 4 * Math.PI) / 3) + shift, type: "REAL" });
        } else {
            // 1 real root, 2 complex conjugate roots
            const sqrtDelta = Math.sqrt(delta);
            const u = Math.cbrt(-q / 2 + sqrtDelta);
            const v = Math.cbrt(-q / 2 - sqrtDelta);

            const x1 = u + v + shift;
            const realPart = -(u + v) / 2 + shift;
            const imagPart = ((u - v) * Math.sqrt(3)) / 2;

            roots.push({ name: "x₁", value: parseFloat(x1.toFixed(10)), type: "REAL" });
            roots.push({ name: "x₂", value: new CasioComplex(realPart, imagPart), type: "COMPLEX" });
            roots.push({ name: "x₃", value: new CasioComplex(realPart, -imagPart), type: "COMPLEX" });
        }

        return { status: "SUCCESS", roots };
    }

    solveQuartic(a, b, c, d, e) {
        if (Math.abs(a) < 1e-12) return this.solveCubic(b, c, d, e);

        // Normalize polynomial x^4 + Bx^3 + Cx^2 + Dx + E = 0
        const B = b / a;
        const C = c / a;
        const D = d / a;
        const E = e / a;

        // Durand-Kerner numerical method for high precision roots of quartic
        let z = [
            new CasioComplex(0.4, 0.9),
            new CasioComplex(-0.4, 0.9),
            new CasioComplex(-0.4, -0.9),
            new CasioComplex(0.4, -0.9)
        ];

        const f = (x) => {
            // x^4 + Bx^3 + Cx^2 + Dx + E
            const x2 = x.mul(x);
            const x3 = x2.mul(x);
            const x4 = x3.mul(x);
            return x4.add(x3.mul(B)).add(x2.mul(C)).add(x.mul(D)).add(E);
        };

        for (let iter = 0; iter < 100; iter++) {
            let maxDiff = 0;
            for (let i = 0; i < 4; i++) {
                let denom = new CasioComplex(1, 0);
                for (let j = 0; j < 4; j++) {
                    if (i !== j) {
                        denom = denom.mul(z[i].sub(z[j]));
                    }
                }
                const delta = f(z[i]).div(denom);
                z[i] = z[i].sub(delta);
                maxDiff = Math.max(maxDiff, delta.abs());
            }
            if (maxDiff < 1e-12) break;
        }

        const roots = z.map((root, idx) => {
            const re = Math.abs(root.re) < 1e-10 ? 0 : parseFloat(root.re.toFixed(8));
            const im = Math.abs(root.im) < 1e-10 ? 0 : parseFloat(root.im.toFixed(8));
            if (im === 0) {
                return { name: `x${idx + 1}`, value: re, type: "REAL" };
            } else {
                return { name: `x${idx + 1}`, value: new CasioComplex(re, im), type: "COMPLEX" };
            }
        });

        return { status: "SUCCESS", roots };
    }

    // ==========================================
    // 3. INEQUALITY SOLVER (BẤT PHƯƠNG TRÌNH)
    // ==========================================
    solvePolynomialInequality(degree, coeffs, rel) {
        if (degree === 2) {
            const [a, b, c] = coeffs;
            return this.solveQuadraticInequality(a, b, c, rel);
        }

        // Polynomial evaluation function P(x)
        const evalPoly = (x) => {
            let res = 0;
            const n = coeffs.length;
            for (let i = 0; i < n; i++) {
                res += coeffs[i] * Math.pow(x, n - 1 - i);
            }
            return res;
        };

        const checkRel = (val) => {
            if (rel === ">") return val > 1e-9;
            if (rel === "<") return val < -1e-9;
            if (rel === ">=") return val >= -1e-9;
            if (rel === "<=") return val <= 1e-9;
            return false;
        };

        // Find roots based on degree
        let rootsRes = null;
        if (degree === 3) {
            rootsRes = this.solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
        } else if (degree === 4) {
            rootsRes = this.solveQuartic(coeffs[0], coeffs[1], coeffs[2], coeffs[3], coeffs[4]);
        }

        if (!rootsRes || rootsRes.status !== "SUCCESS") {
            return { message: "Không thể giải" };
        }

        // Extract real roots
        const realRoots = rootsRes.roots
            .filter(r => r.type === "REAL" || r.type === "DOUBLE_REAL" || (typeof r.value === "number"))
            .map(r => typeof r.value === "number" ? r.value : r.value.re)
            .sort((x, y) => x - y);

        // Deduplicate close roots
        const distinctRoots = [];
        for (const r of realRoots) {
            if (!distinctRoots.some(d => Math.abs(d - r) < 1e-4)) {
                distinctRoots.push(parseFloat(r.toFixed(4)));
            }
        }

        const isLeqGeq = rel === ">=" || rel === "<=";

        // If no real roots
        if (distinctRoots.length === 0) {
            const val0 = evalPoly(0);
            return checkRel(val0)
                ? { message: "Tất cả số thực" }
                : { message: "Vô nghiệm" };
        }

        // Test intervals: (-inf, r0), (r0, r1), ..., (rn-1, +inf)
        const testPoints = [];
        testPoints.push({ interval: [-Infinity, distinctRoots[0]], test: distinctRoots[0] - 1 });
        for (let i = 0; i < distinctRoots.length - 1; i++) {
            const mid = (distinctRoots[i] + distinctRoots[i + 1]) / 2;
            testPoints.push({ interval: [distinctRoots[i], distinctRoots[i + 1]], test: mid });
        }
        testPoints.push({ interval: [distinctRoots[distinctRoots.length - 1], Infinity], test: distinctRoots[distinctRoots.length - 1] + 1 });

        const validIntervals = [];
        for (const item of testPoints) {
            const val = evalPoly(item.test);
            if (checkRel(val)) {
                validIntervals.push(item.interval);
            }
        }

        // Also check if isolated roots satisfy P(r) = 0
        const satisfiedRoots = [];
        for (const r of distinctRoots) {
            if (checkRel(evalPoly(r))) {
                satisfiedRoots.push(r);
            }
        }

        if (validIntervals.length === 0) {
            if (satisfiedRoots.length > 0) {
                return { message: satisfiedRoots.map(r => `x = ${r}`).join(" , ") };
            }
            return { message: "Vô nghiệm" };
        }

        // If all intervals are valid
        if (validIntervals.length === testPoints.length) {
            return { message: "Tất cả số thực" };
        }

        // Format valid intervals
        const opL = isLeqGeq ? "≤" : "<";
        const parts = [];
        for (const [start, end] of validIntervals) {
            if (start === -Infinity) {
                parts.push(`x ${opL} ${end}`);
            } else if (end === Infinity) {
                parts.push(`x ${isLeqGeq ? "≥" : ">"} ${start}`);
            } else {
                parts.push(`${start} ${opL} x ${opL} ${end}`);
            }
        }

        return { message: parts.join(" , ") };
    }

    solveQuadraticInequality(a, b, c, rel) {
        // rel: ">", "<", ">=", "<="
        const quad = this.solveQuadratic(a, b, c);
        if (quad.status !== "SUCCESS") return { message: "Không thể giải" };

        const { roots } = quad;
        if (roots.some(r => r.type === "COMPLEX")) {
            // No real roots -> Parabola is strictly above or below x-axis
            const sign = a > 0 ? 1 : -1;
            const satisfies = (rel === ">" && sign > 0) || (rel === ">=" && sign > 0) ||
                              (rel === "<" && sign < 0) || (rel === "<=" && sign < 0);
            return satisfies ? { message: "Tất cả số thực (All Real Numbers)" } : { message: "Vô nghiệm (No Solution)" };
        }

        if (roots.length === 1 || (roots[0].type === "DOUBLE_REAL")) {
            const x0 = roots[0].value;
            if (rel === ">=") return a > 0 ? { message: "Tất cả số thực" } : { message: `x = ${x0}` };
            if (rel === "<=") return a < 0 ? { message: "Tất cả số thực" } : { message: `x = ${x0}` };
            if (rel === ">") return a > 0 ? { message: `x ≠ ${x0}` } : { message: "Vô nghiệm" };
            if (rel === "<") return a < 0 ? { message: `x ≠ ${x0}` } : { message: "Vô nghiệm" };
        }

        // Two distinct real roots
        const r1 = Math.min(roots[0].value, roots[1].value);
        const r2 = Math.max(roots[0].value, roots[1].value);

        if (a > 0) {
            // Parabola opens up: positive outside [r1, r2], negative inside (r1, r2)
            if (rel === ">") return { message: `x < ${r1} , ${r2} < x` };
            if (rel === ">=") return { message: `x ≤ ${r1} , ${r2} ≤ x` };
            if (rel === "<") return { message: `${r1} < x < ${r2}` };
            if (rel === "<=") return { message: `${r1} ≤ x ≤ ${r2}` };
        } else {
            // Parabola opens down
            if (rel === ">") return { message: `${r1} < x < ${r2}` };
            if (rel === ">=") return { message: `${r1} ≤ x ≤ ${r2}` };
            if (rel === "<") return { message: `x < ${r1} , ${r2} < x` };
            if (rel === "<=") return { message: `x ≤ ${r1} , ${r2} ≤ x` };
        }
    }

    // ==========================================
    // 4. TABLE FUNCTION (BẢNG GIÁ TRỊ)
    // ==========================================
    generateTable(fExpr, gExpr, start, end, step) {
        if (step <= 0) throw new Error("Step phải lớn hơn 0");
        const count = Math.floor((end - start) / step) + 1;
        if (count > 100) throw new Error("Số điểm vượt quá giới hạn 100");

        const rows = [];
        for (let i = 0; i < count; i++) {
            const xVal = parseFloat((start + i * step).toFixed(10));
            this.engine.registers.x = xVal;

            let fVal = "ERROR";
            try {
                fVal = this.engine.calculate(fExpr);
                fVal = typeof fVal === "number" ? parseFloat(fVal.toFixed(6)) : fVal.toString();
            } catch (e) {
                fVal = "ERROR";
            }

            let gVal = null;
            if (gExpr && gExpr.trim() !== "") {
                try {
                    gVal = this.engine.calculate(gExpr);
                    gVal = typeof gVal === "number" ? parseFloat(gVal.toFixed(6)) : gVal.toString();
                } catch (e) {
                    gVal = "ERROR";
                }
            }

            rows.push({ x: xVal, fx: fVal, gx: gVal });
        }
        return rows;
    }

    // ==========================================
    // 5. BASE-N CONVERSIONS & LOGIC (HỆ ĐẾM)
    // ==========================================
    convertBase(value, fromBase, toBase) {
        let dec = 0;
        if (fromBase === "DEC") dec = parseInt(value, 10);
        else if (fromBase === "HEX") dec = parseInt(value, 16);
        else if (fromBase === "BIN") dec = parseInt(value, 2);
        else if (fromBase === "OCT") dec = parseInt(value, 8);

        if (isNaN(dec)) return "ERROR";

        // Convert to 32-bit signed/unsigned
        dec = dec | 0;

        if (toBase === "DEC") return dec.toString(10);
        if (toBase === "HEX") return (dec >>> 0).toString(16).toUpperCase();
        if (toBase === "BIN") return (dec >>> 0).toString(2);
        if (toBase === "OCT") return (dec >>> 0).toString(8);
        return dec.toString(10);
    }

    // ==========================================
    // 6. NUMERICAL EQUATION SOLVER (SOLVE KEY)
    // Newton-Raphson approximation (Pages 78-82)
    // ==========================================
    solveEquationNewton(exprStr, initialGuess = 1, targetVar = "x") {
        // Equation may be "Left = Right" or "Expr" (assumed = 0)
        let leftExpr = exprStr;
        let rightExpr = "0";
        if (exprStr.includes("=")) {
            const parts = exprStr.split("=");
            leftExpr = parts[0];
            rightExpr = parts.slice(1).join("=") || "0";
        }

        const tVar = targetVar.toLowerCase();
        const oldTarget = this.engine.registers[tVar];

        const evalDiffAt = (xVal) => {
            this.engine.registers[tVar] = xVal;
            try {
                const l = this.engine.calculate(leftExpr);
                const r = this.engine.calculate(rightExpr);
                const lNum = typeof l === "number" ? l : parseFloat(l) || 0;
                const rNum = typeof r === "number" ? r : parseFloat(r) || 0;
                return lNum - rNum;
            } catch (e) {
                return 0;
            }
        };

        const trySolveFrom = (guess) => {
            let x = guess;
            const h = 1e-6;
            for (let iter = 0; iter < 120; iter++) {
                const y = evalDiffAt(x);
                if (Math.abs(y) < 1e-11) return { x, y };
                const yPlus = evalDiffAt(x + h);
                const yMinus = evalDiffAt(x - h);
                const dy = (yPlus - yMinus) / (2 * h);
                if (Math.abs(dy) < 1e-14) {
                    x += (Math.random() - 0.5) * 0.1;
                    continue;
                }
                const step = y / dy;
                x -= Math.max(-1e6, Math.min(1e6, step));
                if (!isFinite(x)) return null;
            }
            const finalDiff = evalDiffAt(x);
            if (Math.abs(finalDiff) < 1e-5) return { x, y: finalDiff };
            return null;
        };

        const startingGuesses = [
            initialGuess,
            initialGuess === 0 ? 1 : 0,
            initialGuess + 1,
            initialGuess - 1,
            2,
            -2,
            10,
            -10
        ];

        let bestSol = null;
        for (const g of startingGuesses) {
            const sol = trySolveFrom(g);
            if (sol) {
                if (!bestSol || Math.abs(sol.y) < Math.abs(bestSol.y)) {
                    bestSol = sol;
                    if (Math.abs(sol.y) < 1e-10) break;
                }
            }
        }

        this.engine.registers[tVar] = oldTarget;

        if (bestSol) {
            const cleanNumber = (val) => {
                if (!isFinite(val)) return val;
                const denoms = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 32, 50, 64, 100, 1000];
                for (const d of denoms) {
                    const rounded = Math.round(val * d);
                    if (Math.abs(val * d - rounded) < 1e-6) {
                        return rounded / d;
                    }
                }
                const fixed8 = parseFloat(val.toFixed(8));
                if (Math.abs(val - fixed8) < 1e-7) return fixed8;
                return parseFloat(val.toFixed(9));
            };

            const finalX = cleanNumber(bestSol.x);
            const finalDiff = evalDiffAt(finalX);
            const lrDiff = Math.abs(finalDiff) < 1e-10 ? 0 : (Math.abs(bestSol.y) < 1e-11 ? 0 : parseFloat(bestSol.y.toPrecision(3)));
            return {
                success: true,
                x: finalX,
                lr: lrDiff
            };
        }

        const fallbackDiff = evalDiffAt(initialGuess);
        return {
            success: false,
            x: initialGuess,
            lr: Math.abs(fallbackDiff) < 1e-11 ? 0 : parseFloat(fallbackDiff.toPrecision(3))
        };
    }

    // ==========================================
    // 7. RATIO SOLVER (MODE C) (Pages 178-180)
    // ==========================================
    solveRatio(type, a, b, c, d) {
        // type 1: A:B = X:D => X = (A * D) / B
        // type 2: A:B = C:X => X = (B * C) / A
        if (type === 1) {
            if (b === 0) throw new Error("Math ERROR: B không thể bằng 0");
            return parseFloat(((a * d) / b).toFixed(8));
        } else {
            if (a === 0) throw new Error("Math ERROR: A không thể bằng 0");
            return parseFloat(((b * c) / a).toFixed(8));
        }
    }

    // ==========================================
    // 8. VERIFY FUNCTION (Pages 175-178)
    // ==========================================
    verifyExpression(exprStr) {
        // Parses relational operators =, ≠, >, <, ≥, ≤
        const relOps = ["<=", ">=", "==", "!=", "<", ">", "="];
        let opFound = null;
        for (const op of relOps) {
            if (exprStr.includes(op)) {
                opFound = op;
                break;
            }
        }
        if (!opFound) return false;

        const parts = exprStr.split(opFound);
        if (parts.length !== 2) return false;

        const leftVal = Number(this.engine.calculate(parts[0]));
        const rightVal = Number(this.engine.calculate(parts[1]));

        let result = false;
        if (opFound === "=" || opFound === "==") result = Math.abs(leftVal - rightVal) < 1e-10;
        else if (opFound === "!=") result = Math.abs(leftVal - rightVal) >= 1e-10;
        else if (opFound === "<") result = leftVal < rightVal;
        else if (opFound === ">") result = leftVal > rightVal;
        else if (opFound === "<=") result = leftVal <= rightVal + 1e-10;
        else if (opFound === ">=") result = leftVal >= rightVal - 1e-10;

        // In Casio, Verify stores 1 in Ans if True, 0 if False
        this.engine.ans = result ? 1 : 0;
        return result;
    }
}

if (typeof window !== "undefined") {
    window.CasioSolvers = CasioSolvers;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { CasioSolvers };
}
