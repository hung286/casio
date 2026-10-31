/**
 * Casio ClassWiz Natural Display Math Tree (V.P.A.M. 2.0)
 * Implements 2D mathematical expression tree with interactive 2-story fractions,
 * nested radicals, n-th roots, logarithms with base, absolute value, and exponents.
 */

let globalMathNodeId = 1;

class MathNode {
    constructor(type, value = null) {
        this.id = "mn_" + (globalMathNodeId++);
        this.type = type; // "char", "frac", "sqrt", "power", "func", "mixed", "nthRoot", "cbrt", "logab", "abs"
        this.value = value;
        this.children = [];   // For sqrt, func, cbrt, abs
        this.num = [];        // For fractions: numerator
        this.den = [];        // For fractions: denominator
        this.whole = [];      // For mixed fractions
        this.exp = [];        // For powers
        this.rootIndex = [];  // For nthRoot: index (n)
        this.radicand = [];   // For nthRoot: radicand (x)
        this.base = [];       // For logab: base
        this.arg = [];        // For logab: argument
        this.expr = [];       // For integral / derivative: expression f(x)
        this.lower = [];      // For integral: lower limit a
        this.upper = [];      // For integral: upper limit b
        this.point = [];      // For derivative: evaluation point x = a
    }
}

class MathTree {
    constructor() {
        this.root = [];
        this.cursor = { list: this.root, index: 0, parent: null, slot: null };
    }

    clear() {
        this.root = [];
        this.cursor = { list: this.root, index: 0, parent: null, slot: null };
    }

    isEmpty() {
        return this.root.length === 0;
    }

    // Insert character (digit, operator, variable, decimal)
    insertChar(ch) {
        const node = new MathNode("char", ch);
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor.index++;
    }

    // Insert 2-story fraction: [ ] / [ ]
    insertFraction() {
        const frac = new MathNode("frac");
        frac.num = [];
        frac.den = [];

        // If cursor has a preceding number/variable, adopt it into the numerator
        if (this.cursor.index > 0) {
            const prev = this.cursor.list[this.cursor.index - 1];
            if (prev.type === "char" && ((prev.value >= '0' && prev.value <= '9') || prev.value === 'x' || prev.value === 'Ans' || prev.value === 'π')) {
                this.cursor.list.splice(this.cursor.index - 1, 1);
                this.cursor.index--;
                frac.num.push(prev);
                this.cursor.list.splice(this.cursor.index, 0, frac);
                this.cursor = { list: frac.den, index: 0, parent: frac, slot: "den" };
                return;
            }
        }

        this.cursor.list.splice(this.cursor.index, 0, frac);
        this.cursor = { list: frac.num, index: 0, parent: frac, slot: "num" };
    }

    // Insert mixed fraction: [ ] [ ] / [ ]
    insertMixedFraction() {
        const mixed = new MathNode("mixed");
        mixed.whole = [];
        mixed.num = [];
        mixed.den = [];
        this.cursor.list.splice(this.cursor.index, 0, mixed);
        this.cursor = { list: mixed.whole, index: 0, parent: mixed, slot: "whole" };
    }

    // Insert Square Root: √[ ]
    insertSqrt() {
        const sqrtNode = new MathNode("sqrt");
        sqrtNode.children = [];
        this.cursor.list.splice(this.cursor.index, 0, sqrtNode);
        this.cursor = { list: sqrtNode.children, index: 0, parent: sqrtNode, slot: "content" };
    }

    // Insert Cube Root: ³√[ ]
    insertCubeRoot() {
        const cbrtNode = new MathNode("cbrt");
        cbrtNode.children = [];
        this.cursor.list.splice(this.cursor.index, 0, cbrtNode);
        this.cursor = { list: cbrtNode.children, index: 0, parent: cbrtNode, slot: "content" };
    }

    // Insert n-th root: [ ]√[ ]
    insertNthRoot() {
        const node = new MathNode("nthRoot");
        node.rootIndex = [];
        node.radicand = [];
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor = { list: node.rootIndex, index: 0, parent: node, slot: "rootIndex" };
    }

    // Insert Logarithm with base: log_[ ]([ ])
    insertLogBase() {
        const node = new MathNode("logab");
        node.base = [];
        node.arg = [];
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor = { list: node.base, index: 0, parent: node, slot: "base" };
    }

    // Insert Absolute value: |[ ]|
    insertAbs() {
        const node = new MathNode("abs");
        node.children = [];
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor = { list: node.children, index: 0, parent: node, slot: "content" };
    }

    // Insert 2D Integral: ∫ [ ] dx from [ ] to [ ]
    insertIntegral() {
        const node = new MathNode("integral");
        node.expr = [];
        node.lower = [];
        node.upper = [];
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor = { list: node.expr, index: 0, parent: node, slot: "expr" };
    }

    // Insert 2D Derivative: d/dx([ ]) | x = [ ]
    insertDerivative() {
        const node = new MathNode("derivative");
        node.expr = [];
        node.point = [];
        this.cursor.list.splice(this.cursor.index, 0, node);
        this.cursor = { list: node.expr, index: 0, parent: node, slot: "expr" };
    }

