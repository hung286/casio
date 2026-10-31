/**
 * Casio fx-580VN X Emulator - Math & Evaluation Engine
 * Handles expression parsing, natural textbook display,
 * fraction arithmetic, scientific functions, and memory registers.
 */

class Fraction {
    constructor(num, den = 1) {
        if (den === 0) throw new Error("Math ERROR: Phép chia cho 0");
        if (den < 0) {
            num = -num;
            den = -den;
        }
        const g = Fraction.gcd(Math.abs(num), Math.abs(den));
        this.num = Math.round(num / g);
        this.den = Math.round(den / g);
    }

    static gcd(a, b) {
        a = Math.round(Math.abs(a));
        b = Math.round(Math.abs(b));
        while (b) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a || 1;
    }

    static lcm(a, b) {
        return Math.abs(a * b) / Fraction.gcd(a, b);
    }

    add(other) {
        const o = Fraction.from(other);
        return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den);
    }

    sub(other) {
        const o = Fraction.from(other);
        return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den);
    }

    mul(other) {
        const o = Fraction.from(other);
        return new Fraction(this.num * o.num, this.den * o.den);
    }

    div(other) {
        const o = Fraction.from(other);
        if (o.num === 0) throw new Error("Math ERROR: Chia cho 0");
        return new Fraction(this.num * o.den, this.den * o.num);
    }

    pow(p) {
        if (Number.isInteger(p)) {
            if (p >= 0) {
                return new Fraction(Math.pow(this.num, p), Math.pow(this.den, p));
            } else {
                return new Fraction(Math.pow(this.den, -p), Math.pow(this.num, -p));
            }
        }
        return Math.pow(this.valueOf(), p);
    }

    valueOf() {
        return this.num / this.den;
    }

    toMixed() {
        const whole = Math.trunc(this.num / this.den);
        const rem = Math.abs(this.num % this.den);
        return { whole, num: rem, den: this.den };
    }

    toString(format = "improper") {
        if (this.den === 1) return `${this.num}`;
        if (format === "mixed") {
            const { whole, num, den } = this.toMixed();
            if (whole === 0) return `${this.num}/${this.den}`;
            return `${whole}⌟${num}/${den}`;
        }
        return `${this.num}/${this.den}`;
    }

    static from(val) {
        if (val instanceof Fraction) return val;
        if (typeof val === "number") {
            if (!Number.isFinite(val)) throw new Error("Math ERROR");
            if (Number.isInteger(val)) return new Fraction(val, 1);
            // Continuous fraction algorithm to find closest rational approximation
            const tolerance = 1e-10;
            let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
            let b = val;
            let maxIter = 25;
            do {
                let a = Math.floor(b);
                let aux = h1;
                h1 = a * h1 + h2;
                h2 = aux;
                aux = k1;
                k1 = a * k1 + k2;
                k2 = aux;
                let denom = b - a;
                if (Math.abs(denom) < 1e-12) break;
                b = 1 / denom;
            } while (Math.abs(val - h1 / k1) > val * tolerance && --maxIter > 0 && k1 < 1e8);

            if (k1 > 0 && Math.abs(val - h1 / k1) < 1e-8) {
                return new Fraction(h1, k1);
            }
            // fallback
            const s = val.toString();
            if (s.includes(".")) {
                const decPlaces = Math.min(8, s.split(".")[1].length);
                const d = Math.pow(10, decPlaces);
                return new Fraction(Math.round(val * d), d);
            }
            return new Fraction(Math.round(val), 1);
        }
        throw new Error("Invalid fraction conversion");
    }
}

class Complex {
    constructor(re, im = 0) {
        this.re = Number(re);
        this.im = Number(im);
    }

    add(o) {
        o = Complex.from(o);
        return new Complex(this.re + o.re, this.im + o.im);
    }

    sub(o) {
        o = Complex.from(o);
        return new Complex(this.re - o.re, this.im - o.im);
    }

    mul(o) {
        o = Complex.from(o);
        return new Complex(
            this.re * o.re - this.im * o.im,
            this.re * o.im + this.im * o.re
        );
    }

    div(o) {
        o = Complex.from(o);
        const den = o.re * o.re + o.im * o.im;
        if (den === 0) throw new Error("Math ERROR: Chia cho 0");
        return new Complex(
            (this.re * o.re + this.im * o.im) / den,
            (this.im * o.re - this.re * o.im) / den
        );
    }

    abs() {
        return Math.hypot(this.re, this.im);
    }

    arg() {
        return Math.atan2(this.im, this.re);
    }

    conjugate() {
        return new Complex(this.re, -this.im);
    }

    static from(val) {
        if (val instanceof Complex) return val;
        if (typeof val === "number") return new Complex(val, 0);
        if (val instanceof Fraction) return new Complex(val.valueOf(), 0);
        return new Complex(0, 0);
    }

    toString(angleUnit = "DEG") {
        const clean = (n) => {
            if (Math.abs(n) < 1e-12) return 0;
            return Number(n.toFixed(10));
        };
        const r = clean(this.re);
        const i = clean(this.im);
        if (i === 0) return `${r}`;
        if (r === 0) {
            if (i === 1) return `i`;
            if (i === -1) return `-i`;
            return `${i}i`;
        }
        const sign = i > 0 ? "+" : "-";
        const absI = Math.abs(i);
        const iStr = absI === 1 ? "i" : `${absI}i`;
        return `${r}${sign}${iStr}`;
    }
}

class CasioVector {
    constructor(data = [0, 0, 0]) {
        this.dim = data.length;
        this.data = data.map(Number);
    }

    add(o) {
        if (this.dim !== o.dim) throw new Error("Dim ERROR");
        return new CasioVector(this.data.map((v, i) => v + o.data[i]));
    }

    sub(o) {
        if (this.dim !== o.dim) throw new Error("Dim ERROR");
        return new CasioVector(this.data.map((v, i) => v - o.data[i]));
    }

    mulScalar(k) {
        return new CasioVector(this.data.map(v => v * k));
    }

    cross(o) {
        if (this.dim !== 3 || o.dim !== 3) throw new Error("Dim ERROR: Tích có hướng yêu cầu Vct 3 chiều");
        const a = this.data;
        const b = o.data;
        return new CasioVector([
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ]);
    }

