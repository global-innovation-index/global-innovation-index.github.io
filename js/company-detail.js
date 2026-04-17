/**
 * 企业详情页逻辑
 * 处理企业详情页的数据加载、参数解析和图表展示
 */

(function() {
    let companyData = null;
    let currentParams = {};
    let currentIndicator = null; // 当前选中的一级指标
    let indicatorDataCache = {}; // 缓存指标数据，避免重复加载
    let shouldZeroThirdLevelIndicators = false; // 是否将三级指标数据置0

    /**
     * 从URL获取参数
     * @returns {Object} 参数对象
     */
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const queryPairs = queryString.split('&');
        
        for (const pair of queryPairs) {
            const [key, value] = pair.split('=');
            if (key) {
                params[key] = decodeURIComponent(value || '');
            }
        }
        
        return params;
    }

    /**
     * 初始化页面参数
     */
    function initParams() {
        currentParams = getUrlParams();
        
        // 将currentParams设置为全局可访问，供industry-manager.js使用
        window.currentParams = currentParams;
        
        // 设置默认值
        if (!currentParams.year) currentParams.year = '2025';
        if (!currentParams.company) {
            showError('未指定企业名称');
            return false;
        }
        if (!currentParams.industry) {
            showError('未指定产业信息');
            return false;
        }
        
        return true;
    }

    /**
     * 显示加载状态
     */
    function showLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    /**
     * 隐藏加载状态
     */
    function hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    function showError(message) {
        const errorNotice = document.getElementById('errorNotice');
        const errorMessage = errorNotice.querySelector('.error-message');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorNotice) {
            errorNotice.style.display = 'flex';
        }
        
        hideLoading();
    }

    /**
     * 隐藏错误信息
     */
    function hideError() {
        const errorNotice = document.getElementById('errorNotice');
        if (errorNotice) {
            errorNotice.style.display = 'none';
        }
    }

    /**
     * 从global_enterprise_index.json获取企业的论文和专利数据
     * @param {string} companyName - 企业名称
     * @param {string} industry - 产业名称
     * @param {string} year - 年份
     * @returns {Promise<Object>} 包含论文数量和专利数量的数据对象
     */
    async function getCompanyInnovationData(companyName, industry, year) {
        try {
            // 加载创新指标数据
            const indicatorData = await window.dataLoader.loadJSON('json/global_enterprise_index.json');
            
            // 获取指定年份和产业的数据
            const yearData = indicatorData[year];
            if (!yearData) {
                console.warn(`未找到${year}年的创新指标数据`);
                return { paperCount: 0, patentCount: 0 };
            }
            
            const industryData = yearData[industry];
            if (!industryData || !Array.isArray(industryData)) {
                console.warn(`未找到${industry}产业的创新指标数据`);
                return { paperCount: 0, patentCount: 0 };
            }
            
            // 查找企业数据
            const companyInfo = industryData.find(item => 
                item['企业中文简称'] === companyName || 
                item['企业名称'] === companyName
            );
            
            if (!companyInfo) {
                console.warn(`未找到${companyName}的创新指标数据`);
                return { paperCount: 0, patentCount: 0 };
            }
            
            // 提取论文数量和专利数量
            let paperCount = 0;
            let patentCount = 0;
            
            // 获取论文数量：知识创新->知识创新产出->Web of Science论文数
            if (companyInfo['知识创新'] && 
                companyInfo['知识创新']['知识创新产出'] && 
                typeof companyInfo['知识创新']['知识创新产出']['Web of Science论文数'] !== 'undefined') {
                paperCount = Math.round(companyInfo['知识创新']['知识创新产出']['Web of Science论文数']);
            }
            
            // 获取专利数量：技术创新->技术创新产出->发明专利数
            if (companyInfo['技术创新'] && 
                companyInfo['技术创新']['技术创新产出'] && 
                typeof companyInfo['技术创新']['技术创新产出']['发明专利数'] !== 'undefined') {
                patentCount = Math.round(companyInfo['技术创新']['技术创新产出']['发明专利数']);
            }
            
            return { paperCount, patentCount };
        } catch (error) {
            console.error('获取企业创新指标数据失败:', error);
            return { paperCount: 0, patentCount: 0 };
        }
    }

    /**
     * 加载企业数据
     * @returns {Promise<Object>} 企业数据
     */
    async function loadCompanyData() {
        try {
            showLoading();
            hideError();
            
            // 获取论文和专利数据（始终尝试获取，不管排名数据是否存在）
            const innovationData = await getCompanyInnovationData(
                currentParams.company, 
                currentParams.industry, 
                currentParams.year
            );
            
            // 尝试加载产业排名数据
            let company = null;
            try {
                const industryData = await window.dataLoader.loadJSON('json/global_innovation_index_rankings.json');
                const yearData = industryData[currentParams.year];
                if (yearData) {
                    const industryDataForYear = yearData[currentParams.industry];
                    if (industryDataForYear) {
                        company = industryDataForYear.find(item => item[1] === currentParams.company);
                    }
                }
            } catch (error) {
                console.warn('加载产业排名数据失败:', error);
            }
            
            // 构造企业数据对象
            companyData = {
                rank: company ? company[0] : '--',
                name: currentParams.company,
                country: company ? company[2] : '--',
                totalScore: company ? company[3] : '0.00',
                knowledgeScore: company ? company[4] : '0.00',
                techScore: company ? company[5] : '0.00',
                collaborationScore: company ? company[6] : '0.00',
                companyPaperCount: innovationData.paperCount,
                companyPatentCount: innovationData.patentCount,
                industry: currentParams.industry,
                year: currentParams.year
            };
            
            // 论文和专利数量应该始终显示实际数据，不因为总得分或其他得分是0而置0
            // 只处理三级指标数据的置0逻辑
            const totalScore = parseFloat(companyData.totalScore || 0);
            const knowledgeScore = parseFloat(companyData.knowledgeScore || 0);
            const techScore = parseFloat(companyData.techScore || 0);
            const collaborationScore = parseFloat(companyData.collaborationScore || 0);
                      
            // 使用抽象相等比较，确保能正确处理字符串和数字的比较
            const isTotalScoreZero = totalScore == 0;
            const isKnowledgeScoreZero = knowledgeScore == 0;
            const isTechScoreZero = techScore == 0;
            const isCollaborationScoreZero = collaborationScore == 0;
                     
            const shouldZeroData = isTotalScoreZero && 
                                   isKnowledgeScoreZero && 
                                   isTechScoreZero && 
                                   isCollaborationScoreZero;
            
            
            // 只设置三级指标置0的标志，不影响论文和专利数量
            shouldZeroThirdLevelIndicators = shouldZeroData;
            
            return companyData;
        } catch (error) {
            console.error('加载企业数据失败:', error);
            showError(error.message || '数据加载失败');
            return null;
        } finally {
            hideLoading();
        }
    }

    /**
     * 显示企业基本信息
     */
    function displayCompanyInfo() {
        if (!companyData) return;
        
        document.getElementById('companyName').textContent = companyData.name;
        // document.getElementById('companyIndustry').textContent = companyData.industry;
        document.getElementById('companyCountry').textContent = companyData.country;
        document.getElementById('companyRank').textContent = companyData.rank;
        document.getElementById('companyPaperCount').textContent = companyData.companyPaperCount;
        document.getElementById('companyPatentCount').textContent = companyData.companyPatentCount;
        // document.getElementById('dataYear').textContent = companyData.year;
        
        // 检查元素是否存在，避免空指针错误
        updateScoreDisplay(companyData);
    }
    
    /**
     * 更新分数显示
     * @param {Object} data - 企业数据对象
     */
    function updateScoreDisplay(data) {
        
        // 更新总分数 - total-score的第一个div
        const totalScoreContainer = document.querySelector('.total-score');
        if (totalScoreContainer) {
            const firstDiv = totalScoreContainer.querySelector('div:first-child');
            if (firstDiv) {
                firstDiv.textContent = parseFloat(data.totalScore || 0).toFixed(2);
            }
        }
        
        // 更新知识创新分数 - index-score-1的第二个div
        const indexScore1Container = document.querySelector('.index-score-1');
        if (indexScore1Container) {
            const secondDiv = indexScore1Container.querySelector('div:last-child');
            if (secondDiv) {
                secondDiv.textContent = parseFloat(data.knowledgeScore || 0).toFixed(2);
            }
        }
        
        // 更新技术创新分数 - index-score-2的第二个div
        const indexScore2Container = document.querySelector('.index-score-2');
        if (indexScore2Container) {
            const secondDiv = indexScore2Container.querySelector('div:last-child');
            if (secondDiv) {
                secondDiv.textContent = parseFloat(data.techScore || 0).toFixed(2);
            }
        }
        
        // 更新创新协作分数 - index-score-3的第二个div
        const indexScore3Container = document.querySelector('.index-score-3');
        if (indexScore3Container) {
            const secondDiv = indexScore3Container.querySelector('div:last-child');
            if (secondDiv) {
                secondDiv.textContent = parseFloat(data.collaborationScore || 0).toFixed(2);
            }
        }
    }
    
    /**
     * 根据产业和年份获取并更新企业数据
     * @param {string} industry - 产业名称
     * @param {string} year - 年份
     */
    async function updateCompanyDataByIndustryAndYear(industry, year) {  
        try {
            // 确保参数类型正确
            const safeIndustry = String(industry || '');
            const safeYear = String(year || '');
            
            // 更新当前参数
            currentParams.industry = safeIndustry;
            currentParams.year = safeYear;
            
            // 加载产业排名数据
            const industryData = await window.dataLoader.loadJSON('json/global_innovation_index_rankings.json');
            
            // 查找指定企业的数据
            const yearData = industryData[safeYear];
            if (!yearData) {
                console.error(`未找到${safeYear}年的数据`);
                // 如果找不到年份数据，显示0分
                updateScoreDisplay({
                    totalScore: 0,
                    knowledgeScore: 0,
                    techScore: 0,
                    collaborationScore: 0
                });
                return;
            }
            
            const industryDataForYear = yearData[safeIndustry];
            if (!industryDataForYear) {
                console.error(`未找到${safeIndustry}产业的数据`);
                // 如果找不到产业数据，显示0分
                updateScoreDisplay({
                    totalScore: 0,
                    knowledgeScore: 0,
                    techScore: 0,
                    collaborationScore: 0
                });
                return;
            }
            
            // 查找企业
            // 首先获取最新的论文和专利数据
            const innovationData = await getCompanyInnovationData(
                currentParams.company, 
                safeIndustry, 
                safeYear
            );
            
            const company = industryDataForYear.find(item => item[1] === currentParams.company);
            if (!company) {
                console.error(`未找到${currentParams.company}的数据`);
                // 如果找不到企业，显示0分但更新论文和专利数量
                updateScoreDisplay({
                    totalScore: 0,
                    knowledgeScore: 0,
                    techScore: 0,
                    collaborationScore: 0
                });
                
                // 更新论文和专利数量的显示
                const paperCountElement = document.getElementById('company-paper-count');
                const patentCountElement = document.getElementById('company-patent-count');
                
                if (paperCountElement) {
                    paperCountElement.textContent = innovationData.paperCount;
                }
                
                if (patentCountElement) {
                    patentCountElement.textContent = innovationData.patentCount;
                }
                
                return;
            }
            
            // 构造企业数据对象 - 直接进行类型转换并设置默认值
            companyData = {
                rank: company[0],
                name: company[1],
                country: company[2],
                totalScore: parseFloat(company[3]) || 0, // 第四列数据 - 转换为数字
                knowledgeScore: parseFloat(company[4]) || 0, // 第五列数据 - 转换为数字
                techScore: parseFloat(company[5]) || 0, // 第六列数据 - 转换为数字
                collaborationScore: parseFloat(company[6]) || 0, // 第七列数据 - 转换为数字
                companyPaperCount: innovationData.paperCount,
                companyPatentCount: innovationData.patentCount,
                industry: safeIndustry,
                year: safeYear
            };
                        
            // 检查是否需要将三级指标数据置0
            // 条件：当前产业的总得分是0分，并且中间列的一级指标也是0.00分
            const totalScore = companyData.totalScore;
            const knowledgeScore = companyData.knowledgeScore;
            const techScore = companyData.techScore;
            const collaborationScore = companyData.collaborationScore;
                 
            // 使用更严格的条件判断
            const isTotalScoreZero = totalScore === 0 || totalScore === '0' || isNaN(totalScore);
            const isKnowledgeScoreZero = knowledgeScore === 0 || knowledgeScore === '0' || isNaN(knowledgeScore);
            const isTechScoreZero = techScore === 0 || techScore === '0' || isNaN(techScore);
            const isCollaborationScoreZero = collaborationScore === 0 || collaborationScore === '0' || isNaN(collaborationScore);
            
           shouldZeroThirdLevelIndicators = isTotalScoreZero && 
                                                isKnowledgeScoreZero && 
                                                isTechScoreZero && 
                                                isCollaborationScoreZero;
            
            
            // 如果需要将三级指标置0，同时将论文数量和专利数量也置为0
            if (shouldZeroThirdLevelIndicators) {               
                companyData.companyPaperCount = 0;
                companyData.companyPatentCount = 0;
             }
            
            // 更新显示
            updateScoreDisplay(companyData);
            // 更新论文和专利数量显示
            displayCompanyInfo();
            
            // 如果需要将三级指标置0，直接更新DOM元素确保显示为0
            if (shouldZeroThirdLevelIndicators) {
                // 直接更新DOM元素，确保显示为0
                const paperCountElement = document.getElementById('companyPaperCount');
                const patentCountElement = document.getElementById('companyPatentCount');
                
                if (paperCountElement) {
                    paperCountElement.textContent = '0';
                }
                
                if (patentCountElement) {
                    patentCountElement.textContent = '0';
                }
            }
            
            // 清除指标数据缓存并重新加载数据，确保一级指标更新
            const cacheKey = `${safeYear}_${currentParams.company}_${safeIndustry}`;
            delete indicatorDataCache[cacheKey];
            
            // 如果有选中的指标，重新加载指标数据并更新三级指标
            if (currentIndicator) {
                loadIndicatorData(safeYear, currentParams.company, safeIndustry)
                    .then(indicatorData => {
                        if (indicatorData) {
                            let indicatorName = '';
                            if (currentIndicator === 'knowledge') {
                                indicatorName = '知识创新';
                            } else if (currentIndicator === 'tech') {
                                indicatorName = '技术创新';
                            } else if (currentIndicator === 'collaboration') {
                                indicatorName = '创新协作';
                            }
                            
                            if (indicatorName) {
                                const thirdLevelIndicators = getThirdLevelIndicators(indicatorData, indicatorName, shouldZeroThirdLevelIndicators);
                                updateThirdLevelIndicators(thirdLevelIndicators);
                            }
                        }
                    });
            }
            
        } catch (error) {
            console.error('更新企业数据失败:', error);
            // 出错时显示0分
            updateScoreDisplay({
                totalScore: 0,
                knowledgeScore: 0,
                techScore: 0,
                collaborationScore: 0
            });
            
            // 出错时重置论文和专利数量
            const paperCountElement = document.getElementById('companyPaperCount');
            const patentCountElement = document.getElementById('companyPatentCount');
            
            if (paperCountElement) {
                paperCountElement.textContent = '0';
            }
            
            if (patentCountElement) {
                patentCountElement.textContent = '0';
            }
        }
    }


    /**
     * 初始化年份选择器
     */
    function initYearSelector() {
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.value = currentParams.year;
            
            yearSelect.addEventListener('change', async (e) => {
                currentParams.year = e.target.value;
                await loadCompanyData();
                displayCompanyInfo();
            });
        }
    }

    /**
 * 加载指标数据
 * @param {string} year - 年份
 * @param {string} company - 企业名称
 * @param {string} industry - 产业名称
 * @returns {Promise<Object>} 指标数据
 */