    // Insert Power: [ ]^[ ] or x² or x³
    insertPower(expChar = null) {
        const powNode = new MathNode("power");
        powNode.exp = [];
        if (expChar) {
            for (const ch of expChar) {
                powNode.exp.push(new MathNode("char", ch));
            }
            this.cursor.list.splice(this.cursor.index, 0, powNode);
            this.cursor.index++;
        } else {
            this.cursor.list.splice(this.cursor.index, 0, powNode);
            this.cursor = { list: powNode.exp, index: 0, parent: powNode, slot: "exp" };
        }
    }

    // Insert Function: sin([ ]), cos([ ]), etc.
    insertFunc(fnName) {
        const fnNode = new MathNode("func", fnName);
        fnNode.children = [];
        this.cursor.list.splice(this.cursor.index, 0, fnNode);
        this.cursor = { list: fnNode.children, index: 0, parent: fnNode, slot: "content" };
    }

    // Insert Atomic Vector Token: VctA, VctB, VctC, VctD, VctAns, or •
    insertVectorToken(token) {
        const vctNode = new MathNode("vct", token);
        this.cursor.list.splice(this.cursor.index, 0, vctNode);
        this.cursor.index++;
    }

    // Delete character backward (DEL key)
    deleteBackward() {
        if (this.cursor.index > 0) {
            this.cursor.list.splice(this.cursor.index - 1, 1);
            this.cursor.index--;
        } else if (this.cursor.parent) {
            if (this.cursor.slot === "den") {
                this.cursor = {
                    list: this.cursor.parent.num,
                    index: this.cursor.parent.num.length,
                    parent: this.cursor.parent,
                    slot: "num"
                };
            } else if (this.cursor.slot === "num") {
                if (this.cursor.parent.type === "mixed") {
                    this.cursor = {
                        list: this.cursor.parent.whole,
                        index: this.cursor.parent.whole.length,
                        parent: this.cursor.parent,
                        slot: "whole"
                    };
                } else {
                    this.removeCurrentContainer();
                }
            } else if (this.cursor.slot === "radicand") {
                this.cursor = {
                    list: this.cursor.parent.rootIndex,
                    index: this.cursor.parent.rootIndex.length,
                    parent: this.cursor.parent,
                    slot: "rootIndex"
                };
            } else if (this.cursor.slot === "arg") {
                this.cursor = {
                    list: this.cursor.parent.base,
                    index: this.cursor.parent.base.length,
                    parent: this.cursor.parent,
                    slot: "base"
                };
            } else if (this.cursor.slot === "upper") {
                this.cursor = {
                    list: this.cursor.parent.lower,
                    index: this.cursor.parent.lower.length,
                    parent: this.cursor.parent,
                    slot: "lower"
                };
            } else if (this.cursor.slot === "lower") {
                this.cursor = {
                    list: this.cursor.parent.expr,
                    index: this.cursor.parent.expr.length,
                    parent: this.cursor.parent,
                    slot: "expr"
                };
            } else if (this.cursor.slot === "point") {
                this.cursor = {
                    list: this.cursor.parent.expr,
                    index: this.cursor.parent.expr.length,
                    parent: this.cursor.parent,
                    slot: "expr"
                };
            } else {
                this.removeCurrentContainer();
            }
        }
    }

    removeCurrentContainer() {
        const target = this.cursor.parent;
        const findAndRemove = (list, parentNode, slotName) => {
            for (let i = 0; i < list.length; i++) {
                if (list[i] === target) {
                    list.splice(i, 1);
                    this.cursor = { list: list, index: i, parent: parentNode, slot: slotName };
                    return true;
                }
                const item = list[i];
                if (item.type === "frac" || item.type === "mixed") {
                    if (item.whole && findAndRemove(item.whole, item, "whole")) return true;
                    if (findAndRemove(item.num, item, "num")) return true;
                    if (findAndRemove(item.den, item, "den")) return true;
                } else if (item.type === "sqrt" || item.type === "func" || item.type === "cbrt" || item.type === "abs") {
                    if (findAndRemove(item.children, item, "content")) return true;
                } else if (item.type === "power") {
                    if (findAndRemove(item.exp, item, "exp")) return true;
                } else if (item.type === "nthRoot") {
                    if (findAndRemove(item.rootIndex, item, "rootIndex")) return true;
                    if (findAndRemove(item.radicand, item, "radicand")) return true;
                } else if (item.type === "logab") {
                    if (findAndRemove(item.base, item, "base")) return true;
                    if (findAndRemove(item.arg, item, "arg")) return true;
                } else if (item.type === "integral") {
                    if (findAndRemove(item.expr, item, "expr")) return true;
                    if (findAndRemove(item.lower, item, "lower")) return true;
                    if (findAndRemove(item.upper, item, "upper")) return true;
                } else if (item.type === "derivative") {
                    if (findAndRemove(item.expr, item, "expr")) return true;
                    if (findAndRemove(item.point, item, "point")) return true;
                }
            }
            return false;
        };

        findAndRemove(this.root, null, null);
    }