    dot(o) {
        if (this.dim !== o.dim) throw new Error("Dim ERROR");
        let sum = 0;
        for (let i = 0; i < this.dim; i++) {
            sum += this.data[i] * o.data[i];
        }
        return sum;
    }

    norm() {
        let sum = 0;
        for (let i = 0; i < this.dim; i++) {
            sum += this.data[i] * this.data[i];
        }
        return Math.sqrt(sum);
    }

    angle(o) {
        const d = this.dot(o);
        const m1 = this.norm();
        const m2 = o.norm();
        if (m1 === 0 || m2 === 0) throw new Error("Math ERROR");
        let cosTheta = Math.max(-1, Math.min(1, d / (m1 * m2)));
        return (Math.acos(cosTheta) * 180) / Math.PI;
    }

    unit() {
        const m = this.norm();
        if (m === 0) throw new Error("Math ERROR");
        return new CasioVector(this.data.map(v => v / m));
    }

    toString() {
        return `[ ${this.data.map(n => parseFloat(n.toFixed(4))).join("  ")} ]`;
    }
}

class CasioEngine {
    constructor() {
        this.angleUnit = "DEG"; // DEG, RAD, GRA
        this.displayFormat = "NORMAL"; // NORMAL, FIX, SCI
        this.fixDigits = 2;
        this.sciDigits = 3;
        this.fractionFormat = "d/c"; // d/c (improper) or ab/c (mixed)
        this.mode = 1; // 1: COMP (Calculate), 2: CMPLX (Complex), 3: BASE-N, 4: MATRIX, 5: VECTOR, 6: STAT, 9: TABLE, 10: EQN (A), 11: INEQ (B), 12: RATIO
        this.inputOutputMode = "MathI/MathO";
        this.engineerSymbol = false;
        this.complexFormat = "a+bi";
        this.statFreq = true;
        this.tableType = "f(x)";
        this.recurringDec = true;
        this.decimalMark = ".";
        this.language = "vi";
        this.contrast = 8;
        this.autoPowerOff = 10;

        // Memory registers
        this.registers = {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            E: 0,
            F: 0,
            x: 0,
            y: 0,
            z: 0,
            M: 0
        };
        // Vector registers (Mode 5)
        this.vectors = {
            VctA: new CasioVector([0, 0, 0]),
            VctB: new CasioVector([0, 0, 0]),
            VctC: new CasioVector([0, 0, 0]),
            VctD: new CasioVector([0, 0, 0]),
            VctAns: new CasioVector([0, 0, 0])
        };
        this.ans = 0;
        this.preAns = 0;
        this.history = [];
        this.historyIndex = -1;
    }

    resetSetup() {
        this.inputOutputMode = "MathI/MathO";
        this.angleUnit = "DEG";
        this.displayFormat = "NORMAL";
        this.fractionFormat = "d/c";
        this.complexFormat = "a+bi";
        this.statFreq = true;
        this.tableType = "f(x)";
        this.recurringDec = true;
        this.decimalMark = ".";
    }

    resetMemory() {
        for (const k in this.registers) {
            this.registers[k] = 0;
        }
        this.ans = 0;
        this.preAns = 0;
        this.history = [];
        this.historyIndex = -1;
    }

    resetAll() {
        this.resetSetup();
        this.resetMemory();
        this.mode = 1;
    }

    formatDMS(val) {
        const num = Number(val);
        if (isNaN(num)) return "0°0'0\"";
        const sign = num < 0 ? "-" : "";
        const abs = Math.abs(num);
        const d = Math.floor(abs);
        const remM = (abs - d) * 60;
        const m = Math.floor(remM);
        const s = ((remM - m) * 60).toFixed(2).replace(/\.00$/, "");
        return `${sign}${d}°${m}'${s}"`;
    }

