import { nodeType } from './util.js';

class ASTNode {
    constructor(type = '', tokens = []) {
        this.type = type;
        this.tokens = tokens;
        this.children = [];
        this.value = '';
    }
    /**
     * @param {ASTNode} child
     * @returns
     * @memberof ASTNode
     */
    push(child) {
        child.__parent = this;
        this.children.push(child);
        return this;
    }

    // 可以把连续的text token合并成一个Text Node
    addToken(token) {
        token && this.tokens.push(token);
        // 仅对于text node才有value属性
        this.value = this.tokens.map((i) => i.raw).join('');
    }

    get raw() {
        return (
            this.children
                .map((i) => i.tokens.map((i) => i.raw).join(''))
                .join('') || this.tokens.map((i) => i.raw).join('')
        );
    }
}

export function createAstNode(type, tokens = [], properties = {}) {
    const ast = new ASTNode(type, tokens);
    Object.assign(ast, properties);
    if (type === nodeType.text) {
        ast.addToken();
    }
    return ast;
}
