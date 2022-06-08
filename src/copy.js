export function copyToClipboard(str = '') {
    const input = document.createElement('textarea');
    input.value = str;
    input.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
    document.body.appendChild(input);

    input.setAttribute('readonly', ''); // 避免ios弹出键盘
    input.select();
    input.setSelectionRange(0, input.value.length); // 选中文本
    document.execCommand('copy');
    document.body.removeChild(input);
}
