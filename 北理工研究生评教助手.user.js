// ==UserScript==
// @name         北理工研究生评教助手
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  固定10分评分，随机评语，简洁实用
// @author       Student Helper
// @match        https://gms.bit.edu.cn/*
// @grant        GM_addStyle
// @grant        GM_notification
// @downloadURL  https://raw.githubusercontent.com/用户名/仓库名/分支名/脚本名.user.js
// @updateURL    https://raw.githubusercontent.com/用户名/仓库名/分支名/脚本名.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('北理工研究生评教助手已加载');

    // 配置
    const config = {
        // 固定全部10分
        fixedScore: 10,

        // 是否启用评语随机变化
        enableTextVariation: true,

        // 自动检测并填充（设为false则需手动点击按钮）
        autoDetectAndFill: true
    };

    // 评语库
    const suggestionBank = [
        "课程内容充实，老师讲解清晰易懂，课堂互动良好。建议可以适当增加实践环节，帮助学生更好地将理论知识应用于实际问题。如果能提供更多相关案例和参考资料会更好。",
        "老师教学认真负责，备课充分，对学生提出的问题能够耐心解答。建议在教学中可以更多地联系实际应用，增强课程的实用性。",
        "课程安排合理，教学内容丰富。建议可以增加一些小组讨论或案例分析环节，促进学生的主动学习和思考。",
        "老师教学经验丰富，能够将复杂问题简单化讲解。建议可以适当增加课堂互动，鼓励学生提问和讨论。",
        "课程设计科学，理论与实践结合较好。建议可以增加一些实际项目或实验环节，让学生有更多动手机会。"
    ];

    const gainBank = [
        "通过本课程的学习，我系统地掌握了相关知识体系，提高了分析问题和解决问题的能力。老师的教学方法生动有趣，激发了我的学习兴趣，培养了我的专业素养。感谢老师的辛勤付出和耐心指导！",
        "这门课程让我收获颇丰，不仅学习了专业知识，还培养了批判性思维和解决问题的能力。老师严谨的治学态度和生动的教学方式给我留下了深刻印象。",
        "学习本课程让我对专业领域有了更深入的理解，掌握了重要的理论和方法。老师的指导和帮助对我学习成长起到了重要作用。",
        "通过课程学习，我不仅掌握了专业知识，还学会了如何独立思考和解决问题。老师的启发式教学让我受益匪浅。",
        "本课程内容丰富，结构合理，让我对该领域有了全面的认识。老师教学认真，课堂讲解清晰，课后答疑及时。"
    ];

    // 添加样式
    GM_addStyle(`
        #gms-simple-eval-helper {
            position: fixed;
            top: 120px;
            right: 20px;
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 15px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: "Microsoft YaHei", Arial, sans-serif;
            min-width: 250px;
        }

        #gms-simple-eval-helper h3 {
            color: #4CAF50;
            margin: 0 0 10px 0;
            font-size: 16px;
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }

        .simple-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin: 8px 0;
            width: 100%;
            font-size: 14px;
            transition: background 0.3s;
            font-weight: bold;
        }

        .simple-btn:hover {
            background: #45a049;
        }

        .simple-checkbox {
            margin: 10px 0;
            display: flex;
            align-items: center;
            font-size: 13px;
        }

        .simple-checkbox input {
            margin-right: 8px;
        }

        .simple-status {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
            text-align: center;
            padding: 5px;
            background: #f5f5f5;
            border-radius: 4px;
        }

        .simple-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-family: "Microsoft YaHei", Arial, sans-serif;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `);

    // 初始化
    if (window.self === window.top) {
        // 只在顶层窗口初始化
        setTimeout(initMainPanel, 1000);
    }

    // 监听iframe加载
    document.addEventListener('readystatechange', function() {
        if (document.readyState === 'complete') {
            if (config.autoDetectAndFill) {
                setTimeout(checkAndAutoFill, 1500);
            }
        }
    });

    function initMainPanel() {
        console.log('初始化简化版控制面板...');

        // 移除可能已存在的面板
        const existingPanel = document.getElementById('gms-simple-eval-helper');
        if (existingPanel) existingPanel.remove();

        addControlPanel();
    }

    function addControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'gms-simple-eval-helper';

        panel.innerHTML = `
            <h3>评教助手</h3>
            <button id="fill-eval-btn" class="simple-btn">自动填充评价</button>
            <div class="simple-checkbox">
                <input type="checkbox" id="text-variation-cb" ${config.enableTextVariation ? 'checked' : ''}>
                <label for="text-variation-cb">评语随机变化</label>
            </div>
            <div class="simple-status">
                状态: <span id="status-text">就绪</span>
            </div>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('fill-eval-btn').addEventListener('click', fillEvaluation);

        document.getElementById('text-variation-cb').addEventListener('change', function() {
            config.enableTextVariation = this.checked;
            showNotification(`评语随机变化已${this.checked ? '开启' : '关闭'}`, 'info');
        });

        // 使面板可拖动
        makeDraggable(panel);

        console.log('简化版控制面板已添加');
    }

    function fillEvaluation() {
        updateStatus('正在填充...');

        // 查找并填充评价表单
        const filled = findAndFillEvaluation();

        if (filled) {
            updateStatus('填充完成');
            showNotification('评价已自动填充完成', 'success');
        } else {
            updateStatus('未找到评价表单');
            showNotification('请先点击"评价"按钮打开评价窗口', 'warning');
        }
    }

    function checkAndAutoFill() {
        // 自动检测并填充（如果有评价表单）
        const hasForm = checkForEvaluationForm();
        if (hasForm) {
            console.log('检测到评价表单，自动填充中...');
            fillEvaluation();
        }
    }

    function checkForEvaluationForm() {
        // 检查iframe中是否有评价表单
        const iframes = document.querySelectorAll('iframe');

        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframe = iframes[i];
                if (iframe.contentDocument) {
                    const radios = iframe.contentDocument.querySelectorAll('input[type="radio"]');
                    if (radios.length > 0) {
                        return true;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // 检查当前文档
        const radios = document.querySelectorAll('input[type="radio"]');
        return radios.length > 0;
    }

    function findAndFillEvaluation() {
        let filled = false;

        // 优先查找iframe中的评价表单
        const iframes = document.querySelectorAll('iframe');

        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframe = iframes[i];
                if (iframe.contentDocument) {
                    filled = fillEvaluationForm(iframe.contentDocument);
                    if (filled) return true;
                }
            } catch (e) {
                continue;
            }
        }

        // 在当前文档中查找
        filled = fillEvaluationForm(document);
        return filled;
    }

    function fillEvaluationForm(doc) {
        // 查找单选按钮
        const radios = doc.querySelectorAll('input[type="radio"]');
        if (radios.length === 0) return false;

        console.log(`找到 ${radios.length} 个单选按钮，全部选择${config.fixedScore}分`);

        // 按名称分组单选按钮
        const radioGroups = {};
        radios.forEach(radio => {
            if (!radio.name) return;
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = [];
            }
            radioGroups[radio.name].push(radio);
        });

        console.log(`找到 ${Object.keys(radioGroups).length} 组评分题目`);

        // 为每组选择最高分（10分）
        Object.keys(radioGroups).forEach(groupName => {
            const group = radioGroups[groupName];

            // 首先尝试找到10分的选项
            let targetRadio = group.find(radio => {
                const value = (radio.value || '').toString().trim();
                // 匹配10、10分、A（可能表示优秀）
                return value === '10' || value === '10分' || value === 'A' || value === '优秀';
            });

            // 如果没找到10分，找8分
            if (!targetRadio) {
                targetRadio = group.find(radio => {
                    const value = (radio.value || '').toString().trim();
                    return value === '8' || value === '8分' || value === 'B';
                });
            }

            // 如果还没找到，选择第一个
            if (!targetRadio && group.length > 0) {
                targetRadio = group[0];
            }

            if (targetRadio) {
                targetRadio.checked = true;
                targetRadio.click(); // 触发点击事件

                // 尝试找到对应的label并点击
                if (targetRadio.id) {
                    const label = doc.querySelector(`label[for="${targetRadio.id}"]`);
                    if (label) {
                        label.click();
                    }
                }
            }
        });

        // 填充文本框
        fillTextAreas(doc);

        return true;
    }

    function fillTextAreas(doc) {
        const textareas = doc.querySelectorAll('textarea');

        if (textareas.length === 0) {
            console.log('未找到文本框');
            return;
        }

        console.log(`找到 ${textareas.length} 个文本框`);

        textareas.forEach((textarea, index) => {
            // 获取文本框的上下文信息
            const label = findLabelForTextarea(textarea, doc);
            const labelText = label ? label.textContent.trim() : '';

            // 判断文本框类型
            let isSuggestion = false;
            let isGain = false;

            // 检查关键词
            const suggestionKeywords = ['建议', '意见', 'suggestion', 'advice', '不足', '改进'];
            const gainKeywords = ['收获', '心得', '体会', 'gain', 'harvest', '学习感受'];

            const combinedText = (textarea.id + textarea.name + labelText).toLowerCase();

            for (const keyword of suggestionKeywords) {
                if (combinedText.includes(keyword.toLowerCase())) {
                    isSuggestion = true;
                    break;
                }
            }

            for (const keyword of gainKeywords) {
                if (combinedText.includes(keyword.toLowerCase())) {
                    isGain = true;
                    break;
                }
            }

            // 如果无法判断，按顺序处理
            if (!isSuggestion && !isGain) {
                if (index === 0) isSuggestion = true;
                else if (index === 1) isGain = true;
            }

            // 生成评语
            let comment = '';

            if (isSuggestion) {
                const randomIndex = Math.floor(Math.random() * suggestionBank.length);
                comment = suggestionBank[randomIndex];
            } else if (isGain) {
                const randomIndex = Math.floor(Math.random() * gainBank.length);
                comment = gainBank[randomIndex];
            } else {
                comment = '无';
            }

            // 添加随机变化
            if (config.enableTextVariation && comment !== '无') {
                comment = addTextVariation(comment);
            }

            // 填充文本框
            textarea.value = comment;

            // 触发事件
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            console.log(`文本框 ${index + 1} (${isSuggestion ? '建议' : isGain ? '收获' : '其他'}): 已填充`);
        });
    }

    function addTextVariation(text) {
        // 20%的概率添加轻微变化
        if (Math.random() > 0.2) return text;

        const variations = [
            // 添加开头
            () => `总体而言，${text}`,
            () => `我认为，${text}`,

            // 添加结尾
            () => `${text}以上是我的一些个人看法。`,
            () => `${text}希望这些反馈有所帮助。`,

            // 轻微修改
            () => text.replace(/可以/g, '或许可以'),
            () => text.replace(/建议/g, '个人建议'),

            // 添加语气词
            () => text.replace(/。/g, '。').replace(/！/g, '！'),

            // 缩短或加长
            () => text.length > 100 ? text.substring(0, 150) + '...' : text + ' 总的来说非常满意。'
        ];

        const variationFunc = variations[Math.floor(Math.random() * variations.length)];
        return variationFunc();
    }

    function findLabelForTextarea(textarea, doc) {
        if (textarea.id) {
            const label = doc.querySelector(`label[for="${textarea.id}"]`);
            if (label) return label;
        }

        let prev = textarea.previousElementSibling;
        while (prev) {
            if (prev.tagName === 'LABEL') return prev;
            prev = prev.previousElementSibling;
        }

        const parent = textarea.parentElement;
        if (parent) {
            const label = parent.querySelector('label');
            if (label) return label;
        }

        return null;
    }

    function updateStatus(text) {
        const statusElem = document.getElementById('status-text');
        if (statusElem) {
            statusElem.textContent = text;
            statusElem.style.color =
                text === '就绪' ? '#666' :
                text.includes('完成') ? '#4CAF50' :
                text.includes('失败') ? '#f44336' : '#2196F3';
        }
    }

    function showNotification(message, type = 'info') {
        // 移除旧通知
        const oldNotice = document.querySelector('.simple-notification');
        if (oldNotice) oldNotice.remove();

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        const notice = document.createElement('div');
        notice.className = 'simple-notification';
        notice.style.background = colors[type] || colors.info;
        notice.textContent = message;
        document.body.appendChild(notice);

        setTimeout(() => {
            notice.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notice.parentNode) notice.parentNode.removeChild(notice);
            }, 300);
        }, 3000);
    }

    function makeDraggable(element) {
        let isDragging = false;
        let offsetX, offsetY;

        const header = element.querySelector('h3') || element;
        header.style.cursor = 'move';

        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        function startDrag(e) {
            isDragging = true;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            element.style.opacity = '0.8';
        }

        function drag(e) {
            if (!isDragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            element.style.right = 'auto';
            element.style.position = 'fixed';
        }

        function stopDrag() {
            isDragging = false;
            element.style.opacity = '1';
        }
    }
})();
