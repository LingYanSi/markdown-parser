const config = {
    listIdent: 2,
    tabReplace: 2,
}

export function setShared(v) {
    Object.assign(config, v)
}

export function getShared() {
    return config
}