    preprocessDMS(expr) {
        if (!expr) return expr;
        // 3 parts: e.g. 2°15°18° or 2°15'18"
        expr = expr.replace(/(\d+(?:\.\d+)?)[°](\d+(?:\.\d+)?)[°'](\d+(?:\.\d+)?)[°"]/g, "($1 + $2/60 + $3/3600)");
        // 2 parts: e.g. 2°30° or 2°30'
        expr = expr.replace(/(\d+(?:\.\d+)?)[°](\d+(?:\.\d+)?)[°']/g, "($1 + $2/60)");
        // 1 part: e.g. 45°
        expr = expr.replace(/(\d+(?:\.\d+)?)[°]/g, "($1)");
        return expr;
    }

    setAngleUnit(unit) {
        if (["DEG", "RAD", "GRA"].includes(unit)) {
            this.angleUnit = unit;
        }
    }

    toRadians(val) {
        if (this.angleUnit === "DEG") return (val * Math.PI) / 180;
        if (this.angleUnit === "GRA") return (val * Math.PI) / 200;
        return val;
    }

    fromRadians(val) {
        if (this.angleUnit === "DEG") return (val * 180) / Math.PI;
        if (this.angleUnit === "GRA") return (val * 200) / Math.PI;
        return val;
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error("Math ERROR: Giai thừa không hợp lệ");
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    nPr(n, r) {
        if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) {
            throw new Error("Math ERROR: Chỉnh hợp không hợp lệ");
        }
        let res = 1;
        for (let i = n - r + 1; i <= n; i++) res *= i;
        return res;
    }

    nCr(n, r) {
        if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) {
            throw new Error("Math ERROR: Tổ hợp không hợp lệ");
        }
        if (r === 0 || r === n) return 1;
        if (r > n / 2) r = n - r;
        let res = 1;
        for (let i = 1; i <= r; i++) {
            res = (res * (n - i + 1)) / i;
        }
        return Math.round(res);
    }

    primeFactorization(n) {
        n = Math.round(Math.abs(n));
        if (n <= 1) return `${n}`;
        if (n > 1e12) return `${n}`;
        const toSup = (num) => {
            const map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
            return String(num).split("").map(c => map[c] || c).join("");
        };
        const factors = [];
        let d = 2;
        while (d * d <= n) {
            let count = 0;
            while (n % d === 0) {
                count++;
                n /= d;
            }
            if (count > 0) {
                factors.push(count === 1 ? `${d}` : `${d}${toSup(count)}`);
            }
            d = d === 2 ? 3 : d + 2;
        }
        if (n > 1) {
            factors.push(`${n}`);
        }
        return factors.join(" × ");
    }

    gcd(a, b) {
        return Fraction.gcd(a, b);
    }

    lcm(a, b) {
        return Fraction.lcm(a, b);
    }

    // Numerical integration using Simpson's 1/3 rule
    integrate(expr, a, b) {
        const N = 50;
        const h = (b - a) / N;
        const evalAt = (val) => {
            const oldX = this.registers.x;
            this.registers.x = val;
            try {
                const res = this.calculate(expr);
                this.registers.x = oldX;
                return typeof res === "number" ? res : parseFloat(res) || 0;
            } catch (e) {
                this.registers.x = oldX;
                return 0;
            }
        };
        let sum = evalAt(a) + evalAt(b);
        for (let i = 1; i < N; i++) {
            const x = a + i * h;
            sum += (i % 2 === 0 ? 2 : 4) * evalAt(x);
        }
        return parseFloat(((sum * h) / 3).toFixed(8));
    }

    // Numerical derivative using central difference
    derivative(expr, a) {
        const h = 1e-6;
        const oldX = this.registers.x;
        this.registers.x = a + h;
        const y2 = this.calculate(expr);
        this.registers.x = a - h;
        const y1 = this.calculate(expr);
        this.registers.x = oldX;
        const n2 = typeof y2 === "number" ? y2 : parseFloat(y2) || 0;
        const n1 = typeof y1 === "number" ? y1 : parseFloat(y1) || 0;
        return parseFloat(((n2 - n1) / (2 * h)).toFixed(8));
    }

    // Summation Σ(f(x), a, b)
    summation(expr, a, b) {
        let sum = 0;
        const start = Math.round(a);
        const end = Math.round(b);
        const oldX = this.registers.x;
        for (let i = start; i <= end; i++) {
            this.registers.x = i;
            const val = this.calculate(expr);
            sum += typeof val === "number" ? val : parseFloat(val) || 0;
        }
        this.registers.x = oldX;
        return parseFloat(sum.toFixed(8));
    }

    // Product ∏(f(x), a, b)
    product(expr, a, b) {
        let prod = 1;
        const start = Math.round(a);
        const end = Math.round(b);
        const oldX = this.registers.x;
        for (let i = start; i <= end; i++) {
            this.registers.x = i;
            const val = this.calculate(expr);
            prod *= typeof val === "number" ? val : parseFloat(val) || 0;
        }
        this.registers.x = oldX;
        return parseFloat(prod.toFixed(8));
    }

    // Remainder division a ÷R b
    divR(a, b) {
        if (b === 0) throw new Error("Math ERROR: Chia cho 0");
        const q = Math.trunc(a / b);
        const r = a % b;
        this.registers.E = q;
        this.registers.F = r;
        return { type: "DIVR", q, r };
    }

    // Polar coordinate conversion Pol(X, Y)
    pol(x, y) {
        const r = Math.sqrt(x * x + y * y);
        const theta = this.fromRadians(Math.atan2(y, x));
        const cleanR = parseFloat(r.toFixed(6));
        const cleanTheta = parseFloat(theta.toFixed(6));
        this.registers.x = cleanR;
        this.registers.y = cleanTheta;
        return { type: "POL", r: cleanR, theta: cleanTheta };
    }

    // Rectangular coordinate conversion Rec(r, θ)
    rec(r, theta) {
        const rad = this.toRadians(theta);
        const x = r * Math.cos(rad);
        const y = r * Math.sin(rad);
        const cleanX = parseFloat(x.toFixed(6));
        const cleanY = parseFloat(y.toFixed(6));
        this.registers.x = cleanX;
        this.registers.y = cleanY;
        return { type: "REC", x: cleanX, y: cleanY };
    }

    // Tokenizer that recognizes Casio symbols, operations, functions, variables
    tokenize(exprStr) {
        let str = exprStr
            .replace(/\s+/g, "")
            .replace(/÷R/gi, " divr ")
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/π/g, "PI")
            .replace(/Ans/g, "ANS")
            .replace(/PreAns/g, "PREANS");

        const tokens = [];
        let i = 0;
        const len = str.length;

        const isDigit = (c) => (c >= '0' && c <= '9') || c === '.';
        const isAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

        while (i < len) {
            let char = str[i];

            // Scientific exponent notation: e.g. 5e-3 or 5*10^3
            if (isDigit(char)) {
                let numStr = "";
                while (i < len && (isDigit(str[i]))) {
                    numStr += str[i];
                    i++;
                }
                // Check for scientific exponent e.g. 1.2e-4
                if (i < len && (str[i] === 'e' || str[i] === 'E') && (i + 1 < len) && (str[i+1] === '+' || str[i+1] === '-' || isDigit(str[i+1]))) {
                    numStr += str[i++];
                    if (str[i] === '+' || str[i] === '-') numStr += str[i++];
                    while (i < len && isDigit(str[i])) {
                        numStr += str[i++];
                    }
                }
                tokens.push({ type: "NUMBER", value: parseFloat(numStr), raw: numStr });
                continue;
            }

            // Identifiers / functions / variables
            if (isAlpha(char)) {
                let id = "";
                while (i < len && (isAlpha(str[i]) || isDigit(str[i]))) {
                    id += str[i];
                    i++;
                }

                // Check known words
                const upper = id.toUpperCase();
                if (upper === "PI") {
                    tokens.push({ type: "NUMBER", value: Math.PI, raw: "π" });
                } else if (upper === "E" && (i >= len || !isAlpha(str[i]))) {
                    tokens.push({ type: "NUMBER", value: Math.E, raw: "e" });
                } else if (upper === "I" && this.mode === 2) {
                    tokens.push({ type: "COMPLEX_I", value: new Complex(0, 1) });
                } else if (upper === "ANS") {
                    tokens.push({ type: "NUMBER", value: this.ans, raw: "Ans" });
                } else if (upper === "PREANS") {
                    tokens.push({ type: "NUMBER", value: this.preAns, raw: "PreAns" });
                } else if (this.vectors && (this.vectors.hasOwnProperty(id) || this.vectors.hasOwnProperty(upper.replace("VCT", "Vct")))) {
                    const vName = this.vectors.hasOwnProperty(id) ? id : upper.replace("VCT", "Vct");
                    tokens.push({ type: "VECTOR", name: vName, value: this.vectors[vName] });
                } else if (this.registers.hasOwnProperty(id)) {
                    tokens.push({ type: "VARIABLE", name: id, value: this.registers[id] });
                } else {
                    // Function name
                    tokens.push({ type: "FUNCTION", name: id.toLowerCase() });
                }
                continue;
            }

            // Operators and punctuation
            if ("+-*/^%!,():;•".includes(char)) {
                // Two-character operators like <=, >=, etc. if needed
                tokens.push({ type: "OPERATOR", value: char });
                i++;
                continue;
            }

            // Special unicode or fraction symbols
            if (char === '⌟') {
                tokens.push({ type: "OPERATOR", value: "⌟" });
                i++;
                continue;
            }

            // Unknown
            tokens.push({ type: "UNKNOWN", value: char });
            i++;
        }

        // Implicit multiplication insertion
        const expandedTokens = [];
        for (let j = 0; j < tokens.length; j++) {
            const curr = tokens[j];
            expandedTokens.push(curr);

            if (j < tokens.length - 1) {
                const next = tokens[j + 1];
                const isCurrValue = curr.type === "NUMBER" || curr.type === "VARIABLE" || curr.type === "VECTOR" || curr.type === "COMPLEX_I" || (curr.type === "OPERATOR" && curr.value === ")") || (curr.type === "OPERATOR" && curr.value === "!");
                const isNextValue = next.type === "NUMBER" || next.type === "VARIABLE" || next.type === "VECTOR" || next.type === "FUNCTION" || next.type === "COMPLEX_I" || (next.type === "OPERATOR" && next.value === "(");

                if (isCurrValue && isNextValue) {
                    expandedTokens.push({ type: "OPERATOR", value: "*" });
                }
            }
        }

        return expandedTokens;
    }

    // Shunting-yard algorithm to parse expressions with proper operator precedence
    parseToRPN(tokens) {
        const outputQueue = [];
        const operatorStack = [];

        const precedence = {
            "+": 2,
            "-": 2,
            "*": 3,
            "/": 3,
            "%": 3,
            "•": 3,
            "⌟": 4, // Mixed fraction separator
            "^": 5,
            "NEG": 6, // Unary minus
            "!": 7
        };

        const associativity = {
            "+": "L",
            "-": "L",
            "*": "L",
            "/": "L",
            "%": "L",
            "•": "L",
            "⌟": "L",
            "^": "R",
            "NEG": "R",
            "!": "L"
        };

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === "NUMBER" || token.type === "VARIABLE" || token.type === "VECTOR" || token.type === "COMPLEX_I") {
                outputQueue.push(token);
            } else if (token.type === "FUNCTION") {
                operatorStack.push(token);
            } else if (token.type === "OPERATOR") {
                let op = token.value;

                // Handle unary minus
                if (op === "-") {
                    const prev = i > 0 ? tokens[i - 1] : null;
                    if (!prev || (prev.type === "OPERATOR" && prev.value !== ")") || prev.type === "FUNCTION") {
                        op = "NEG";
                    }
                }

                if (op === "(") {
                    operatorStack.push({ type: "LPAREN", value: "(" });
                } else if (op === ")") {
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value !== "(") {
                        outputQueue.push(operatorStack.pop());
                    }
                    if (operatorStack.length === 0) {
                        throw new Error("Syntax ERROR: Lỗi ngoặc đóng không khớp");
                    }
                    operatorStack.pop(); // Pop "("
                    if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === "FUNCTION") {
                        outputQueue.push(operatorStack.pop());
                    }
                } else if (op === ",") {
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value !== "(") {
                        outputQueue.push(operatorStack.pop());
                    }
                } else {
                    const p1 = precedence[op] || 0;
                    const a1 = associativity[op] || "L";

                    while (operatorStack.length > 0) {
                        const top = operatorStack[operatorStack.length - 1];
                        if (top.type === "LPAREN") break;
                        const p2 = precedence[top.value] || 0;
                        if ((a1 === "L" && p1 <= p2) || (a1 === "R" && p1 < p2)) {
                            outputQueue.push(operatorStack.pop());
                        } else {
                            break;
                        }
                    }
                    operatorStack.push({ type: "OPERATOR", value: op });
                }
            }
        }

        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op.type === "LPAREN") throw new Error("Syntax ERROR: Thiếu dấu ngoặc đóng");
            outputQueue.push(op);
        }

        return outputQueue;
    }

    // Evaluate RPN expression
    evaluateRPN(rpnQueue) {
        const stack = [];

        for (const token of rpnQueue) {
            if (token.type === "NUMBER") {
                stack.push(token.value);
            } else if (token.type === "VARIABLE") {
                stack.push(token.value);
            } else if (token.type === "COMPLEX_I") {
                stack.push(token.value);
            } else if (token.type === "VECTOR") {
                stack.push(token.value);
            } else if (token.type === "OPERATOR") {
                const op = token.value;
                if (op === "NEG") {
                    if (stack.length < 1) throw new Error("Syntax ERROR");
                    const a = stack.pop();
                    if (a instanceof Complex) stack.push(new Complex(-a.re, -a.im));
                    else if (a instanceof CasioVector) stack.push(a.mulScalar(-1));
                    else stack.push(-a);
                } else if (op === "!") {
                    if (stack.length < 1) throw new Error("Syntax ERROR");
                    const a = stack.pop();
                    stack.push(this.factorial(a));
                } else {
                    if (stack.length < 2) throw new Error("Syntax ERROR: Thiếu toán hạng");
                    const b = stack.pop();
                    const a = stack.pop();

                    // Complex operations
                    if (a instanceof Complex || b instanceof Complex) {
                        const ca = Complex.from(a);
                        const cb = Complex.from(b);
                        if (op === "+") stack.push(ca.add(cb));
                        else if (op === "-") stack.push(ca.sub(cb));
                        else if (op === "*") stack.push(ca.mul(cb));
                        else if (op === "/") stack.push(ca.div(cb));
                        else throw new Error("Math ERROR: Phép toán không hỗ trợ cho số phức");
                        continue;
                    }

                    // Vector operations
                    if (a instanceof CasioVector || b instanceof CasioVector) {
                        if (a instanceof CasioVector && b instanceof CasioVector) {
                            if (op === "+") stack.push(a.add(b));
                            else if (op === "-") stack.push(a.sub(b));
                            else if (op === "*") stack.push(a.cross(b)); // Cross product
                            else if (op === "•") stack.push(a.dot(b)); // Dot product
                            else throw new Error("Math ERROR: Phép toán không hỗ trợ giữa 2 véc-tơ");
                        } else if (a instanceof CasioVector && typeof b === "number") {
                            if (op === "*") stack.push(a.mulScalar(b));
                            else if (op === "/") {
                                if (Math.abs(b) < 1e-15) throw new Error("Math ERROR: Chia cho 0");
                                stack.push(a.mulScalar(1 / b));
                            } else throw new Error("Math ERROR");
                        } else if (typeof a === "number" && b instanceof CasioVector) {
                            if (op === "*") stack.push(b.mulScalar(a));
                            else throw new Error("Math ERROR");
                        }
                        continue;
                    }

                    if (op === "+") stack.push(a + b);
                    else if (op === "-") stack.push(a - b);
                    else if (op === "*") stack.push(a * b);
                    else if (op === "/") {
                        if (Math.abs(b) < 1e-15) throw new Error("Math ERROR: Chia cho 0");
                        stack.push(a / b);
                    } else if (op === "%") {
                        stack.push((a * b) / 100);
                    } else if (op === "^") {
                        if (a < 0 && !Number.isInteger(b)) {
                            if (this.mode === 2) {
                                // Complex power
                                const r = Math.pow(Math.abs(a), b);
                                const theta = Math.PI * b;
                                stack.push(new Complex(r * Math.cos(theta), r * Math.sin(theta)));
                                continue;
                            } else {
                                throw new Error("Math ERROR: Căn bậc chẵn của số âm");
                            }
                        }
                        stack.push(Math.pow(a, b));
                    } else if (op === "⌟") {
                        // Mixed fraction a ⌟ b / c => (a*c + b)/c
                        // Note: usually evaluated in conjunction with fraction
                        stack.push(a + b);
                    }
                }
            } else if (token.type === "FUNCTION") {
                const fn = token.name;
                // Single argument functions
                if (["sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh",
                     "log", "ln", "sqrt", "cbrt", "abs", "round", "fact", "arg", "conjg", "re", "im", "int", "intg", "rnd", "ran", "unitv"].includes(fn)) {
                    if (stack.length < 1) throw new Error("Syntax ERROR");
                    const arg = stack.pop();

                    // Complex handling for functions
                    if (arg instanceof Complex) {
                        if (fn === "abs") stack.push(arg.abs());
                        else if (fn === "arg") stack.push(this.fromRadians(arg.arg()));
                        else if (fn === "conjg") stack.push(arg.conjugate());
                        else if (fn === "re") stack.push(arg.re);
                        else if (fn === "im") stack.push(arg.im);
                        else throw new Error("Math ERROR: Hàm không hỗ trợ số phức");
                        continue;
                    }

                    // Vector handling for single-argument functions
                    if (arg instanceof CasioVector) {
                        if (fn === "abs") stack.push(arg.norm());
                        else if (fn === "unitv") stack.push(arg.unit());
                        else throw new Error("Math ERROR: Hàm không hỗ trợ cho véc-tơ");
                        continue;
                    }

                    if (fn === "sin") {
                        const rad = this.toRadians(arg);
                        // Clean exact multiples of 180 / 90
                        const degNorm = Math.round(arg % 360);
                        if (this.angleUnit === "DEG" && (degNorm === 0 || Math.abs(degNorm) === 180)) stack.push(0);
                        else if (this.angleUnit === "DEG" && (degNorm === 90 || degNorm === -270)) stack.push(1);
                        else if (this.angleUnit === "DEG" && (degNorm === 270 || degNorm === -90)) stack.push(-1);
                        else stack.push(Math.sin(rad));
                    } else if (fn === "cos") {
                        const rad = this.toRadians(arg);
                        const degNorm = Math.round(arg % 360);
                        if (this.angleUnit === "DEG" && (Math.abs(degNorm) === 90 || Math.abs(degNorm) === 270)) stack.push(0);
                        else if (this.angleUnit === "DEG" && (degNorm === 0)) stack.push(1);
                        else if (this.angleUnit === "DEG" && (Math.abs(degNorm) === 180)) stack.push(-1);
                        else stack.push(Math.cos(rad));
                    } else if (fn === "tan") {
                        const degNorm = Math.abs(Math.round(arg % 360));
                        if (this.angleUnit === "DEG" && (degNorm === 90 || degNorm === 270)) {
                            throw new Error("Math ERROR: tan không xác định tại 90°");
                        }
                        const rad = this.toRadians(arg);
                        stack.push(Math.tan(rad));
                    } else if (fn === "asin") {
                        if (arg < -1 || arg > 1) throw new Error("Math ERROR: Ngoài miền xác định asin [-1, 1]");
                        stack.push(this.fromRadians(Math.asin(arg)));
                    } else if (fn === "acos") {
                        if (arg < -1 || arg > 1) throw new Error("Math ERROR: Ngoài miền xác định acos [-1, 1]");
                        stack.push(this.fromRadians(Math.acos(arg)));
                    } else if (fn === "atan") {
                        stack.push(this.fromRadians(Math.atan(arg)));
                    } else if (fn === "sinh") {
                        stack.push(Math.sinh(arg));
                    } else if (fn === "cosh") {
                        stack.push(Math.cosh(arg));
                    } else if (fn === "tanh") {
                        stack.push(Math.tanh(arg));
                    } else if (fn === "log") {
                        if (arg <= 0) throw new Error("Math ERROR: log số không dương");
                        stack.push(Math.log10(arg));
                    } else if (fn === "ln") {
                        if (arg <= 0) throw new Error("Math ERROR: ln số không dương");
                        stack.push(Math.log(arg));
                    } else if (fn === "sqrt") {
                        if (arg < 0) {
                            if (this.mode === 2) stack.push(new Complex(0, Math.sqrt(-arg)));
                            else throw new Error("Math ERROR: Căn bậc 2 của số âm");
                        } else {
                            stack.push(Math.sqrt(arg));
                        }
                    } else if (fn === "cbrt") {
                        stack.push(Math.cbrt(arg));
                    } else if (fn === "abs") {
                        stack.push(Math.abs(arg));
                    } else if (fn === "fact") {
                        stack.push(this.primeFactorization(arg));
                    } else if (fn === "int") {
                        stack.push(Math.trunc(arg));
                    } else if (fn === "intg") {
                        stack.push(Math.floor(arg));
                    } else if (fn === "rnd") {
                        stack.push(Number(arg.toFixed(this.fixDigits || 2)));
                    } else if (fn === "ran") {
                        stack.push(parseFloat(Math.random().toFixed(3)));
                    }
                }
                // Two argument functions
                else if (["npr", "ncr", "logab", "gcd", "lcm", "mod", "root", "divr", "pol", "rec", "ranint", "dot", "angle"].includes(fn)) {
                    if (stack.length < 2) throw new Error("Syntax ERROR");
                    const b = stack.pop();
                    const a = stack.pop();
                    if (fn === "dot") {
                        if (!(a instanceof CasioVector) || !(b instanceof CasioVector)) throw new Error("Math ERROR: Yêu cầu 2 véc-tơ");
                        stack.push(a.dot(b));
                    } else if (fn === "angle") {
                        if (!(a instanceof CasioVector) || !(b instanceof CasioVector)) throw new Error("Math ERROR: Yêu cầu 2 véc-tơ");
                        stack.push(a.angle(b));
                    } else if (fn === "npr") stack.push(this.nPr(a, b));
                    else if (fn === "ncr") stack.push(this.nCr(a, b));
                    else if (fn === "logab") {
                        if (a <= 0 || a === 1 || b <= 0) throw new Error("Math ERROR: Cơ số logab không hợp lệ");
                        stack.push(Math.log(b) / Math.log(a));
                    } else if (fn === "gcd") stack.push(this.gcd(a, b));
                    else if (fn === "lcm") stack.push(this.lcm(a, b));
                    else if (fn === "mod") stack.push(a % b);
                    else if (fn === "divr") stack.push(this.divR(a, b));
                    else if (fn === "pol") stack.push(this.pol(a, b));
                    else if (fn === "rec") stack.push(this.rec(a, b));
                    else if (fn === "ranint") {
                        const min = Math.min(a, b);
                        const max = Math.max(a, b);
                        stack.push(Math.floor(Math.random() * (max - min + 1)) + min);
                    }
                    else if (fn === "root") {
                        // a-th root of b
                        if (b < 0 && a % 2 === 0) throw new Error("Math ERROR");
                        const res = Math.pow(Math.abs(b), 1 / a);
                        stack.push(b < 0 ? -res : res);
                    }
                }
            }
        }

        if (stack.length !== 1) throw new Error("Syntax ERROR: Biểu thức không hợp lệ");
        return stack[0];
    }

    // Main evaluation method
    calculate(expr) {
        if (!expr || expr.trim() === "") return 0;
        try {
            // Multi-statement handling with colon ':'
            if (expr.includes(":")) {
                const statements = expr.split(":").map(s => s.trim()).filter(s => s.length > 0);
                let lastRes = 0;
                for (const stmt of statements) {
                    const assignMatch = stmt.match(/^([A-Za-z])\s*=\s*(.+)$/);
                    if (assignMatch && this.registers.hasOwnProperty(assignMatch[1])) {
                        const varName = assignMatch[1];
                        const val = this.calculate(assignMatch[2]);
                        const numVal = typeof val === "number" ? val : parseFloat(val) || 0;
                        this.registers[varName] = numVal;
                        lastRes = numVal;
                    } else {
                        lastRes = this.calculate(stmt);
                    }
                }
                return lastRes;
            }

            // Check if Verify mode expression (contains comparison operators =, !=, <, >, <=, >=)
            // But not simple assignment
            const isVerify = /(==|!=|<=|>=|[<>]|=(?!=))/.test(expr) && !/^[A-Za-z]\s*=\s*[^=]/.test(expr);
            if (isVerify) {
                const SolversClass = typeof CasioSolvers !== "undefined" ? CasioSolvers : require("./solvers.js").CasioSolvers;
                const solvers = new SolversClass(this);
                const isTrue = solvers.verifyExpression(expr);
                return isTrue ? "ĐÚNG (True)" : "SAI (False)";
            }

            // Preprocess DMS expressions (e.g. 2°15°18° -> (2 + 15/60 + 18/3600))
            expr = this.preprocessDMS(expr);

            // Preprocess integrate(f, a, b)
            while (expr.includes("integrate(")) {
                const idx = expr.indexOf("integrate(");
                let depth = 0;
                let closeIdx = -1;
                const commas = [];
                for (let i = idx + 10; i < expr.length; i++) {
                    if (expr[i] === '(') depth++;
                    else if (expr[i] === ')') {
                        if (depth === 0) { closeIdx = i; break; }
                        depth--;
                    } else if (expr[i] === ',' && depth === 0) {
                        commas.push(i);
                    }
                }
                if (closeIdx !== -1 && commas.length >= 2) {
                    const fStr = expr.substring(idx + 10, commas[0]).trim();
                    const aStr = expr.substring(commas[0] + 1, commas[1]).trim();
                    const bStr = expr.substring(commas[1] + 1, closeIdx).trim();
                    const aVal = Number(this.calculate(aStr));
                    const bVal = Number(this.calculate(bStr));
                    const intRes = this.integrate(fStr, aVal, bVal);
                    expr = expr.substring(0, idx) + "(" + intRes + ")" + expr.substring(closeIdx + 1);
                } else {
                    break;
                }
            }

            // Preprocess deriv(f, x0)
            while (expr.includes("deriv(")) {
                const idx = expr.indexOf("deriv(");
                let depth = 0;
                let closeIdx = -1;
                let commaIdx = -1;
                for (let i = idx + 6; i < expr.length; i++) {
                    if (expr[i] === '(') depth++;
                    else if (expr[i] === ')') {
                        if (depth === 0) { closeIdx = i; break; }
                        depth--;
                    } else if (expr[i] === ',' && depth === 0) {
                        commaIdx = i;
                    }
                }
                if (closeIdx !== -1 && commaIdx !== -1) {
                    const fStr = expr.substring(idx + 6, commaIdx).trim();
                    const aStr = expr.substring(commaIdx + 1, closeIdx).trim();
                    const aVal = Number(this.calculate(aStr));
                    const derRes = this.derivative(fStr, aVal);
                    expr = expr.substring(0, idx) + "(" + derRes + ")" + expr.substring(closeIdx + 1);
                } else {
                    break;
                }
            }

            // Automatically close any unclosed parentheses
            const openCount = (expr.match(/\(/g) || []).length;
            const closeCount = (expr.match(/\)/g) || []).length;
            if (openCount > closeCount) {
                expr += ")".repeat(openCount - closeCount);
            }

            const tokens = this.tokenize(expr);
            const rpn = this.parseToRPN(tokens);
            const result = this.evaluateRPN(rpn);

            // Update Ans
            this.preAns = this.ans;
            if (typeof result === "number" && !isNaN(result)) {
                this.ans = result;
            } else if (result instanceof Complex) {
                this.ans = result;
            }

            // Save to history
            this.history.push({
                expression: expr,
                result: result,
                timestamp: new Date().toLocaleTimeString("vi-VN")
            });
            this.historyIndex = this.history.length;

            return result;
        } catch (err) {
            throw err;
        }
    }

    // Format output with ClassWiz styling
    formatResult(val, requestedFormat = null) {
        if (typeof val === "string") return val; // prime factorization, True/False etc
        if (val instanceof Complex) return val.toString(this.angleUnit);

        // Special Casio Result Objects (÷R, Pol, Rec)
        if (val && typeof val === "object") {
            if (val.type === "DIVR") return `${val.q}, R=${val.r}`;
            if (val.type === "POL") return `r=${val.r}, θ=${val.theta}`;
            if (val.type === "REC") return `x=${val.x}, y=${val.y}`;
        }

        const num = Number(val);
        if (isNaN(num)) return "Math ERROR";
        if (!Number.isFinite(num)) return num > 0 ? "∞" : "-∞";

        // Clean small floating point inaccuracies (e.g. 0.0000000000000001 -> 0)
        let cleanNum = num;
        if (Math.abs(num) < 1e-12) cleanNum = 0;
        else cleanNum = parseFloat(num.toPrecision(12));

        if (requestedFormat === "dms") {
            return this.formatDMS(cleanNum);
        }

        if (this.displayFormat === "FIX") {
            return cleanNum.toFixed(this.fixDigits);
        } else if (this.displayFormat === "SCI") {
            return cleanNum.toExponential(this.sciDigits);
        }

        // Explicit decimal format requested (e.g. S<=>D key pressed)
        if (requestedFormat === "decimal") {
            return cleanNum.toString();
        }

        // Check for rational multiples of π: p/q * π (ClassWiz natural Radian output)
        if (requestedFormat !== "decimal" && Math.abs(cleanNum) > 1e-12) {
            const ratio = cleanNum / Math.PI;
            for (let q = 1; q <= 24; q++) {
                const p = Math.round(ratio * q);
                if (Math.abs(ratio - p / q) < 1e-7 && p !== 0) {
                    const g = Fraction.gcd(Math.abs(p), q);
                    const redP = p / g;
                    const redQ = q / g;
                    if (redQ === 1) {
                        if (redP === 1) return "π";
                        if (redP === -1) return "-π";
                        return `${redP}π`;
                    }
                    return `${redP}/${redQ}π`;
                }
            }
        }

        // Try fraction representation if requested or in default d/c fraction mode
        const maxDen = requestedFormat ? 100000 : 1000;
        if (requestedFormat === "fraction" || (requestedFormat === null && this.fractionFormat === "d/c")) {
            try {
                const frac = Fraction.from(cleanNum);
                if (frac.den !== 1 && frac.den <= maxDen) {
                    return frac.toString("improper");
                }
            } catch (e) {}
        } else if (requestedFormat === "mixed" || (requestedFormat === null && this.fractionFormat === "ab/c")) {
            try {
                const frac = Fraction.from(cleanNum);
                if (frac.den !== 1 && frac.den <= maxDen) {
                    return frac.toString("mixed");
                }
            } catch (e) {}
        }

        // Standard decimal format
        return cleanNum.toString();
    }
}