async function loadIndicatorData(year, company, industry) {
    try {
        // 如果没有提供参数，使用全局变量
        const currentYearValue = year || currentParams.year;
        const currentCompanyValue = company || currentParams.company;
        const currentIndustryValue = industry || currentParams.industry;
        
        const cacheKey = `${currentYearValue}_${currentCompanyValue}_${currentIndustryValue}`;
        // 检查缓存
        if (indicatorDataCache[cacheKey]) {
            return indicatorDataCache[cacheKey];
        }
        
        // 加载指标数据
        const allIndicatorData = await window.dataLoader.loadJSON('json/global_enterprise_index.json');
        
        // 从数据中提取特定企业的数据
        let companyData = null;
        
        // 处理生物产业命名不一致问题
        let industryData;
        if (allIndicatorData[currentYearValue] && allIndicatorData[currentYearValue][currentIndustryValue]) {
            industryData = allIndicatorData[currentYearValue][currentIndustryValue];
        } else if (currentIndustryValue === "生物产业" && allIndicatorData[currentYearValue] && allIndicatorData[currentYearValue]["生物"]) {
            industryData = allIndicatorData[currentYearValue]["生物"];
        } else if (currentIndustryValue === "生物" && allIndicatorData[currentYearValue] && allIndicatorData[currentYearValue]["生物产业"]) {
            industryData = allIndicatorData[currentYearValue]["生物产业"];
        }
        
        if (industryData) {
            // 查找匹配的企业数据，使用正确的字段名"企业中文简称"
            companyData = industryData.find(item => item.企业中文简称 === currentCompanyValue);
        }
                
        // 缓存数据
        indicatorDataCache[cacheKey] = companyData;
        return companyData;
    } catch (error) {
        console.error('加载指标数据失败:', error);
        return null;
    }
}

    /**
 * 更新右侧面板标题
 * @param {string} indicatorType - 指标类型：knowledge, tech, collaboration
 */