    findEnclosingNode(predicate) {
        if (this.cursor.parent && predicate(this.cursor.parent)) {
            return { node: this.cursor.parent, slot: this.cursor.slot };
        }
        const targetList = this.cursor.list;
        const findPath = (list, parentNode, slotName) => {
            if (list === targetList) {
                return parentNode ? [{ node: parentNode, slot: slotName }] : [];
            }
            for (const item of list) {
                let res = null;
                if (item.type === "derivative") {
                    res = findPath(item.expr, item, "expr") || findPath(item.point, item, "point");
                } else if (item.type === "integral") {
                    res = findPath(item.expr, item, "expr") || findPath(item.lower, item, "lower") || findPath(item.upper, item, "upper");
                } else if (item.type === "frac" || item.type === "mixed") {
                    if (item.whole) res = findPath(item.whole, item, "whole");
                    if (!res) res = findPath(item.num, item, "num") || findPath(item.den, item, "den");
                } else if (item.type === "power") {
                    res = findPath(item.exp, item, "exp");
                } else if (item.type === "nthRoot") {
                    res = findPath(item.rootIndex, item, "rootIndex") || findPath(item.radicand, item, "radicand");
                } else if (item.type === "logab") {
                    res = findPath(item.base, item, "base") || findPath(item.arg, item, "arg");
                } else if (item.type === "sqrt" || item.type === "cbrt" || item.type === "func" || item.type === "abs") {
                    res = findPath(item.children, item, "content");
                }
                if (res) {
                    if (parentNode) res.unshift({ node: parentNode, slot: slotName });
                    return res;
                }
            }
            return null;
        };
        const path = findPath(this.root, null, null);
        if (!path) return null;
        for (let i = path.length - 1; i >= 0; i--) {
            if (predicate(path[i].node)) {
                return path[i];
            }
        }
        return null;
    }

    isDescendantOf(rootItem) {
        if (!rootItem) return false;
        const target = this.cursor.parent;
        if (!target) return false;
        const check = (node) => {
            if (node === target) return true;
            if (node.whole && node.whole.some(check)) return true;
            if (node.num && node.num.some(check)) return true;
            if (node.den && node.den.some(check)) return true;
            if (node.exp && node.exp.some(check)) return true;
            if (node.children && node.children.some(check)) return true;
            if (node.rootIndex && node.rootIndex.some(check)) return true;
            if (node.radicand && node.radicand.some(check)) return true;
            if (node.base && node.base.some(check)) return true;
            if (node.arg && node.arg.some(check)) return true;
            if (node.expr && node.expr.some(check)) return true;
            if (node.lower && node.lower.some(check)) return true;
            if (node.upper && node.upper.some(check)) return true;
            if (node.point && node.point.some(check)) return true;
            return false;
        };
        return check(rootItem);
    }

    findNodeById(id, list = this.root) {
        for (const item of list) {
            if (item.id === id) return item;
            let found = null;
            if (item.type === "frac" || item.type === "mixed") {
                if (item.whole) found = this.findNodeById(id, item.whole);
                if (!found) found = this.findNodeById(id, item.num) || this.findNodeById(id, item.den);
            } else if (item.type === "sqrt" || item.type === "cbrt" || item.type === "func" || item.type === "abs") {
                found = this.findNodeById(id, item.children);
            } else if (item.type === "power") {
                found = this.findNodeById(id, item.exp);
            } else if (item.type === "nthRoot") {
                found = this.findNodeById(id, item.rootIndex) || this.findNodeById(id, item.radicand);
            } else if (item.type === "logab") {
                found = this.findNodeById(id, item.base) || this.findNodeById(id, item.arg);
            } else if (item.type === "integral") {
                found = this.findNodeById(id, item.expr) || this.findNodeById(id, item.lower) || this.findNodeById(id, item.upper);
            } else if (item.type === "derivative") {
                found = this.findNodeById(id, item.expr) || this.findNodeById(id, item.point);
            }
            if (found) return found;
        }
        return null;
    }

    setCursorByTarget(nodeId, slotName, targetIndex = 0) {
        if (!nodeId || nodeId === "root") {
            const idx = Math.max(0, Math.min(targetIndex, this.root.length));
            this.cursor = { list: this.root, index: idx, parent: null, slot: null };
            return true;
        }
        const node = this.findNodeById(nodeId);
        if (!node) return false;

        let targetList = null;
        let effectiveSlot = slotName;
        if (slotName === "content" || slotName === "children") {
            targetList = node.children;
            effectiveSlot = "content";
        } else if (slotName === "num") {
            targetList = node.num;
        } else if (slotName === "den") {
            targetList = node.den;
        } else if (slotName === "whole") {
            targetList = node.whole;
        } else if (slotName === "exp") {
            targetList = node.exp;
        } else if (slotName === "rootIndex") {
            targetList = node.rootIndex;
        } else if (slotName === "radicand") {
            targetList = node.radicand;
        } else if (slotName === "base") {
            targetList = node.base;
        } else if (slotName === "arg") {
            targetList = node.arg;
        } else if (slotName === "expr") {
            targetList = node.expr;
        } else if (slotName === "point") {
            targetList = node.point;
        } else if (slotName === "lower") {
            targetList = node.lower;
        } else if (slotName === "upper") {
            targetList = node.upper;
        }

        if (targetList) {
            const idx = Math.max(0, Math.min(targetIndex, targetList.length));
            this.cursor = { list: targetList, index: idx, parent: node, slot: effectiveSlot };
            return true;
        }
        return false;
    }

