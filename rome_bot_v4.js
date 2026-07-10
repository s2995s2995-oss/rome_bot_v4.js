// ================================================================
//   🤖 ROME Bot V4 - 主程式（雲端版）
//   更新此檔案即可讓所有同事自動使用最新版本
// ================================================================

const romeBotEngine = async function() {
    let isPaused = false;
    let isCancelled = false;

    const smartDelay = async (ms) => {
        let elapsed = 0;
        while (elapsed < ms) {
            if (isCancelled) throw new Error('USER_CANCEL');
            while (isPaused) {
                if (isCancelled) throw new Error('USER_CANCEL');
                await new Promise(res => setTimeout(res, 200));
            }
            await new Promise(res => setTimeout(res, 100));
            elapsed += 100;
        }
    };

    const waitUntilNotBusy = async (timeout = 15000) => {
        await new Promise(res => setTimeout(res, 300));
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (isCancelled) throw new Error('USER_CANCEL');
            while (isPaused) {
                if (isCancelled) throw new Error('USER_CANCEL');
                await new Promise(res => setTimeout(res, 200));
            }
            const isBusy =
                (typeof pega !== 'undefined' && typeof pega.u?.d?.gBusyInd !== 'undefined' && pega.u.d.gBusyInd === true) ||
                document.querySelector('.pega-busy-indicator, .wait-indicator, [id*="busy"]') !== null ||
                document.querySelector('.loadingBanner, .spinnerContainer') !== null;
            if (!isBusy) {
                await new Promise(res => setTimeout(res, 300));
                return true;
            }
            await new Promise(res => setTimeout(res, 250));
        }
        logger('⚠️ waitUntilNotBusy 超時，強制繼續...', true);
        return false;
    };

    const waitForElement = async (selector, timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (isCancelled) throw new Error('USER_CANCEL');
            while (isPaused) {
                if (isCancelled) throw new Error('USER_CANCEL');
                await new Promise(res => setTimeout(res, 200));
            }
            const el = document.querySelector(selector);
            if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                await new Promise(res => setTimeout(res, 100));
                return el;
            }
            await new Promise(res => setTimeout(res, 250));
        }
        logger('⚠️ waitForElement 超時：找不到 [' + selector + ']', true);
        return null;
    };

    const waitForButton = async (btnText, timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (isCancelled) throw new Error('USER_CANCEL');
            while (isPaused) {
                if (isCancelled) throw new Error('USER_CANCEL');
                await new Promise(res => setTimeout(res, 200));
            }
            const btn = Array.from(document.querySelectorAll('button'))
                .find(b => b.innerText.trim() === btnText && !b.disabled && b.offsetWidth > 0 && b.offsetHeight > 0);
            if (btn) {
                await new Promise(res => setTimeout(res, 100));
                return btn;
            }
            await new Promise(res => setTimeout(res, 250));
        }
        logger('⚠️ waitForButton 超時：找不到按鈕 [' + btnText + ']', true);
        return null;
    };

    const waitForValueChange = async (selector, originalValue, timeout = 15000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (isCancelled) throw new Error('USER_CANCEL');
            while (isPaused) {
                if (isCancelled) throw new Error('USER_CANCEL');
                await new Promise(res => setTimeout(res, 200));
            }
            const el = document.querySelector(selector);
            if (el && el.value !== originalValue && el.value !== '') {
                logger('✅ 欄位數值已更新：' + originalValue + ' → ' + el.value);
                return el.value;
            }
            await new Promise(res => setTimeout(res, 250));
        }
        logger('⚠️ waitForValueChange 超時：值未從 [' + originalValue + '] 改變', true);
        return null;
    };

    const safeClick = async (el) => {
        if (!el) return false;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await new Promise(res => setTimeout(res, 150));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await new Promise(res => setTimeout(res, 80));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        await new Promise(res => setTimeout(res, 80));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise(res => setTimeout(res, 100));
        return true;
    };

    const safeFillPegaInput = async (inputName, value) => {
        const el = document.querySelector('input[name="' + inputName + '"], textarea[name="' + inputName + '"]');
        if (el) {
            el.focus(); el.click();
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            return true;
        }
        return false;
    };

    const fillPegaInputHollowBomb = async (inputName, value) => {
        const els = document.querySelectorAll('input[name="' + inputName + '"]');
        if (els.length > 0) {
            for (let el of els) {
                el.focus(); el.click();
                el.value = value;
                el.setAttribute('value', value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
            return true;
        }
        return false;
    };

    const splitChineseName = (fullName) => {
        if (!fullName) return { first: '', last: '' };
        fullName = fullName.trim();
        if (fullName.length <= 1) return { first: fullName, last: '' };
        if (fullName.length === 2) return { first: fullName.charAt(1), last: fullName.charAt(0) };
        if (fullName.length === 3) return { first: fullName.substring(1), last: fullName.charAt(0) };
        if (fullName.length === 4) {
            const compoundSurnames = ["司馬","歐陽","諸葛","端木","公孫","東方","獨孤","南宮","萬俟","聞人","夏侯","尉遲","皇甫","澹台","公冶","宗政","濮陽","淳于","單于","太史","申屠","公羊","樂正","軒轅","令狐","鍾離","閭丘","長孫","慕容","鮮于","司徒","司空"];
            const doubleS = fullName.substring(0, 2);
            if (compoundSurnames.includes(doubleS)) return { first: fullName.substring(2), last: doubleS };
        }
        return { first: fullName.substring(1), last: fullName.charAt(0) };
    };

    const dismissDirtyCheck = async () => {
        await smartDelay(800);
        const okBtn = document.querySelector('button[name="pyDirtyCheckConfirm_pyWorkPage_8"]');
        if (okBtn && okBtn.offsetWidth > 0) {
            logger('🔔 偵測到確認彈窗，自動點擊 OK...');
            await safeClick(okBtn);
            await waitUntilNotBusy();
            logger('✅ 彈窗已關閉');
        }
    };

    const switchTab = async (tabName) => {
        logger('🔀 切換至頁籤：' + tabName);
        const tabs = document.querySelectorAll('span.menu-item-title');
        for (let tab of tabs) {
            if (tab.innerText.trim() === tabName) {
                await safeClick(tab);
                await dismissDirtyCheck();
                await waitUntilNotBusy();
                await smartDelay(1500);
                logger('✅ 已切換至 [' + tabName + ']');
                return true;
            }
        }
        logger('⚠️ 找不到頁籤：' + tabName, true);
        return false;
    };

    const checkFirstResultCheckbox = async () => {
        logger('✅ 偵測搜尋結果 Checkbox...');
        let checkbox = await waitForElement('input[type="checkbox"][name*="$ppxResults$l1$ppySelected"]', 8000);
        if (!checkbox) {
            checkbox = document.querySelector('input[type="checkbox"][name*="ppySelected"]') ||
                       document.querySelector('input[type="checkbox"][name*="SearchInvitee"]');
        }
        if (checkbox) {
            checkbox.scrollIntoView({ block: 'center', behavior: 'smooth' });
            if (!checkbox.checked) {
                await safeClick(checkbox);
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                logger('ℹ️ 已是勾選狀態，跳過。');
            }
            await waitUntilNotBusy();
            return true;
        }
        logger('⚠️ 無法定位 Checkbox！', true);
        return false;
    };

    const clickAddSelections = async () => {
        logger('➕ 尋找 "Add Selections" 按鈕...');
        let btn = await waitForButton('Add Selections', 8000);
        if (!btn) btn = document.querySelector('button[name^="SearchExternalCRMActionButtons_NewInvitee_"]');
        if (btn) {
            await safeClick(btn);
            await waitUntilNotBusy();
            return true;
        }
        logger('⚠️ 無法定位 "Add Selections" 按鈕！', true);
        return false;
    };

    const clickSave = async () => {
        logger('💾 執行 Save 儲存...');
        let sBtn = document.querySelector('button[name="pyCaseHeader_pyWorkPage_5"]');
        if (!sBtn) sBtn = await waitForButton('Save', 8000);
        if (sBtn) {
            await safeClick(sBtn);
            await dismissDirtyCheck();
            await waitUntilNotBusy(20000);
            logger('✅ Save 完成。');
            return true;
        }
        logger('⚠️ 找不到 Save 按鈕！', true);
        return false;
    };

    if (document.getElementById('rome-control-panel')) {
        document.getElementById('rome-control-panel').remove();
    }

    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('rome_bot_cache_v4') || '{}'); } catch (e) {}
    const getV = (k, f) => cache[k] !== undefined ? cache[k] : f;

    const panel = document.createElement('div');
    panel.id = 'rome-control-panel';
    panel.style = 'position:fixed;top:15px;right:15px;z-index:9999999;width:410px;background:#ffffff;border:2px solid #005a9c;border-radius:12px;box-shadow:0px 6px 20px rgba(0,0,0,0.2);font-family:Arial,sans-serif;font-size:13px;color:#333;';
    panel.innerHTML = `
        <div style="background:#005a9c;color:white;padding:12px;font-weight:bold;border-top-left-radius:9px;border-top-right-radius:9px;display:flex;justify-content:space-between;align-items:center;">
            <span>🚀 ROME 全自動填表控制台 V4（智慧監控版）</span>
            <button id="rome-panel-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">&times;</button>
        </div>
        <div id="rome-panel-body" style="padding:15px;max-height:85vh;overflow-y:auto;">
            <p style="margin-top:0;color:#666;font-size:11px;">已自動帶入上次填寫內容，確認後點擊執行：</p>
            <div style="margin-bottom:10px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">📝 STEP 1: General 欄位</b><br>
                活動名稱：<input id="inp-gen-name" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                活動目的＆正當需求：<textarea id="inp-gen-objneed" style="width:95%;height:50px;padding:4px;margin-top:2px;"></textarea><br>
                專員名稱：<input id="inp-gen-planner" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                產品名稱：<input id="inp-gen-product" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                活動日期：<input id="inp-gen-date" type="date" style="width:95%;padding:4px;margin-top:2px;font-family:sans-serif;">
            </div>
            <div style="margin-bottom:10px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">📍 STEP 2: Logistics 地點</b><br>
                場地名稱：<input id="inp-venue" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                場地地址：<input id="inp-address" type="text" style="width:95%;padding:4px;margin-top:2px;">
            </div>
            <div style="margin-bottom:10px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">👥 STEP 3: Invitees 人數與受邀者</b><br>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:2px;margin-bottom:6px;">
                    <div>Mod: <input id="inp-mod" type="number" style="width:60px;padding:3px;"></div>
                    <div>Passive: <input id="inp-passive" type="number" style="width:60px;padding:3px;"></div>
                    <div>Speaker: <input id="inp-speaker" type="number" style="width:60px;padding:3px;"></div>
                    <div>Staff: <input id="inp-staff" type="number" style="width:60px;padding:3px;"></div>
                </div>
                演講者姓名：<input id="inp-speaker-name" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                主持人姓名：<input id="inp-mod-name" type="text" style="width:95%;padding:4px;margin-top:2px;">
            </div>
            <div style="margin-bottom:10px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">💰 STEP 4: Budget & WBS</b><br>
                預算金額：<input id="inp-budget" type="number" style="width:35%;padding:4px;margin-top:2px;">
                WBS 碼：<input id="inp-wbs" type="text" style="width:50%;padding:4px;margin-top:2px;">
            </div>
            <div style="margin-bottom:10px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">👑 STEP 5: Approver 簽核</b><br>
                審查 Email：<input id="inp-approver" type="text" style="width:95%;padding:4px;margin-top:2px;"><br>
                審查角色：<select id="inp-app-role" style="width:95%;padding:4px;margin-top:2px;">
                    <option value="Chapter Lead">Chapter Lead</option>
                    <option value="Cluster Lead">Cluster Lead</option>
                    <option value="[Event] Market Access & Policy Advisor">[Event] Market Access & Policy Advisor</option>
                    <option value="[Event] Marketing Advisor">[Event] Marketing Advisor</option>
                    <option value="[Event] Medical Advisor">[Event] Medical Advisor</option>
                    <option value="[Event] Patient Journey Partner">[Event] Patient Journey Partner</option>
                    <option value="FBO Director">FBO Director</option>
                    <option value="General Manager">General Manager</option>
                    <option value="[GSD] Team Lead/ Chapter Lead/ Squad Lead">[GSD] Team Lead/ Chapter Lead/ Squad Lead</option>
                    <option value="Squad Lead">Squad Lead</option>
                    <option value="Team Lead">Team Lead</option>
                </select>
            </div>
            <div style="margin-bottom:15px;border:1px solid #ddd;padding:8px;border-radius:6px;background:#f9fbfd;">
                <b style="color:#005a9c;">📁 STEP 6: Agenda 雲端連結</b><br>
                雲端網址：<input id="inp-url" type="text" style="width:95%;padding:4px;margin-top:2px;">
            </div>
            <button id="rome-btn-start" style="width:100%;padding:11px;background:#005a9c;color:white;border:none;border-radius:6px;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.15);">🔥 開始執行全自動化填表</button>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('inp-gen-name').value     = getV('gName',         '');
    document.getElementById('inp-gen-objneed').value  = getV('gObjNeed',      '');
    document.getElementById('inp-gen-planner').value  = getV('gPlanner',      '');
    document.getElementById('inp-gen-product').value  = getV('gProduct',      '');
    document.getElementById('inp-gen-date').value     = getV('gDate',         '');
    document.getElementById('inp-venue').value        = getV('vVenueName',    '');
    document.getElementById('inp-address').value      = getV('vVenueAddress', '');
    document.getElementById('inp-mod').value          = getV('vModCount',     '1');
    document.getElementById('inp-passive').value      = getV('vPassiveCount', '');
    document.getElementById('inp-speaker').value      = getV('vSpeakerCount', '1');
    document.getElementById('inp-staff').value        = getV('vStaffCount',   '');
    document.getElementById('inp-speaker-name').value = getV('vSpeakerName',  '');
    document.getElementById('inp-mod-name').value     = getV('vModName',      '');
    document.getElementById('inp-budget').value       = getV('vBudget',       '');
    document.getElementById('inp-wbs').value          = getV('vWBSCode',      '');
    document.getElementById('inp-approver').value     = getV('vApprover',     '');
    document.getElementById('inp-app-role').value     = getV('vApproverRole', 'Team Lead');
    document.getElementById('inp-url').value          = getV('vAgendaURL',    '');

    document.getElementById('rome-panel-close').onclick = () => panel.remove();

    const config = await new Promise((resolve) => {
        document.getElementById('rome-btn-start').onclick = () => {
            const data = {
                gName:         document.getElementById('inp-gen-name').value,
                gObjNeed:      document.getElementById('inp-gen-objneed').value,
                gPlanner:      document.getElementById('inp-gen-planner').value,
                gProduct:      document.getElementById('inp-gen-product').value,
                gDate:         document.getElementById('inp-gen-date').value,
                vVenueName:    document.getElementById('inp-venue').value,
                vVenueAddress: document.getElementById('inp-address').value,
                vModCount:     document.getElementById('inp-mod').value,
                vPassiveCount: document.getElementById('inp-passive').value,
                vSpeakerCount: document.getElementById('inp-speaker').value,
                vStaffCount:   document.getElementById('inp-staff').value,
                vSpeakerName:  document.getElementById('inp-speaker-name').value,
                vModName:      document.getElementById('inp-mod-name').value,
                vBudget:       document.getElementById('inp-budget').value,
                vWBSCode:      document.getElementById('inp-wbs').value,
                vApprover:     document.getElementById('inp-approver').value,
                vApproverRole: document.getElementById('inp-app-role').value,
                vAgendaURL:    document.getElementById('inp-url').value,
            };
            localStorage.setItem('rome_bot_cache_v4', JSON.stringify(data));
            resolve(data);
        };
    });

    const body = document.getElementById('rome-panel-body');
    body.innerHTML = `
        <div style="display:flex;gap:10px;margin-bottom:12px;">
            <button id="rome-btn-pause" style="flex:1;padding:8px;background:#f0ad4e;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">⏸️ 暫停執行</button>
            <button id="rome-btn-cancel" style="flex:1;padding:8px;background:#d9534f;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">❌ 取消退出</button>
        </div>
        <div id="rome-log" style="background:#000;color:#00ff00;font-family:Courier,monospace;font-size:11px;padding:10px;height:300px;overflow-y:auto;border-radius:6px;line-height:1.4;border:1px solid #333;">
            [系統] V4 智慧監控引擎啟動中...<br>
        </div>
    `;

    const logger = (msg, isError = false) => {
        const logDiv = document.getElementById('rome-log');
        if (!logDiv) return;
        const color = isError ? '#ff5252' : '#00ff00';
        logDiv.innerHTML += '<span style="color:' + color + ';">' + msg + '</span><br>';
        logDiv.scrollTop = logDiv.scrollHeight;
    };

    const pBtn = document.getElementById('rome-btn-pause');
    pBtn.onclick = () => {
        isPaused = !isPaused;
        pBtn.innerText = isPaused ? '▶️ 繼續執行' : '⏸️ 暫停執行';
        pBtn.style.background = isPaused ? '#5cb85c' : '#f0ad4e';
        logger(isPaused ? '⚠️ 暫停指令已下達。' : '▶️ 暫停解除，繼續執行。');
    };
    document.getElementById('rome-btn-cancel').onclick = () => {
        isCancelled = true;
        logger('❌ 使用者強制終止中...', true);
    };

    try {
        logger('🚀 ROME Bot V4 正式啟動！');

        logger('--- 🌟 STEP 1：General 欄位填寫 ---');
        await switchTab('General');
        const nameEl = await waitForElement('input[name="$PpyWorkPage$pEvent$pName"]');
        if (nameEl) { await safeFillPegaInput('$PpyWorkPage$pEvent$pName', config.gName); logger('✅ 活動名稱已填入'); }
        await safeFillPegaInput('$PpyWorkPage$pEvent$pDescription', config.gObjNeed);
        await safeFillPegaInput('$PpyWorkPage$pEvent$pLegitimateNeed', config.gObjNeed);
        logger('✅ 活動目的與正當需求已同步注入');
        const plannerEl = await waitForElement('input[name="$PpyWorkPage$pEvent$pPlanner$ppyFullName"]');
        if (plannerEl) {
            logger('👤 填寫 Event Planner...');
            plannerEl.scrollIntoView({ block: 'center' });
            plannerEl.focus(); plannerEl.click(); plannerEl.value = '';
            await smartDelay(300);
            plannerEl.value = config.gPlanner;
            plannerEl.dispatchEvent(new Event('input', { bubbles: true }));
            await waitUntilNotBusy(8000);
            plannerEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 40, key: 'ArrowDown' }));
            await smartDelay(600);
            plannerEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 13, key: 'Enter' }));
            await smartDelay(600);
            plannerEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 40, key: 'ArrowDown' }));
            await smartDelay(600);
            plannerEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 13, key: 'Enter' }));
            plannerEl.dispatchEvent(new Event('change', { bubbles: true }));
            plannerEl.dispatchEvent(new Event('blur', { bubbles: true }));
            await waitUntilNotBusy();
            logger('✅ Event Planner 填寫完成');
        }
        logger('📅 偵測日期格式...');
        let dateEl = document.querySelector('input[name="$PpyWorkPage$pEvent$pStartDate"]');
        let formatPattern = 'MM/DD/YYYY';
        if (dateEl) {
            let dv = dateEl.getAttribute('data-value');
            if (dv && dv.includes('/')) {
                let p = dv.split('/');
                if (p[0].length === 4) formatPattern = 'YYYY/MM/DD';
                else if (p[2].length === 4 && parseInt(p[0], 10) > 12) formatPattern = 'DD/MM/YYYY';
            } else if (navigator.language.toLowerCase().includes('zh') || navigator.language.toLowerCase().includes('tw')) {
                formatPattern = 'YYYY/MM/DD';
            }
        }
        logger('🎯 日期格式偵測結果：[' + formatPattern + ']');
        if (config.gDate && config.gDate.includes('-')) {
            let dParts = config.gDate.split('-');
            let y = dParts[0], m = dParts[1], d = dParts[2];
            let finalDate = (formatPattern === 'YYYY/MM/DD') ? y+'/'+m+'/'+d : m+'/'+d+'/'+y;
            await safeFillPegaInput('$PpyWorkPage$pEvent$pStartDate', finalDate);
            await safeFillPegaInput('$PpyWorkPage$pEvent$pEndDate', finalDate);
            logger('📅 日期已注入：' + finalDate);
        }
        await waitUntilNotBusy();
        const productEl = await waitForElement('input[data-target="$PpyWorkPage$pEvent$pProducts"]');
        if (productEl) {
            logger('📦 啟動 Product 手打模擬器...');
            productEl.scrollIntoView({ block: 'center' });
            productEl.focus(); productEl.click(); productEl.value = '';
            await smartDelay(500);
            for (let char of config.gProduct) {
                productEl.value += char;
                productEl.dispatchEvent(new Event('input', { bubbles: true }));
                productEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: char }));
                productEl.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: char }));
                productEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: char }));
                await smartDelay(150);
            }
            await waitUntilNotBusy(8000);
            productEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown', keyCode: 40 }));
            await smartDelay(800);
            ['keydown','keypress','keyup'].forEach(t => productEl.dispatchEvent(new KeyboardEvent(t, { key:'Enter', keyCode:13, bubbles:true })));
            productEl.dispatchEvent(new Event('change', { bubbles: true }));
            productEl.dispatchEvent(new Event('blur', { bubbles: true }));
            await waitUntilNotBusy(8000);
            logger('✅ Product 填寫完成');
        }
        await clickSave();

        logger('--- 📍 STEP 2：Logistics 地點填寫 ---');
        await switchTab('Logistics');
        const approachSel = await waitForElement('select[name="$PpyWorkPage$pEvent$pLogistics$pLogisticsApproach"]', 15000);
        if (approachSel) { approachSel.value = 'Face2Face'; approachSel.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); logger('✅ 活動形式設為 Face2Face'); }
        const addVenueBtn = await waitForElement('button[name^="VenueListActions_"]', 15000);
        if (addVenueBtn) { await safeClick(addVenueBtn); await waitUntilNotBusy(); logger('✅ Add Venue 彈窗已開啟'); }
        const venueTypeSel = await waitForElement('select[name="$PTempVenueDetail$pVenueType"]');
        if (venueTypeSel) { venueTypeSel.value = 'Other Offsite Venue'; venueTypeSel.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); logger('✅ 場地類型設為 Other Offsite Venue'); }
        const venueNameEl = await waitForElement('input[name="$PTempVenueDetail$pVenue"]');
        if (venueNameEl) { await fillPegaInputHollowBomb('$PTempVenueDetail$pVenue', config.vVenueName); logger('✅ 場地名稱：' + config.vVenueName); }
        const venueAddrEl = await waitForElement('input[name="$PTempVenueDetail$pVenueAddress"]');
        if (venueAddrEl) { await fillPegaInputHollowBomb('$PTempVenueDetail$pVenueAddress', config.vVenueAddress); logger('✅ 場地地址：' + config.vVenueAddress); }
        const addBtn = await waitForButton('Add');
        if (addBtn) { await safeClick(addBtn); await waitUntilNotBusy(); logger('✅ 場地已新增'); }
        await clickSave();

        logger('--- 👥 STEP 3：Invitees 人員填寫 ---');
        await switchTab('Invitees');
        await waitForElement('input[name="$PpyWorkPage$pEvent$pInvitees$l3$ppyCount"]');
        await fillPegaInputHollowBomb('$PpyWorkPage$pEvent$pInvitees$l3$ppyCount', config.vModCount); await waitUntilNotBusy(); logger('✅ Mod 人數：' + config.vModCount);
        await fillPegaInputHollowBomb('$PpyWorkPage$pEvent$pInvitees$l4$ppyCount', config.vPassiveCount); await waitUntilNotBusy(); logger('✅ Passive 人數：' + config.vPassiveCount);
        await fillPegaInputHollowBomb('$PpyWorkPage$pEvent$pInvitees$l5$ppyCount', config.vSpeakerCount); await waitUntilNotBusy(); logger('✅ Speaker 人數：' + config.vSpeakerCount);
        await fillPegaInputHollowBomb('$PpyWorkPage$pEvent$pInvitees$l6$ppyCount', config.vStaffCount); await waitUntilNotBusy(); logger('✅ Staff 人數：' + config.vStaffCount);
        if (config.vSpeakerName || config.vModName) {
            logger('🔍 展開 Actual 區塊...');
            const actualHeader = Array.from(document.querySelectorAll('h4.layout-group-item-title')).find(el => el.textContent.trim().includes('Actual'));
            if (actualHeader) { await safeClick(actualHeader); await waitUntilNotBusy(); }
            logger('➕ 點擊 Add Invitees...');
            let addInviteesBtn = await waitForElement('button[name^="InviteeListActionsForEvents_pyWorkPage_"]');
            if (!addInviteesBtn) addInviteesBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim().includes('Add Invitees'));
            if (addInviteesBtn) { await safeClick(addInviteesBtn); await waitUntilNotBusy(); }
            logger('🔍 展開 Search 面板...');
            const searchLink = await waitForElement('a[name^="SearchInviteeSourceOptions_NewInvitee_"]');
            if (searchLink) { await safeClick(searchLink); await waitUntilNotBusy(); }
            if (config.vSpeakerName) {
                const sName = splitChineseName(config.vSpeakerName);
                logger('🗣️ [第一輪] 搜尋演講者：' + config.vSpeakerName);
                const fn1 = await waitForElement('input[name="$PTempNewInviteePage$pFirstName"]');
                if (fn1) await safeFillPegaInput('$PTempNewInviteePage$pFirstName', sName.first);
                await waitUntilNotBusy();
                const ln1 = await waitForElement('input[name="$PTempNewInviteePage$pLastName"]');
                if (ln1) await safeFillPegaInput('$PTempNewInviteePage$pLastName', sName.last);
                await waitUntilNotBusy();
                let sb1 = await waitForButton('Search', 8000);
                if (!sb1) sb1 = document.querySelector('button[name="SearchExternalInviteeButtons_TempNewInviteePage_1"]');
                if (sb1) { await safeClick(sb1); await waitUntilNotBusy(12000); }
                const ok1 = await checkFirstResultCheckbox();
                if (ok1) await clickAddSelections();
                logger('🧹 清除第一輪搜尋紀錄...');
                const cl1 = await waitForElement('a[name^="SearchInviteeSourceOptions_NewInvitee_"]', 5000);
                if (cl1) {
                    await safeClick(cl1); await waitUntilNotBusy();
                    await safeFillPegaInput('$PTempNewInviteePage$pFirstName', '');
                    await safeFillPegaInput('$PTempNewInviteePage$pLastName', '');
                    const cb1 = await waitForButton('Cancel', 5000);
                    if (cb1) { await safeClick(cb1); await waitUntilNotBusy(); logger('✅ 第一輪清除完成'); }
                }
            }
            if (config.vModName) {
                const mName = splitChineseName(config.vModName);
                logger('👤 [第二輪] 搜尋主持人：' + config.vModName);
                const sl2 = await waitForElement('a[name^="SearchInviteeSourceOptions_NewInvitee_"]', 8000);
                if (sl2) { await safeClick(sl2); await waitUntilNotBusy(); }
                const fn2 = await waitForElement('input[name="$PTempNewInviteePage$pFirstName"]');
                if (fn2) await safeFillPegaInput('$PTempNewInviteePage$pFirstName', mName.first);
                await waitUntilNotBusy();
                const ln2 = await waitForElement('input[name="$PTempNewInviteePage$pLastName"]');
                if (ln2) await safeFillPegaInput('$PTempNewInviteePage$pLastName', mName.last);
                await waitUntilNotBusy();
                let sb2 = await waitForButton('Search', 8000);
                if (!sb2) sb2 = document.querySelector('button[name="SearchExternalInviteeButtons_TempNewInviteePage_1"]');
                if (sb2) { await safeClick(sb2); await waitUntilNotBusy(12000); }
                const ok2 = await checkFirstResultCheckbox();
                if (ok2) await clickAddSelections();
            }
            logger('📋 展開 Confirmation List...');
            const confirmHeader = Array.from(document.querySelectorAll('h4.layout-group-item-title')).find(el => el.textContent.trim().includes('Confirmation List'));
            if (confirmHeader) { await safeClick(confirmHeader); await waitUntilNotBusy(); }
            logger('📤 點擊 Submit 提交名單...');
            let submitBtn = await waitForButton('Submit', 8000);
            if (!submitBtn) submitBtn = document.querySelector('button[name^="SubmitInviteesActionButtons_NewInvitee_"]');
            if (submitBtn) { await safeClick(submitBtn); await waitUntilNotBusy(12000); logger('✅ 名單提交完成'); }
        }
        await clickSave();

        logger('--- 💰 STEP 4：Budget & Cost 預算填寫 ---');
        await switchTab('Budget & Cost');
        const budgetEl = await waitForElement('input[name="$PpyWorkPage$pEvent$pPlannedBudget"]');
        if (budgetEl) {
            await safeFillPegaInput('$PpyWorkPage$pEvent$pPlannedBudget', config.vBudget);
            ['keydown','keypress','keyup'].forEach(t => budgetEl.dispatchEvent(new KeyboardEvent(t, { key:'Enter', keyCode:13, bubbles:true })));
            await waitForValueChange('input[name="$PpyWorkPage$pEvent$pPlannedBudget"]', '');
            await waitUntilNotBusy();
            logger('✅ 預算金額已填入：' + config.vBudget);
        }
        let addCostBtn = await waitForElement('button[name^="CostAllocationMenu_"]');
        if (!addCostBtn) addCostBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Cost Center/WBS'));
        if (addCostBtn) { await safeClick(addCostBtn); await waitUntilNotBusy(); }
        logger('🔍 尋找 Add Manually 選項...');
        const amStart = Date.now();
        while (Date.now() - amStart < 8000) {
            if (isCancelled) throw new Error('USER_CANCEL');
            const mi = Array.from(document.querySelectorAll('span, a')).find(el => { const t = el.innerText.trim().toLowerCase(); return (t === 'add manual' || t === 'add manually') && el.offsetWidth > 0; });
            if (mi) { await safeClick(mi); await waitUntilNotBusy(); logger('✅ 已選擇 Add Manually'); break; }
            await new Promise(res => setTimeout(res, 250));
        }
        const wbsEl = await waitForElement('input[name="$PpyWorkPage$pEvent$pCostAllocations$l1$pCostCenter"]');
        if (wbsEl) { await safeFillPegaInput('$PpyWorkPage$pEvent$pCostAllocations$l1$pCostCenter', config.vWBSCode); await waitUntilNotBusy(); logger('✅ WBS 碼：' + config.vWBSCode); }
        const invTypeEl = await waitForElement('select[name="$PpyWorkPage$pEvent$pCostAllocations$l1$pCostInviteeType"]');
        if (invTypeEl) { invTypeEl.value = 'External'; invTypeEl.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); logger('✅ 費用類型設為 External'); }
        const pctEl = await waitForElement('input[name="$PpyWorkPage$pEvent$pCostAllocations$l1$pPercentageInput"]');
        if (pctEl) { await safeFillPegaInput('$PpyWorkPage$pEvent$pCostAllocations$l1$pPercentageInput', '100'); await waitUntilNotBusy(); logger('✅ 分配比例設為 100%'); }
        await clickSave();

        logger('--- 👑 STEP 5：Approvers 簽核填寫 ---');
        await switchTab('Approvers');
        const addApprBtn = await waitForButton('Add Event Approver');
        if (addApprBtn) { await safeClick(addApprBtn); await waitUntilNotBusy(); logger('✅ Add Event Approver 彈窗已開啟'); }
        const approverEmailEl = await waitForElement('input[name="$PD_PlaceHolder$pEmailAddress"]');
        if (approverEmailEl) { await safeFillPegaInput('$PD_PlaceHolder$pEmailAddress', config.vApprover); logger('✅ 審查人 Email：' + config.vApprover); }
        await waitUntilNotBusy();
        let apprSearchBtn = await waitForElement('button[name^="SearchEventApprover_"]');
        if (!apprSearchBtn) apprSearchBtn = await waitForButton('Search', 8000);
        if (apprSearchBtn) { await safeClick(apprSearchBtn); await waitUntilNotBusy(12000); logger('✅ 搜尋完成'); }
        const apprCheckbox = await waitForElement('input[name^="$PD_InviteeApproverSearchAtEvent_"][type="checkbox"]', 10000);
        if (apprCheckbox) { await safeClick(apprCheckbox); apprCheckbox.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); logger('✅ 已勾選審查人'); }
        const roleEl = await waitForElement('select[name="$PNewEventApprover$pApproverType"]');
        if (roleEl) { roleEl.value = config.vApproverRole; roleEl.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); logger('✅ 角色設為：' + config.vApproverRole); }
        const apprAddSelBtn = await waitForButton('Add Selections', 8000);
        if (apprAddSelBtn) { await safeClick(apprAddSelBtn); await waitUntilNotBusy(10000); logger('✅ 審查人已加入'); }
        await clickSave();

        logger('--- 📁 STEP 6：Attachments & Links 附件連結 ---');
        const attTab = Array.from(document.querySelectorAll('.menu-item-title')).find(el => el.innerText.includes('Attachments & Links'));
        if (attTab) { await safeClick(attTab); await dismissDirtyCheck(); await waitUntilNotBusy(); await smartDelay(1500); logger('✅ 已切換至 Attachments & Links'); }
        let addLinkMenuBtn = await waitForElement("a[name^='AttachmentAndLinksActions_D_GetContractAttachmentTypes_']", 8000);
        if (!addLinkMenuBtn) addLinkMenuBtn = await waitForElement("a[name^='AttachmentAndLinksActions_']", 5000);
        if (addLinkMenuBtn) { await safeClick(addLinkMenuBtn); await waitUntilNotBusy(); }
        logger('🔍 尋找 Add Link 選項...');
        const alStart = Date.now();
        while (Date.now() - alStart < 8000) {
            if (isCancelled) throw new Error('USER_CANCEL');
            const li = Array.from(document.querySelectorAll('span, a')).find(el => el.innerText.trim().toLowerCase() === 'add link' && el.offsetWidth > 0);
            if (li) { await safeClick(li); await waitUntilNotBusy(); logger('✅ 已點擊 Add Link'); break; }
            await new Promise(res => setTimeout(res, 250));
        }
        const typeSelEl = await waitForElement('select[name="$PpyAttachmentPage$pID"]');
        if (typeSelEl) { typeSelEl.value = '1'; typeSelEl.dispatchEvent(new Event('change', { bubbles: true })); await waitUntilNotBusy(); }
        const noteEl = await waitForElement('input[name="$PpyAttachmentPage$ppyNote"]');
        if (noteEl) { noteEl.focus(); noteEl.value = 'Agenda'; noteEl.dispatchEvent(new Event('input', { bubbles: true })); noteEl.dispatchEvent(new Event('change', { bubbles: true })); logger('✅ 備註填入：Agenda'); }
        const urlEl = await waitForElement('input[name="$PpyAttachmentPage$ppyURL"]');
        if (urlEl) { urlEl.focus(); urlEl.value = config.vAgendaURL; urlEl.dispatchEvent(new Event('input', { bubbles: true })); urlEl.dispatchEvent(new Event('change', { bubbles: true })); urlEl.dispatchEvent(new Event('blur', { bubbles: true })); logger('✅ 議程連結填入完成'); }
        await waitUntilNotBusy();
        const modalSubmit = await waitForElement('#ModalButtonSubmit', 8000);
        if (modalSubmit) { await safeClick(modalSubmit); await waitUntilNotBusy(); logger('✅ 附件連結已提交'); }

        logger('--- 🏁 STEP 7：最終大總存檔 ---');
        await clickSave();
        logger('🎉 【大獲全勝】！全案配置完成，ROME Bot V4 執行結束！');
        document.getElementById('rome-btn-pause').disabled = true;
        document.getElementById('rome-btn-cancel').disabled = true;

    } catch (err) {
        if (err.message === 'USER_CANCEL') {
            logger('❌ [系統訊息] 自動化流程已由使用者取消。', true);
        } else {
            logger('❌ [錯誤] 流程異常中斷：' + err, true);
        }
    }
};

// 自動執行
window.romeBotEngine = romeBotEngine;