async function updateRightPanelTitles(indicatorType) {
    currentIndicator = indicatorType;
    
    // 获取右侧面板的h2标题元素
    const h2Elements = document.querySelectorAll('.company-score-panel .index-score h2');
    if (h2Elements.length === 0) return;
    
    // 定义指标映射关系
    const indicatorMap = {
        knowledge: '知识创新',
        tech: '技术创新',
        collaboration: '创新协作'
    };
    
    // 定义子指标映射关系
    const subIndicatorMap = {
        knowledge: ['知识创新产出', '知识创新影响', '知识创新扩散'],
        tech: ['技术创新产出', '技术创新质量', '技术创新影响'],
        collaboration: ['创新主体规模', '创新主体地位', '创新协作水平']
    };
    
    // 更新h2标题
    const subIndicators = subIndicatorMap[indicatorType] || [];
    h2Elements.forEach((h2, index) => {
        if (index < subIndicators.length) {
            h2.textContent = subIndicators[index];
        }
    });
    
    // 添加高亮样式到当前点击的指标
    const indicators = document.querySelectorAll('.index-score-1, .index-score-2, .index-score-3');
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
    });
    
    // 为当前点击的指标添加active类
    const indicatorClassMap = {
        knowledge: '.index-score-1',
        tech: '.index-score-2',
        collaboration: '.index-score-3'
    };
    
    const activeIndicator = document.querySelector(indicatorClassMap[indicatorType]);
    if (activeIndicator) {
        activeIndicator.classList.add('active');
    }
}