    // Navigation: Left
    moveLeft() {
        if (this.cursor.index > 0) {
            const prev = this.cursor.list[this.cursor.index - 1];
            if (prev.type === "frac" || prev.type === "mixed") {
                this.cursor = { list: prev.den, index: prev.den.length, parent: prev, slot: "den" };
            } else if (prev.type === "sqrt" || prev.type === "func" || prev.type === "cbrt" || prev.type === "abs") {
                this.cursor = { list: prev.children, index: prev.children.length, parent: prev, slot: "content" };
            } else if (prev.type === "power") {
                this.cursor = { list: prev.exp, index: prev.exp.length, parent: prev, slot: "exp" };
            } else if (prev.type === "nthRoot") {
                this.cursor = { list: prev.radicand, index: prev.radicand.length, parent: prev, slot: "radicand" };
            } else if (prev.type === "logab") {
                this.cursor = { list: prev.arg, index: prev.arg.length, parent: prev, slot: "arg" };
            } else if (prev.type === "integral") {
                this.cursor = { list: prev.upper, index: prev.upper.length, parent: prev, slot: "upper" };
            } else if (prev.type === "derivative") {
                this.cursor = { list: prev.point, index: prev.point.length, parent: prev, slot: "point" };
            } else {
                this.cursor.index--;
            }
        } else if (this.cursor.parent) {
            if (this.cursor.slot === "den") {
                this.navigateOutOfParent("left");
            } else if (this.cursor.slot === "num" && this.cursor.parent.type === "mixed") {
                this.cursor = { list: this.cursor.parent.whole, index: this.cursor.parent.whole.length, parent: this.cursor.parent, slot: "whole" };
            } else if (this.cursor.slot === "radicand") {
                this.cursor = { list: this.cursor.parent.rootIndex, index: this.cursor.parent.rootIndex.length, parent: this.cursor.parent, slot: "rootIndex" };
            } else if (this.cursor.slot === "arg") {
                this.cursor = { list: this.cursor.parent.base, index: this.cursor.parent.base.length, parent: this.cursor.parent, slot: "base" };
            } else if (this.cursor.slot === "upper") {
                this.cursor = { list: this.cursor.parent.lower, index: this.cursor.parent.lower.length, parent: this.cursor.parent, slot: "lower" };
            } else if (this.cursor.slot === "lower") {
                this.cursor = { list: this.cursor.parent.expr, index: this.cursor.parent.expr.length, parent: this.cursor.parent, slot: "expr" };
            } else if (this.cursor.slot === "point") {
                this.cursor = { list: this.cursor.parent.expr, index: this.cursor.parent.expr.length, parent: this.cursor.parent, slot: "expr" };
            } else {
                this.navigateOutOfParent("left");
            }
        }
    }

    // Navigation: Right
    moveRight() {
        if (this.cursor.index < this.cursor.list.length) {
            const next = this.cursor.list[this.cursor.index];
            if (next.type === "mixed") {
                this.cursor = { list: next.whole, index: 0, parent: next, slot: "whole" };
            } else if (next.type === "frac") {
                this.cursor = { list: next.num, index: 0, parent: next, slot: "num" };
            } else if (next.type === "sqrt" || next.type === "func" || next.type === "cbrt" || next.type === "abs") {
                this.cursor = { list: next.children, index: 0, parent: next, slot: "content" };
            } else if (next.type === "power") {
                this.cursor = { list: next.exp, index: 0, parent: next, slot: "exp" };
            } else if (next.type === "nthRoot") {
                this.cursor = { list: next.rootIndex, index: 0, parent: next, slot: "rootIndex" };
            } else if (next.type === "logab") {
                this.cursor = { list: next.base, index: 0, parent: next, slot: "base" };
            } else if (next.type === "integral") {
                this.cursor = { list: next.expr, index: 0, parent: next, slot: "expr" };
            } else if (next.type === "derivative") {
                this.cursor = { list: next.expr, index: 0, parent: next, slot: "expr" };
            } else {
                this.cursor.index++;
            }
        } else if (this.cursor.parent) {
            if (this.cursor.slot === "whole") {
                this.cursor = { list: this.cursor.parent.num, index: 0, parent: this.cursor.parent, slot: "num" };
            } else if (this.cursor.slot === "num") {
                this.navigateOutOfParent("right");
            } else if (this.cursor.slot === "rootIndex") {
                this.cursor = { list: this.cursor.parent.radicand, index: 0, parent: this.cursor.parent, slot: "radicand" };
            } else if (this.cursor.slot === "base") {
                this.cursor = { list: this.cursor.parent.arg, index: 0, parent: this.cursor.parent, slot: "arg" };
            } else if (this.cursor.slot === "expr" && this.cursor.parent.type === "integral") {
                this.cursor = { list: this.cursor.parent.lower, index: 0, parent: this.cursor.parent, slot: "lower" };
            } else if (this.cursor.slot === "lower" && this.cursor.parent.type === "integral") {
                this.cursor = { list: this.cursor.parent.upper, index: 0, parent: this.cursor.parent, slot: "upper" };
            } else if (this.cursor.slot === "expr" && this.cursor.parent.type === "derivative") {
                this.cursor = { list: this.cursor.parent.point, index: 0, parent: this.cursor.parent, slot: "point" };
            } else {
                this.navigateOutOfParent("right");
            }
        }
    }

