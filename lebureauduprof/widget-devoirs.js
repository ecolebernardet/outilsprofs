// =========================================================================
// WIDGET DEVOIRS
// =========================================================================

(function () {
    const tpl = document.createElement('template');
    tpl.id = 'template-homework';
    tpl.innerHTML = `
    <div class="editor-container">
        <div class="editor-content" contenteditable="true" oninput="saveBoard()">
            <span style="color:#D4C9C7;font-size:25px;font-weight:bold;">✍🏻 Devoirs à noter </span><br>
            <p><span style="color:red;background-color:#F7E02A;font-size:38px;font-weight:bold;">Pour</span></p>
            <p><span style="color:#f7639f;font-size:35px;font-weight:bold;">&nbsp;&nbsp;👉🏻 CE2 =</span></p>
            <p><span style="color:#12a2e0;font-size:35px;font-weight:bold;">&nbsp;&nbsp;👉🏽 CM2 =</span></p>
            <p><span style="color:#D9C93B;font-size:35px;font-weight:bold;">&nbsp;&nbsp;👉 TOUS =</span></p>
        </div>
    </div>`;
    document.body.appendChild(tpl);
})();
