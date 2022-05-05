// hello.mjs -- or the extension could be just `.js`
export function hello(text) {
    const div = document.createElement('div');
    div.textContent = `Hello ${text}`;
    document.body.appendChild(div);
}