/**
 * 获取并格式化三级指标数据
 * @param {Object} companyData - 企业数据
 * @param {string} indicatorName - 一级指标名称
 * @returns {Array} 格式化后的三级指标数组
 */
function getThirdLevelIndicators(companyData, indicatorName, shouldZeroValues = false) {
    const result = [];
    
    // 严格的数据验证
    if (!companyData || typeof companyData !== 'object') {
        console.warn(`企业数据无效:`, companyData);
        return result;
    }
    
    if (!indicatorName || typeof companyData[indicatorName] === 'undefined') {
        console.warn(`未找到 ${indicatorName} 的数据`);
        return result;
    }
    
    // 获取指定一级指标下的二级指标
    const secondLevelIndicators = companyData[indicatorName];
    
    // 确保二级指标是对象类型
    if (typeof secondLevelIndicators !== 'object' || secondLevelIndicators === null) {
        console.warn(`${indicatorName} 下的二级指标数据格式错误:`, secondLevelIndicators);
        return result;
    }
    
    
    // 遍历所有二级指标，收集三级指标
    for (const [secondLevelName, thirdLevelData] of Object.entries(secondLevelIndicators)) {
        
        // 确保三级指标数据是对象类型
        if (typeof thirdLevelData !== 'object' || thirdLevelData === null) {
            console.warn(`二级指标 ${secondLevelName} 下的三级指标数据格式错误`);
            continue;
        }
        
        // 遍历每个二级指标下的三级指标
        for (const [thirdLevelName, value] of Object.entries(thirdLevelData)) {
            // 只添加有效的指标
            if (thirdLevelName && typeof value !== 'undefined') {
                // 如果shouldZeroValues为true，将所有指标值置0
                const displayValue = shouldZeroValues ? 0 : value;
                result.push({
                    name: thirdLevelName,
                    value: displayValue,
                    secondLevelName: secondLevelName,
                    firstLevelName: indicatorName // 添加一级指标名称，便于后续验证
                });
            }
        }
    }
    
    return result;
}

