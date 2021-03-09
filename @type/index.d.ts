export interface AST {
    type: String,
    children: [AST]
}

export interface ASTNode {
    type: String,
    children: ASTNode[],
    value?: String,
    src?: String,
    alt?: String,
    language?: String,
    listStyleType?: String,
    raw: {
        start: Number,
        end: Number,
        text: String,
    }
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