CasioEngine.CONSTANTS = {
    1: {
        name: "Phổ quát (Universal)",
        list: [
            { id: 1, symbol: "c₀", name: "Tốc độ ánh sáng", value: 299792458, unit: "m/s" },
            { id: 2, symbol: "h", name: "Hằng số Planck", value: 6.626070040e-34, unit: "J s" },
            { id: 3, symbol: "ℏ", name: "Hằng số Planck rút gọn", value: 1.054571800e-34, unit: "J s" },
            { id: 4, symbol: "μ₀", name: "Độ từ thẩm chân không", value: 1.2566370614e-6, unit: "N A⁻²" },
            { id: 5, symbol: "ε₀", name: "Hằng số điện môi chân không", value: 8.854187817e-12, unit: "F m⁻¹" },
            { id: 6, symbol: "Z₀", name: "Trở kháng sóng chân không", value: 376.730313461, unit: "Ω" },
            { id: 7, symbol: "G", name: "Hằng số hấp dẫn Newton", value: 6.67408e-11, unit: "m³ kg⁻¹ s⁻²" },
            { id: 8, symbol: "l_p", name: "Độ dài Planck", value: 1.616229e-35, unit: "m" },
            { id: 9, symbol: "t_p", name: "Thời gian Planck", value: 5.39116e-44, unit: "s" }
        ]
    },
    2: {
        name: "Điện từ (Electromagnetic)",
        list: [
            { id: 1, symbol: "μ_N", name: "Magneton hạt nhân", value: 5.050783699e-27, unit: "J T⁻¹" },
            { id: 2, symbol: "μ_B", name: "Magneton Bohr", value: 9.274009994e-24, unit: "J T⁻¹" },
            { id: 3, symbol: "e", name: "Điện tích nguyên tố", value: 1.6021766208e-19, unit: "C" },
            { id: 4, symbol: "Φ₀", name: "Lượng tử từ thông", value: 2.067833831e-15, unit: "Wb" },
            { id: 5, symbol: "G₀", name: "Độ dẫn lượng tử", value: 7.7480917310e-5, unit: "S" },
            { id: 6, symbol: "K_J", name: "Hằng số Josephson", value: 483597.8525e9, unit: "Hz V⁻¹" },
            { id: 7, symbol: "R_K", name: "Hằng số von Klitzing", value: 25812.8074555, unit: "Ω" }
        ]
    },
    3: {
        name: "Nguyên tử & Hạt nhân (Atomic)",
        list: [
            { id: 1, symbol: "a₀", name: "Bán kính Bohr", value: 5.2917721067e-11, unit: "m" },
            { id: 2, symbol: "r_e", name: "Bán kính electron cổ điển", value: 2.8179403227e-15, unit: "m" },
            { id: 3, symbol: "α", name: "Hằng số cấu trúc tinh tế", value: 7.2973525664e-3, unit: "" },
            { id: 4, symbol: "R_∞", name: "Hằng số Rydberg", value: 10973731.568508, unit: "m⁻¹" },
            { id: 5, symbol: "m_p", name: "Khối lượng proton", value: 1.672621898e-27, unit: "kg" },
            { id: 6, symbol: "m_n", name: "Khối lượng neutron", value: 1.674927471e-27, unit: "kg" },
            { id: 7, symbol: "m_e", name: "Khối lượng electron", value: 9.10938356e-31, unit: "kg" },
            { id: 8, symbol: "m_μ", name: "Khối lượng muon", value: 1.883531594e-28, unit: "kg" }
        ]
    },
    4: {
        name: "Lý - Hóa (Phys-Chem)",
        list: [
            { id: 1, symbol: "u", name: "Đơn vị khối lượng nguyên tử", value: 1.660539040e-27, unit: "kg" },
            { id: 2, symbol: "F", name: "Hằng số Faraday", value: 96485.33289, unit: "C mol⁻¹" },
            { id: 3, symbol: "N_A", name: "Hằng số Avogadro", value: 6.022140857e23, unit: "mol⁻¹" },
            { id: 4, symbol: "k", name: "Hằng số Boltzmann", value: 1.38064852e-23, unit: "J K⁻¹" },
            { id: 5, symbol: "V_m", name: "Thể tích mol khí lý tưởng", value: 0.022413962, unit: "m³ mol⁻¹" },
            { id: 6, symbol: "R", name: "Hằng số khí lý tưởng", value: 8.3144598, unit: "J mol⁻¹ K⁻¹" },
            { id: 7, symbol: "c₁", name: "Hằng số bức xạ thứ nhất", value: 3.741771790e-16, unit: "W m²" },
            { id: 8, symbol: "c₂", name: "Hằng số bức xạ thứ hai", value: 0.0143877736, unit: "m K" },
            { id: 9, symbol: "σ", name: "Hằng số Stefan-Boltzmann", value: 5.670367e-8, unit: "W m⁻² K⁻⁴" }
        ]
    }
};

