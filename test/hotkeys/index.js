import Events from './events.js'
import getKeyName from './keys.js'

const specialKeys = ['cmd', 'option', 'ctrl']

const log = (...info) => {
    // console.log(...info)
}

function isSame(keys = '', name = '') {
    const keysArr = keys.split('+').map(i => i.trim()).filter(i => i)
    const nameArr = name.split('+').map(i => i.trim()).filter(i => i)

    return keysArr.length === nameArr.length
        && keysArr.every(i => nameArr.includes(i))
        && nameArr.every(i => keysArr.includes(i))
}

export default class HotKey extends Events {
    normalKeys = {}

    specialKeys = {}

    get allSK() {
        // 只有值大于0的才算当前已摁下的按键
        return Object.keys(this.specialKeys).filter(i => this.specialKeys[i] > 0)
    }

    get allNK() {
        // 只有值大于0的才算当前已摁下的按键
        return Object.keys(this.normalKeys).filter(i => this.normalKeys[i] > 0)
    }

    constructor($ele = window) {
        super()

        $ele.addEventListener('keydown', (event) => {
            // 记录是不是特殊的按键
            // 特殊按钮激活的情况下，监听不到其他按键的keyup事件
            const keyCode = getKeyName(event.keyCode)
            const tmpKey = []
            if (specialKeys.includes(keyCode)) {
                this.specialKeys[keyCode] = 1
            } else if (this.allSK.length == 0) {
                this.normalKeys[keyCode] = (this.normalKeys[keyCode] || 0) + 1
            } else {
                tmpKey.push(keyCode)
            }

            const allKeys = [...this.allSK, ...this.allNK, ...tmpKey]
            log('所有enter', allKeys)

            // 按照某个顺序排列
            // cmd + ctrl + option + s + c
            Object.keys(this.__eventsCache).forEach(name => {
                // 判断是不是相同的按键
                if (isSame(name, allKeys.join('+'))) {
                    this.trigger(name, event)
                }
            })
        })

        $ele.addEventListener('keyup', (event) => {
            const keyCode = getKeyName(event.keyCode)
            if (specialKeys.includes(keyCode)) {
                this.specialKeys[keyCode] = 0
            } else {
                this.normalKeys[keyCode] = 0
            }
            log('所有up', keyCode)
        })

        // 在元素失去焦点的时候，应当清空keys，因为有可能一些刷新/收藏之类的事件
        $ele.addEventListener('blur', () => {
            this.clearAllKeys()
        })
    }

    clearAllKeys() {
        this.normalKeys = {}
        this.specialKeys = {}
    }
}