/**
 * 更新三级指标显示
 * @param {Array} indicators - 三级指标数据数组
 */
function updateThirdLevelIndicators(indicators) {
    // 添加数据验证
    if (!Array.isArray(indicators)) {
        console.error('传入的指标数据不是数组:', indicators);
        return;
    }
    
    
    // 先隐藏所有三级指标容器并清除内容
    const allContainerTypes = ['produce', 'impact', 'diffusion'];
    const allContainers = [];
    
    // 更有效的容器查找方式
    for (const type of allContainerTypes) {
        for (let i = 1; i <= 4; i++) {
            const container = document.querySelector(`.${type}-content-${i}`);
            if (container) {
                // 强制隐藏容器和其中的所有元素
                container.style.display = 'none';
                allContainers.push(container);
                
                // 更彻底地隐藏容器中的所有img元素
                const images = container.querySelectorAll('img');
                images.forEach(img => {
                    img.style.display = 'none';
                    img.style.visibility = 'hidden'; // 额外确保图片不可见
                });
                
                // 根据容器类型清除对应内容
                if (type === 'produce') {
                    // produce-content清除div内容但保留结构
                    const divs = container.querySelectorAll('div');
                    divs.forEach(div => {
                        div.textContent = '';
                    });
                } else if (type === 'impact' || type === 'diffusion') {
                    // impact-content和diffusion-content清除text-container内的div内容
                    const textContainer = container.querySelector('.text-container');
                    if (textContainer) {
                        const divs = textContainer.querySelectorAll('div');
                        divs.forEach(div => {
                            div.textContent = '';
                        });
                    }
                }
            }
        }
    }
    
    
    // 数据过滤：移除无效指标
    const validIndicators = indicators.filter(indicator => {
        return indicator && 
               typeof indicator.name === 'string' && 
               indicator.name.trim() !== '' &&
               typeof indicator.value !== 'undefined';
    });
    
    
    // 按二级指标分组显示
    const groupedIndicators = validIndicators.reduce((groups, indicator) => {
        if (!indicator.secondLevelName) {
            console.warn('指标缺少二级指标名称:', indicator);
            return groups;
        }
        
        if (!groups[indicator.secondLevelName]) {
            groups[indicator.secondLevelName] = [];
        }
        groups[indicator.secondLevelName].push(indicator);
        return groups;
    }, {});
    
    
    // 定义二级指标到容器类型的映射
    const containerTypeMap = {
        '知识创新产出': 'produce',
        '知识创新影响': 'impact',
        '知识创新扩散': 'diffusion',
        '技术创新产出': 'produce',
        '技术创新质量': 'impact',
        '技术创新影响': 'diffusion',
        '创新主体规模': 'produce',
        '创新主体地位': 'impact',
        '创新协作水平': 'diffusion'
    };
    
    // 更新每个二级指标下的三级指标
    Object.entries(groupedIndicators).forEach(([secondLevelName, secondLevelIndicators]) => {
        
        const containerType = containerTypeMap[secondLevelName];
        if (!containerType) {
            console.warn(`未找到二级指标 ${secondLevelName} 的容器类型映射`);
            return;
        }
        
        
        // 处理impact-content特殊逻辑：根据指标数量决定显示的容器数量
        const maxContainersToShow = containerType === 'impact' ? secondLevelIndicators.length : 4;
        
        // 获取对应的容器并更新
        secondLevelIndicators.forEach((indicator, index) => {
            // 如果是impact-container且索引超过指标数量，跳过
            if (containerType === 'impact' && index >= maxContainersToShow) {
                return;
            }
            
            const containerSelector = `.${containerType}-content-${index + 1}`;
            
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.warn(`未找到容器: ${containerSelector}`);
                return;
            }
            
            // 验证指标数据
            if (!indicator.name || typeof indicator.value === 'undefined') {
                console.warn(`指标数据不完整:`, indicator);
                return;
            }
                        
            let updateSuccess = false;
            
            try {
                // 根据容器类型使用不同的更新逻辑
                if (containerType === 'produce') {
                    // produce-content直接使用容器内的前两个div元素
                    const divs = container.querySelectorAll('div');
                    if (divs.length >= 2) {
                        divs[0].textContent = indicator.name;
                        divs[1].textContent = indicator.value;
                        updateSuccess = true;
                    } else {
                        console.warn(`容器 ${containerSelector} 中没有足够的div元素，找到: ${divs.length}个`);
                    }
                } else if (containerType === 'impact' || containerType === 'diffusion') {
                    // impact-content和diffusion-content需要更新text-container内的div元素
                    const textContainer = container.querySelector('.text-container');
                    if (!textContainer) {
                        console.warn(`容器 ${containerSelector} 中未找到text-container元素`);
                        return;
                    }
                    
                    const divs = textContainer.querySelectorAll('div');
                    if (divs.length >= 2) {
                        // 根据容器类型设置不同的div顺序（diffusion-content是值在前，名称在后）
                        if (containerType === 'diffusion') {
                            divs[0].textContent = indicator.value;
                            divs[1].textContent = indicator.name;
                        } else {
                            divs[0].textContent = indicator.name;
                            divs[1].textContent = indicator.value;
                        }
                        updateSuccess = true;
                    } else {
                        console.warn(`text-container ${containerSelector} 中没有足够的div元素，找到: ${divs.length}个`);
                    }
                } else {
                    console.warn(`未知的容器类型: ${containerType}`);
                }
                
                // 如果更新成功，显示容器和其中的img元素
                if (updateSuccess) {
                    container.style.display = 'block';
                    // 更彻底地显示容器中的所有img元素
                    const images = container.querySelectorAll('img');
                    images.forEach(img => {
                        img.style.display = 'block';
                        img.style.visibility = 'visible'; // 确保图片可见
                    });
                }
            } catch (error) {
                console.error(`更新容器 ${containerSelector} 时出错:`, error);
            }
        });
    });
}

    /**
 * 初始化一级指标点击事件
 */
