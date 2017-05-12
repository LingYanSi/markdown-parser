/**
 * [fileCache js资源状态缓存]
 * @type {Object}
 */
let fileCache = {}

/**
 * [loadSingleScript 加载单个js资源]
 * @method loadSingleScript
 * @param  {String}         src [资源地址]
 * @return {Promise}             [description]
 */
function loadSingleScript (src = '') {
    return new Promise((resolve, reject) => {

        if (fileCache[src]) {
            return resolve()
        }

        let a = document.createElement('a')
        a.href = src
        let pathname = a.pathname

        if (pathname.endsWith('.css')) {
            let script = document.createElement('link')
            document.head.appendChild(script)
            script.onload = ()=>{
                fileCache[src] = true
                resolve()
            }
            script.onerror = script.onabort = ()=>{
                document.head.removeChild(script)
                reject()
            }
            script.type = "text/css"
            script.rel = "stylesheet"
            script.charset = "utf-8"
            script.href = src
        } else {
            let script = document.createElement('script')
            document.head.appendChild(script)
            script.onload = ()=>{
                fileCache[src] = true
                document.head.removeChild(script)
                resolve()
            }
            script.onerror = script.onabort = ()=>{
                document.head.removeChild(script)
                reject()
            }
            script.src = src
        }
    })
}

/**
 * [loadScript description]
 * @method loadScript
 * @param  {...}   ARR [接受多个资源地址]
 * @return {Promise}       [description]
 */
function loadScript(...ARR){
    return Promise.all(ARR.map(loadSingleScript))
}

/**
 * [loadScriptInQueue 按顺序加载资源]
 * @method loadScript
 * @param  {...}   ARR [接受多个资源地址]
 * @return {Promise}       [description]
 */
function loadScriptInQueue(...ARR){
    return new Promise((resolve, reject) => {
        var index = 0
        function load(src){
            loadSingleScript(src).then(success => {
                index++
                if (index >= ARR.length) {
                    resolve()
                } else {
                    load(ARR[index])
                }
            }, fail => {
                reject()
                console.error(`${src}加载失败`);
            })
        }
        load(ARR[index])
    })
}

export default {
    loadScriptInQueue,
    loadScript,
    loadSingleScript,
}

export {
    loadScriptInQueue,
    loadScript,
    loadSingleScript,
}