CasioEngine.CONVERSIONS = {
    1: {
        name: "Chiều dài (Length)",
        list: [
            { id: 1, label: "in ➔ cm", factor: 2.54, op: "mul" },
            { id: 2, label: "cm ➔ in", factor: 2.54, op: "div" },
            { id: 3, label: "ft ➔ m", factor: 0.3048, op: "mul" },
            { id: 4, label: "m ➔ ft", factor: 0.3048, op: "div" },
            { id: 5, label: "yd ➔ m", factor: 0.9144, op: "mul" },
            { id: 6, label: "m ➔ yd", factor: 0.9144, op: "div" },
            { id: 7, label: "mile ➔ km", factor: 1.609344, op: "mul" },
            { id: 8, label: "km ➔ mile", factor: 1.609344, op: "div" }
        ]
    },
    2: {
        name: "Diện tích (Area)",
        list: [
            { id: 1, label: "acre ➔ m²", factor: 4046.8564224, op: "mul" },
            { id: 2, label: "m² ➔ acre", factor: 4046.8564224, op: "div" },
            { id: 3, label: "ha ➔ m²", factor: 10000, op: "mul" },
            { id: 4, label: "m² ➔ ha", factor: 10000, op: "div" }
        ]
    },
    3: {
        name: "Thể tích (Volume)",
        list: [
            { id: 1, label: "gal(US) ➔ L", factor: 3.785411784, op: "mul" },
            { id: 2, label: "L ➔ gal(US)", factor: 3.785411784, op: "div" },
            { id: 3, label: "gal(UK) ➔ L", factor: 4.54609, op: "mul" },
            { id: 4, label: "L ➔ gal(UK)", factor: 4.54609, op: "div" }
        ]
    },
    4: {
        name: "Khối lượng (Mass)",
        list: [
            { id: 1, label: "oz ➔ g", factor: 28.349523125, op: "mul" },
            { id: 2, label: "g ➔ oz", factor: 28.349523125, op: "div" },
            { id: 3, label: "lb ➔ kg", factor: 0.45359237, op: "mul" },
            { id: 4, label: "kg ➔ lb", factor: 0.45359237, op: "div" }
        ]
    },
    5: {
        name: "Vận tốc (Velocity)",
        list: [
            { id: 1, label: "km/h ➔ m/s", factor: 3.6, op: "div" },
            { id: 2, label: "m/s ➔ km/h", factor: 3.6, op: "mul" }
        ]
    },
    6: {
        name: "Áp suất (Pressure)",
        list: [
            { id: 1, label: "atm ➔ Pa", factor: 101325, op: "mul" },
            { id: 2, label: "Pa ➔ atm", factor: 101325, op: "div" },
            { id: 3, label: "mmHg ➔ Pa", factor: 133.322387415, op: "mul" },
            { id: 4, label: "Pa ➔ mmHg", factor: 133.322387415, op: "div" }
        ]
    },
    7: {
        name: "Năng lượng (Energy)",
        list: [
            { id: 1, label: "kgf·m ➔ J", factor: 9.80665, op: "mul" },
            { id: 2, label: "J ➔ kgf·m", factor: 9.80665, op: "div" },
            { id: 3, label: "J ➔ cal", factor: 4.184, op: "div" },
            { id: 4, label: "cal ➔ J", factor: 4.184, op: "mul" },
            { id: 5, label: "hp ➔ kW", factor: 0.74569987158227, op: "mul" },
            { id: 6, label: "kW ➔ hp", factor: 0.74569987158227, op: "div" }
        ]
    },
    8: {
        name: "Nhiệt độ (Temperature)",
        list: [
            { id: 1, label: "°F ➔ °C", fn: x => (x - 32) * 5 / 9 },
            { id: 2, label: "°C ➔ °F", fn: x => x * 9 / 5 + 32 }
        ]
    }
};

// Export for browser and Node.js
if (typeof window !== "undefined") {
    window.Fraction = Fraction;
    window.Complex = Complex;
    window.CasioVector = CasioVector;
    window.CasioEngine = CasioEngine;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { Fraction, Complex, CasioVector, CasioEngine };
}