    // Navigation: Down
    moveDown() {
        if (this.cursor.parent) {
            if (this.cursor.slot === "num") {
                this.cursor = { list: this.cursor.parent.den, index: 0, parent: this.cursor.parent, slot: "den" };
                return true;
            }
            if (this.cursor.slot === "whole") {
                this.cursor = { list: this.cursor.parent.den, index: 0, parent: this.cursor.parent, slot: "den" };
                return true;
            }
            if (this.cursor.slot === "rootIndex") {
                this.cursor = { list: this.cursor.parent.radicand, index: 0, parent: this.cursor.parent, slot: "radicand" };
                return true;
            }
            if (this.cursor.slot === "arg") {
                this.cursor = { list: this.cursor.parent.base, index: 0, parent: this.cursor.parent, slot: "base" };
                return true;
            }
            if (this.cursor.slot === "upper") {
                this.cursor = { list: this.cursor.parent.lower, index: 0, parent: this.cursor.parent, slot: "lower" };
                return true;
            }
            if (this.cursor.slot === "expr" && this.cursor.parent.type === "integral") {
                this.cursor = { list: this.cursor.parent.lower, index: 0, parent: this.cursor.parent, slot: "lower" };
                return true;
            }
            if (this.cursor.slot === "expr" && this.cursor.parent.type === "derivative") {
                this.cursor = { list: this.cursor.parent.point, index: 0, parent: this.cursor.parent, slot: "point" };
                return true;
            }
        }
        // Jump to derivative.point from anywhere inside derivative.expr
        const encDeriv = this.findEnclosingNode(n => n.type === "derivative");
        if (encDeriv && encDeriv.slot === "expr") {
            this.cursor = { list: encDeriv.node.point, index: 0, parent: encDeriv.node, slot: "point" };
            return true;
        }
        const encInt = this.findEnclosingNode(n => n.type === "integral");
        if (encInt && encInt.slot === "expr") {
            this.cursor = { list: encInt.node.lower, index: 0, parent: encInt.node, slot: "lower" };
            return true;
        }
        return false;
    }

    // Navigation: Up
    moveUp() {
        if (this.cursor.parent) {
            if (this.cursor.slot === "den") {
                this.cursor = { list: this.cursor.parent.num, index: 0, parent: this.cursor.parent, slot: "num" };
                return true;
            }
            if (this.cursor.slot === "whole") {
                this.cursor = { list: this.cursor.parent.num, index: 0, parent: this.cursor.parent, slot: "num" };
                return true;
            }
            if (this.cursor.slot === "radicand") {
                this.cursor = { list: this.cursor.parent.rootIndex, index: 0, parent: this.cursor.parent, slot: "rootIndex" };
                return true;
            }
            if (this.cursor.slot === "base") {
                this.cursor = { list: this.cursor.parent.arg, index: 0, parent: this.cursor.parent, slot: "arg" };
                return true;
            }
            if (this.cursor.slot === "lower") {
                this.cursor = { list: this.cursor.parent.upper, index: 0, parent: this.cursor.parent, slot: "upper" };
                return true;
            }
            if (this.cursor.slot === "expr" && this.cursor.parent.type === "integral") {
                this.cursor = { list: this.cursor.parent.upper, index: 0, parent: this.cursor.parent, slot: "upper" };
                return true;
            }
            if (this.cursor.slot === "point") {
                this.cursor = { list: this.cursor.parent.expr, index: this.cursor.parent.expr.length, parent: this.cursor.parent, slot: "expr" };
                return true;
            }
        }
        // Jump back from derivative.point to the end of derivative.expr
        const encDeriv = this.findEnclosingNode(n => n.type === "derivative");
        if (encDeriv && encDeriv.slot === "point") {
            this.cursor = { list: encDeriv.node.expr, index: encDeriv.node.expr.length, parent: encDeriv.node, slot: "expr" };
            return true;
        }
        return false;
    }

    navigateOutOfParent(direction) {
        const findParentContext = (target, currentList, parentNode, slotName) => {
            for (let i = 0; i < currentList.length; i++) {
                const item = currentList[i];
                if (item === target) {
                    return { list: currentList, index: direction === "left" ? i : i + 1, parent: parentNode, slot: slotName };
                }
                if (item.type === "frac" || item.type === "mixed") {
                    if (item.whole) {
                        const inWhole = findParentContext(target, item.whole, item, "whole");
                        if (inWhole) return inWhole;
                    }
                    const inNum = findParentContext(target, item.num, item, "num");
                    if (inNum) return inNum;
                    const inDen = findParentContext(target, item.den, item, "den");
                    if (inDen) return inDen;
                } else if (item.type === "sqrt" || item.type === "func" || item.type === "cbrt" || item.type === "abs") {
                    const inContent = findParentContext(target, item.children, item, "content");
                    if (inContent) return inContent;
                } else if (item.type === "power") {
                    const inExp = findParentContext(target, item.exp, item, "exp");
                    if (inExp) return inExp;
                } else if (item.type === "nthRoot") {
                    const inIdx = findParentContext(target, item.rootIndex, item, "rootIndex");
                    if (inIdx) return inIdx;
                    const inRad = findParentContext(target, item.radicand, item, "radicand");
                    if (inRad) return inRad;
                } else if (item.type === "logab") {
                    const inBase = findParentContext(target, item.base, item, "base");
                    if (inBase) return inBase;
                    const inArg = findParentContext(target, item.arg, item, "arg");
                    if (inArg) return inArg;
                } else if (item.type === "integral") {
                    const inExpr = findParentContext(target, item.expr, item, "expr");
                    if (inExpr) return inExpr;
                    const inLower = findParentContext(target, item.lower, item, "lower");
                    if (inLower) return inLower;
                    const inUpper = findParentContext(target, item.upper, item, "upper");
                    if (inUpper) return inUpper;
                } else if (item.type === "derivative") {
                    const inExpr = findParentContext(target, item.expr, item, "expr");
                    if (inExpr) return inExpr;
                    const inPt = findParentContext(target, item.point, item, "point");
                    if (inPt) return inPt;
                }
            }
            return null;
        };

        const ctx = findParentContext(this.cursor.parent, this.root, null, null);
        if (ctx) {
            this.cursor = ctx;
        } else {
            this.cursor = { list: this.root, index: direction === "left" ? 0 : this.root.length, parent: null, slot: null };
        }
    }

