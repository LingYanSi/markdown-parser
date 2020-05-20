export class AST {
    type: String
    children: [AST]
}

export class ASTNode {
    type: String
    children: [ASTNode]
    src: String
    alt: String
    language: String
    value: String
}

export class DiffResult {
    type = ''
    prevNode = {
        type: '',
        children: [],
        __htmlNode: document.body,
    }
    nextNode = {
        type: '',
        children: [],
        propsChange: [],
        __moveTo: {},
    }
    children = []
    propsChange = []
}