async function initIndicatorClickEvents() {
    // 获取一级指标元素
    const knowledgeIndicator = document.querySelector('.index-score-1');
    const techIndicator = document.querySelector('.index-score-2');
    const collaborationIndicator = document.querySelector('.index-score-3');
    
    // 定义移除所有指标active类的函数
    function removeAllActiveClasses() {
        if (knowledgeIndicator) knowledgeIndicator.classList.remove('active');
        if (techIndicator) techIndicator.classList.remove('active');
        if (collaborationIndicator) collaborationIndicator.classList.remove('active');
    }
    
    // 为每个指标添加点击事件
    if (knowledgeIndicator) {
        knowledgeIndicator.addEventListener('click', async () => {
            removeAllActiveClasses();
            knowledgeIndicator.classList.add('active');
            
            currentIndicator = 'knowledge';
            await updateRightPanelTitles(currentIndicator);
            
            // 加载并更新三级指标数据
            const indicatorData = await loadIndicatorData();
            if (indicatorData) {
                const thirdLevelIndicators = getThirdLevelIndicators(indicatorData, '知识创新', shouldZeroThirdLevelIndicators);
                updateThirdLevelIndicators(thirdLevelIndicators);
            }
        });
    }
    
    if (techIndicator) {
        techIndicator.addEventListener('click', async () => {
            removeAllActiveClasses();
            techIndicator.classList.add('active');
            
            currentIndicator = 'tech';
            await updateRightPanelTitles(currentIndicator);
            
            // 加载并更新三级指标数据
            const indicatorData = await loadIndicatorData();
            if (indicatorData) {
                const thirdLevelIndicators = getThirdLevelIndicators(indicatorData, '技术创新', shouldZeroThirdLevelIndicators);
                updateThirdLevelIndicators(thirdLevelIndicators);
            }
        });
    }
    
    if (collaborationIndicator) {
        collaborationIndicator.addEventListener('click', async () => {
            removeAllActiveClasses();
            collaborationIndicator.classList.add('active');
            
            currentIndicator = 'collaboration';
            await updateRightPanelTitles(currentIndicator);
            
            // 加载并更新三级指标数据
            const indicatorData = await loadIndicatorData();
            if (indicatorData) {
                const thirdLevelIndicators = getThirdLevelIndicators(indicatorData, '创新协作', shouldZeroThirdLevelIndicators);
                updateThirdLevelIndicators(thirdLevelIndicators);
            }
        });
    }
    
    // 默认选中第一个指标并加载数据
    if (knowledgeIndicator) {
        removeAllActiveClasses();
        knowledgeIndicator.classList.add('active');
        knowledgeIndicator.click();
    }
}

    /**
     * 初始化年份选择器
     */
    function initYearSelector() {
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.value = currentParams.year;
            
            yearSelect.addEventListener('change', async (e) => {
                currentParams.year = e.target.value;
                await loadCompanyData();
                displayCompanyInfo();
                // await createScoreTrendChart();
                await loadIndicatorData(); // 预加载新年份的数据
                
                // 无论之前是否有选中的指标，都默认激活知识创新指标
                const knowledgeIndicator = document.querySelector('.index-score-1');
                if (knowledgeIndicator && typeof knowledgeIndicator.click === 'function') {
                    knowledgeIndicator.click();
                }
            });
        }
    }

    /**
     * 初始化页面
     */
    async function initPage() {
        // 初始化参数
        const paramsValid = initParams();
        if (!paramsValid) return;
        
        // 初始化年份选择器
        initYearSelector();
        
        // 初始化一级指标点击事件
        initIndicatorClickEvents();
        
        // 添加产业变化监听
        document.addEventListener('industryChanged', async (event) => {
            const { industry, year } = event.detail;
            currentParams.industry = industry;
            if (year) {
                currentParams.year = year;
            }
            // 调用updateCompanyDataByIndustryAndYear来更新分数显示
            updateCompanyDataByIndustryAndYear(industry, currentParams.year);
                      
            // 如果有选中的指标，重新加载指标数据并更新标题和三级指标数据
            if (currentIndicator) {
                const indicatorData = await loadIndicatorData(); // 预加载新数据
                updateRightPanelTitles(currentIndicator);
                
                // 根据当前选中的指标重新获取并更新三级指标数据
                let indicatorName = '';
                if (currentIndicator === 'knowledge') {
                    indicatorName = '知识创新';
                } else if (currentIndicator === 'tech') {
                    indicatorName = '技术创新';
                } else if (currentIndicator === 'collaboration') {
                    indicatorName = '创新协作';
                }
                
                if (indicatorName) {
                    const thirdLevelIndicators = getThirdLevelIndicators(indicatorData, indicatorName, shouldZeroThirdLevelIndicators);
                    updateThirdLevelIndicators(thirdLevelIndicators);
                }
            }
        });
        
        // 加载企业数据
        await loadCompanyData();
        
        // 加载指标数据
        await loadIndicatorData();
        
        // 显示企业信息
        displayCompanyInfo();
        
        // 初始化企业比较功能
        initCompanyCompare();
        
        // 默认选中知识创新指标
        updateRightPanelTitles('knowledge');
        
    }
    
    /**
     * 初始化企业比较功能
     */
    function initCompanyCompare() {
        const compareBtn = document.getElementById('compareBtn');
        const modal = document.getElementById('companySelectModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');
        const companySearch = document.getElementById('companySearch');
        const alphabetIndex = document.getElementById('alphabetIndex');
        const companyList = document.getElementById('companyList');
        
        let allCompanies = [];
        let filteredCompanies = [];
        let selectedCompany = null;
        let currentLetter = 'ALL';
        
        // 加载企业数据
        window.dataLoader.loadJSON('json/enterprise_total.json').then(data => {
            // 去重并按名称排序
            allCompanies = [...new Set(data.enterprises)].sort((a, b) => {
                return a.localeCompare(b);
            });
            filteredCompanies = [...allCompanies];
            
            // 渲染企业列表
            renderCompanyList();
        }).catch(error => {
            console.error('加载企业数据失败:', error);
        });
        
        // 筛选企业
        function filterCompanies() {
            const searchText = companySearch.value.toLowerCase();
            
            filteredCompanies = allCompanies.filter(company => {
                // 按搜索文本筛选
                if (searchText) {
                    return company.toLowerCase().includes(searchText);
                }
                return true;
            });
            
            renderCompanyList();
        }
        
        // 渲染企业列表
        function renderCompanyList() {
            companyList.innerHTML = '';
            
            filteredCompanies.forEach(company => {
                const item = document.createElement('div');
                item.className = 'company-item';
                item.textContent = company;
                item.dataset.company = company;
                
                item.addEventListener('click', () => {
                    // 移除其他选中项
                    companyList.querySelectorAll('.company-item').forEach(i => {
                        i.classList.remove('selected');
                    });
                    
                    // 添加选中状态
                    item.classList.add('selected');
                    selectedCompany = company;
                    confirmBtn.disabled = false;
                });
                
                companyList.appendChild(item);
            });
        }
        
        // 打开弹窗
        compareBtn.addEventListener('click', () => {
            // 重置状态
            selectedCompany = null;
            confirmBtn.disabled = true;
            companySearch.value = '';
            filterCompanies();
            // 显示弹窗
            modal.style.display = 'flex';
        });
        
        // 关闭弹窗
        function closeModal() {
            modal.style.display = 'none';
            // 重置状态
            selectedCompany = null;
            confirmBtn.disabled = true;
            companySearch.value = '';
            filterCompanies();
        }
        
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 点击弹窗外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 搜索框事件
        companySearch.addEventListener('input', filterCompanies);
        
        // 检查企业在当前年份是否有数据
        async function checkCompanyData(companyName, year) {
            try {
                // 加载创新指标数据
                const indicatorData = await window.dataLoader.loadJSON('json/global_enterprise_index.json');
                
                // 获取指定年份的数据
                const yearData = indicatorData[year];
                if (!yearData) {
                    return false;
                }
                
                // 遍历所有产业查找企业
                for (const industry in yearData) {
                    const industryData = yearData[industry];
                    if (industryData && Array.isArray(industryData)) {
                        const companyInfo = industryData.find(item => 
                            item['企业中文简称'] === companyName || 
                            item['企业名称'] === companyName
                        );
                        if (companyInfo) {
                            return true;
                        }
                    }
                }
                
                return false;
            } catch (error) {
                console.error('检查企业数据失败:', error);
                return false;
            }
        }
        
        // 确定按钮事件
        confirmBtn.addEventListener('click', async () => {
            if (selectedCompany) {
                // 检查是否选择了同一个企业
                if (selectedCompany === currentParams.company) {
                    alert('不能选择同一个企业');
                    return;
                }
                
                // 检查选中的企业在当前年份是否有数据
                const hasData = await checkCompanyData(selectedCompany, currentParams.year);
                if (!hasData) {
                    alert('该企业当前年度无数据，请重新选择。');
                    return;
                }
                
                // 构造跳转URL
                const url = `company-compare.html?year=${currentParams.year}&industry=${encodeURIComponent(currentParams.industry)}&company1=${encodeURIComponent(currentParams.company)}&company2=${encodeURIComponent(selectedCompany)}`;
                window.open(url,'_blank');
                // 关闭弹窗
                closeModal();
            }
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }
    
    // 移除重复的事件监听器，事件处理已在initPage函数中完成
})();