    // Render tree to HTML with Casio ClassWiz Natural Display styling
    renderHTML(showCursor = true) {
        const getSlotHtml = (list, parentNode, slotName, isMini = false) => {
            const isActive = showCursor && (this.cursor.list === list);
            const pId = parentNode ? parentNode.id : "root";
            if (list.length === 0) {
                const miniClass = isMini ? "cw-mini-box" : "";
                const cursorHtml = isActive ? `<span class="cw-cursor"></span>` : "";
                return `<span class="cw-placeholder ${miniClass}" data-node-id="${pId}" data-slot="${slotName}" data-idx="0">${cursorHtml}□</span>`;
            }
            return renderList(list, parentNode, slotName);
        };

        const renderList = (list, parentNode = null, slotName = null) => {
            let html = "";
            const pId = parentNode ? parentNode.id : "root";
            const sName = slotName || "root";
            for (let i = 0; i < list.length; i++) {
                if (showCursor && this.cursor.list === list && this.cursor.index === i) {
                    html += `<span class="cw-cursor"></span>`;
                }

                const node = list[i];
                if (node.type === "char") {
                    let c = node.value;
                    if (c === "*") c = "×";
                    if (c === "/") c = "÷";
                    if (c === "-") c = "−";
                    html += `<span class="cw-char" data-node-id="${pId}" data-slot="${sName}" data-idx="${i}">${c}</span>`;
                } else if (node.type === "vct") {
                    let c = node.value;
                    html += `<span class="cw-vct-token" data-node-id="${pId}" data-slot="${sName}" data-idx="${i}">${c}</span>`;
                } else if (node.type === "frac") {
                    const isNumActive = showCursor && (this.cursor.list === node.num);
                    const isDenActive = showCursor && (this.cursor.list === node.den);
                    const numContent = getSlotHtml(node.num, node, "num", false);
                    const denContent = getSlotHtml(node.den, node, "den", false);

                    html += `
                        <span class="cw-fraction" data-node-id="${node.id}">
                            <span class="cw-num ${isNumActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="num">${numContent}</span>
                            <span class="cw-bar"></span>
                            <span class="cw-den ${isDenActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="den">${denContent}</span>
                        </span>
                    `;
                } else if (node.type === "mixed") {
                    const wholeContent = getSlotHtml(node.whole, node, "whole", false);
                    const numContent = getSlotHtml(node.num, node, "num", false);
                    const denContent = getSlotHtml(node.den, node, "den", false);

                    html += `
                        <span class="cw-mixed" data-node-id="${node.id}">
                            <span class="cw-whole" data-node-id="${node.id}" data-slot="whole">${wholeContent}</span>
                            <span class="cw-fraction">
                                <span class="cw-num" data-node-id="${node.id}" data-slot="num">${numContent}</span>
                                <span class="cw-bar"></span>
                                <span class="cw-den" data-node-id="${node.id}" data-slot="den">${denContent}</span>
                            </span>
                        </span>
                    `;
                } else if (node.type === "sqrt") {
                    const isContentActive = showCursor && (this.cursor.list === node.children);
                    const contentHtml = getSlotHtml(node.children, node, "children", false);
                    html += `
                        <span class="cw-radical" data-node-id="${node.id}">
                            <span class="cw-radical-head">
                                <svg class="cw-radical-check" viewBox="0 0 6 20" preserveAspectRatio="none">
                                    <polyline points="0.5,10 2.5,17 5,0.6 6,0.6" />
                                </svg>
                            </span>
                            <span class="cw-radical-body ${isContentActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="children">${contentHtml}</span>
                        </span>
                    `;
                } else if (node.type === "cbrt") {
                    const isContentActive = showCursor && (this.cursor.list === node.children);
                    const contentHtml = getSlotHtml(node.children, node, "children", false);
                    html += `
                        <span class="cw-radical cw-cbrt" data-node-id="${node.id}">
                            <span class="cw-radical-head">
                                <span class="cw-root-idx cw-root-idx-cbrt">3</span>
                                <svg class="cw-radical-check" viewBox="0 0 6 20" preserveAspectRatio="none">
                                    <polyline points="0.5,10 2.5,17 5,0.6 6,0.6" />
                                </svg>
                            </span>
                            <span class="cw-radical-body ${isContentActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="children">${contentHtml}</span>
                        </span>
                    `;
                } else if (node.type === "nthRoot") {
                    const isIdxActive = showCursor && (this.cursor.list === node.rootIndex);
                    const isRadActive = showCursor && (this.cursor.list === node.radicand);
                    const idxHtml = getSlotHtml(node.rootIndex, node, "rootIndex", true);
                    const radHtml = getSlotHtml(node.radicand, node, "radicand", false);
                    html += `
                        <span class="cw-radical cw-nth-root" data-node-id="${node.id}">
                            <span class="cw-radical-head">
                                <span class="cw-root-idx cw-root-idx-nth ${isIdxActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="rootIndex">${idxHtml}</span>
                                <svg class="cw-radical-check" viewBox="0 0 6 20" preserveAspectRatio="none">
                                    <polyline points="0.5,10 2.5,17 5,0.6 6,0.6" />
                                </svg>
                            </span>
                            <span class="cw-radical-body ${isRadActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="radicand">${radHtml}</span>
                        </span>
                    `;
                } else if (node.type === "integral") {
                    const isExprActive = showCursor && (this.cursor.list === node.expr);
                    const isLowerActive = showCursor && (this.cursor.list === node.lower);
                    const isUpperActive = showCursor && (this.cursor.list === node.upper);
                    const exprHtml = getSlotHtml(node.expr, node, "expr", false);
                    const lowerHtml = getSlotHtml(node.lower, node, "lower", true);
                    const upperHtml = getSlotHtml(node.upper, node, "upper", true);
                    html += `
                        <span class="cw-integral" data-node-id="${node.id}">
                            <span class="cw-int-sym">∫</span>
                            <span class="cw-int-limits">
                                <span class="cw-int-limit cw-int-upper ${isUpperActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="upper">${upperHtml}</span>
                                <span class="cw-int-limit cw-int-lower ${isLowerActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="lower">${lowerHtml}</span>
                            </span>
                            <span class="cw-int-expr ${isExprActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="expr">${exprHtml}</span>
                            <span class="cw-int-dx">d<span class="cw-int-var">x</span></span>
                        </span>
                    `;
                } else if (node.type === "derivative") {
                    const isExprActive = showCursor && (this.cursor.list === node.expr);
                    const isPtActive = showCursor && (this.cursor.list === node.point);
                    const exprHtml = getSlotHtml(node.expr, node, "expr", false);
                    const ptHtml = getSlotHtml(node.point, node, "point", true);
                    html += `
                        <span class="cw-derivative" data-node-id="${node.id}">
                            <span class="cw-deriv-frac">
                                <span class="cw-deriv-num">d</span>
                                <span class="cw-deriv-den">dx</span>
                            </span>
                            <span class="cw-func">(</span>
                            <span class="cw-deriv-expr ${isExprActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="expr">${exprHtml}</span>
                            <span class="cw-func">)</span>
                            <span class="cw-deriv-eval">
                                <span class="cw-deriv-bar">|</span>
                                <span class="cw-deriv-sub">
                                    <span class="cw-deriv-var">x=</span>
                                    <span class="cw-deriv-pt ${isPtActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="point">${ptHtml}</span>
                                </span>
                            </span>
                        </span>
                    `;
                } else if (node.type === "logab") {
                    const isBaseActive = showCursor && (this.cursor.list === node.base);
                    const isArgActive = showCursor && (this.cursor.list === node.arg);
                    const baseHtml = getSlotHtml(node.base, node, "base", true);
                    const argHtml = getSlotHtml(node.arg, node, "arg", false);
                    html += `
                        <span class="cw-logab" data-node-id="${node.id}">
                            <span class="cw-func">log</span>
                            <sub class="cw-log-base ${isBaseActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="base">${baseHtml}</sub>
                            <span class="cw-func">(</span>
                            <span class="cw-log-arg ${isArgActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="arg">${argHtml}</span>
                            <span class="cw-func">)</span>
                        </span>
                    `;
                } else if (node.type === "abs") {
                    const isContentActive = showCursor && (this.cursor.list === node.children);
                    const contentHtml = getSlotHtml(node.children, node, "children", false);
                    html += `
                        <span class="cw-abs" data-node-id="${node.id}">
                            <span class="cw-abs-content ${isContentActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="children">${contentHtml}</span>
                        </span>
                    `;
                } else if (node.type === "power") {
                    const isExpActive = showCursor && (this.cursor.list === node.exp);
                    const expHtml = getSlotHtml(node.exp, node, "exp", true);
                    html += `<sup class="cw-exp ${isExpActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="exp">${expHtml}</sup>`;
                } else if (node.type === "func") {
                    let fnDisplay = node.value;
                    if (fnDisplay === "asin") fnDisplay = "sin⁻¹";
                    else if (fnDisplay === "acos") fnDisplay = "cos⁻¹";
                    else if (fnDisplay === "atan") fnDisplay = "tan⁻¹";
                    else if (fnDisplay === "asinh") fnDisplay = "sinh⁻¹";
                    else if (fnDisplay === "acosh") fnDisplay = "cosh⁻¹";
                    else if (fnDisplay === "atanh") fnDisplay = "tanh⁻¹";
                    const isContentActive = showCursor && (this.cursor.list === node.children);
                    const contentHtml = getSlotHtml(node.children, node, "children", false);
                    html += `<span class="cw-func-block" data-node-id="${node.id}"><span class="cw-func">${fnDisplay}(</span><span class="cw-func-arg ${isContentActive ? 'active-slot' : ''}" data-node-id="${node.id}" data-slot="children">${contentHtml}</span><span class="cw-func">)</span></span>`;
                }
            }

            if (showCursor && this.cursor.list === list && this.cursor.index === list.length) {
                html += `<span class="cw-cursor"></span>`;
            }
            return html;
        };

        if (this.root.length === 0) {
            return showCursor ? `<span class="cw-cursor"></span>` : "";
        }

        return renderList(this.root, null, "root");
    }

    // Convert tree to standard mathematical string for calculation engine
    toExpressionString() {
        const serializeList = (list) => {
            let str = "";
            for (const node of list) {
                if (node.type === "char") {
                    str += node.value;
                } else if (node.type === "vct") {
                    str += node.value;
                } else if (node.type === "frac") {
                    const n = serializeList(node.num) || "1";
                    const d = serializeList(node.den) || "1";
                    str += `((${n})/(${d}))`;
                } else if (node.type === "mixed") {
                    const w = serializeList(node.whole) || "0";
                    const n = serializeList(node.num) || "0";
                    const d = serializeList(node.den) || "1";
                    str += `(${w}+(${n})/(${d}))`;
                } else if (node.type === "sqrt") {
                    const c = serializeList(node.children) || "0";
                    str += `sqrt(${c})`;
                } else if (node.type === "cbrt") {
                    const c = serializeList(node.children) || "0";
                    str += `cbrt(${c})`;
                } else if (node.type === "nthRoot") {
                    const idx = serializeList(node.rootIndex) || "2";
                    const rad = serializeList(node.radicand) || "0";
                    str += `root(${idx},${rad})`;
                } else if (node.type === "integral") {
                    const e = serializeList(node.expr) || "0";
                    const a = serializeList(node.lower) || "0";
                    const b = serializeList(node.upper) || "1";
                    str += `integrate(${e},${a},${b})`;
                } else if (node.type === "derivative") {
                    const e = serializeList(node.expr) || "0";
                    const p = serializeList(node.point) || "0";
                    str += `deriv(${e},${p})`;
                } else if (node.type === "logab") {
                    const b = serializeList(node.base);
                    const a = serializeList(node.arg);
                    if (!a && b) {
                        str += `log(${b})`;
                    } else if (a && !b) {
                        str += `log(${a})`;
                    } else {
                        str += `logab(${b || "10"},${a || "1"})`;
                    }
                } else if (node.type === "abs") {
                    const c = serializeList(node.children) || "0";
                    str += `abs(${c})`;
                } else if (node.type === "power") {
                    const e = serializeList(node.exp) || "1";
                    str += `^(${e})`;
                } else if (node.type === "func") {
                    const c = serializeList(node.children) || "0";
                    str += `${node.value}(${c})`;
                }
            }
            return str;
        };

        return serializeList(this.root);
    }

    // Convert tree to clean readable string for display lines (e.g. SOLVE equation line)
    toReadableString() {
        const serializeReadable = (list) => {
            let str = "";
            for (const node of list) {
                if (node.type === "char") {
                    let c = node.value;
                    if (c === "*") c = "×";
                    if (c === "/") c = "÷";
                    str += c;
                } else if (node.type === "vct") {
                    str += node.value;
                } else if (node.type === "frac") {
                    const n = serializeReadable(node.num) || "1";
                    const d = serializeReadable(node.den) || "1";
                    str += `${n}/${d}`;
                } else if (node.type === "mixed") {
                    const w = serializeReadable(node.whole) || "0";
                    const n = serializeReadable(node.num) || "0";
                    const d = serializeReadable(node.den) || "1";
                    str += `${w} ${n}/${d}`;
                } else if (node.type === "sqrt") {
                    const c = serializeReadable(node.children) || "0";
                    str += `√(${c})`;
                } else if (node.type === "cbrt") {
                    const c = serializeReadable(node.children) || "0";
                    str += `³√(${c})`;
                } else if (node.type === "nthRoot") {
                    const idx = serializeReadable(node.rootIndex) || "n";
                    const rad = serializeReadable(node.radicand) || "0";
                    str += `^( ${idx} )√(${rad})`;
                } else if (node.type === "integral") {
                    const e = serializeReadable(node.expr) || "0";
                    str += `∫(${e})dx`;
                } else if (node.type === "derivative") {
                    const e = serializeReadable(node.expr) || "0";
                    const p = serializeReadable(node.point) || "0";
                    str += `d/dx(${e})|x=${p}`;
                } else if (node.type === "logab") {
                    const b = serializeReadable(node.base) || "10";
                    const a = serializeReadable(node.arg) || "1";
                    str += `log_${b}(${a})`;
                } else if (node.type === "abs") {
                    const c = serializeReadable(node.children) || "0";
                    str += `|${c}|`;
                } else if (node.type === "power") {
                    const e = serializeReadable(node.exp) || "1";
                    str += `^(${e})`;
                } else if (node.type === "func") {
                    const c = serializeReadable(node.children) || "0";
                    str += `${node.value}(${c})`;
                }
            }
            return str;
        };
        return serializeReadable(this.root);
    }
}

if (typeof window !== "undefined") {
    window.MathTree = MathTree;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { MathNode, MathTree };
}
