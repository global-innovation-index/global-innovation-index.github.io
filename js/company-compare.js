// 企业对比页面JavaScript

// 全局变量
let globalData = {}; // 存储全球企业创新指数数据
let globalRankingData = {}; // 存储全球企业创新指数排名数据
let currentYear = '2025'; // 当前年份
let currentIndustry = '未来信息'; // 当前产业
let company1 = {}; // 第一个企业数据
let company2 = {}; // 第二个企业数据
let selectedCompanyIndex = 1; // 当前正在选择的企业索引（1或2）
let industryRankChart1 = null; // 左侧企业产业排名图表
let industryRankChart2 = null; // 右侧企业产业排名图表

// 产业列表（将从JSON文件动态加载）
let industries = [];

// 一级指标列表
const primaryMetrics = ['知识创新', '技术创新', '创新协作'];

// 从JSON文件获取产业列表
function getIndustryList(year) {
    return fetch('json/industry-total.json')
        .then(response => response.json())
        .then(data => {
            return data[year] || data["2025"] || ['未来信息', '生物医药', '新材料', '高端装备', '新能源', '节能环保'];
        })
        .catch(error => {
            console.error('加载产业列表失败:', error);
            // 加载失败时返回默认产业列表
            return ['未来信息', '生物医药', '新材料', '高端装备', '新能源', '节能环保'];
        });
}

// 初始化页面
function initPage() {
    // 从URL获取参数
    const urlParams = new URLSearchParams(window.location.search);
    currentYear = urlParams.get('year') || '2025';
    currentIndustry = urlParams.get('industry') || '未来信息';
    const company1Name = urlParams.get('company1');
    const company2Name = urlParams.get('company2');
    
    // 设置年份选择器
    document.getElementById('yearSelect').value = currentYear;
    
    // 加载数据
    Promise.all([loadEnterpriseData(), loadGlobalRankingData(), getIndustryList(currentYear)])
        .then(([_, __, industryList]) => {
            industries = industryList;
            
            // 初始化产业按钮（无论是否有企业参数）
            initIndustryButtons();
            
            // 初始化企业数据
            if (company1Name && company2Name) {
                company1 = findCompanyByName(company1Name);
                company2 = findCompanyByName(company2Name);
                
                // 更新页面显示
                updateCompanyInfo();
                updateCompanyStats();
                initCharts();
                updateMetricTables();
            }
        });
    
    // 绑定事件
    bindEvents();
}

// 加载企业数据
async function loadEnterpriseData() {
    try {
        const response = await fetch('json/global_enterprise_index.json');
        globalData = await response.json();
        console.log('企业数据加载成功');
    } catch (error) {
        console.error('企业数据加载失败:', error);
    }
}

// 加载全球企业创新指数排名数据
async function loadGlobalRankingData() {
    try {
        const response = await fetch('json/global_innovation_index_rankings.json');
        globalRankingData = await response.json();
        console.log('全球企业创新指数排名数据加载成功');
    } catch (error) {
        console.error('全球企业创新指数排名数据加载失败:', error);
    }
}

// 根据企业名称查找企业数据
function findCompanyByName(companyName) {
    if (!globalData[currentYear]) return {};
    
    // 遍历所有产业查找企业
    for (const industry of industries) {
        if (globalData[currentYear][industry]) {
            for (const company of globalData[currentYear][industry]) {
                if (company['企业中文简称'] === companyName) {
                    return company;
                }
            }
        }
    }
    return {};
}

// 更新企业信息
function updateCompanyInfo() {
    document.getElementById('company1Name').textContent = company1['企业中文简称'] || '企业1';
    document.getElementById('company1Country').textContent = company1['国家'] || '国家1';
    document.getElementById('company2Name').textContent = company2['企业中文简称'] || '企业2';
    document.getElementById('company2Country').textContent = company2['国家'] || '国家2';
}

// 更新企业统计数据
function updateCompanyStats() {
    // 假设专利和论文数据在知识创新下
    const company1Patents = company1['知识创新']?.['专利申请量(件)'] || 0;
    const company1Papers = company1['知识创新']?.['论文发表量(篇)'] || 0;
    const company2Patents = company2['知识创新']?.['专利申请量(件)'] || 0;
    const company2Papers = company2['知识创新']?.['论文发表量(篇)'] || 0;
    
    // 添加DOM元素存在性检查
    const company1PatentsElement = document.getElementById('company1Patents');
    const company1PapersElement = document.getElementById('company1Papers');
    const company2PatentsElement = document.getElementById('company2Patents');
    const company2PapersElement = document.getElementById('company2Papers');
    
    if (company1PatentsElement) company1PatentsElement.textContent = company1Patents;
    if (company1PapersElement) company1PapersElement.textContent = company1Papers;
    if (company2PatentsElement) company2PatentsElement.textContent = company2Patents;
    if (company2PapersElement) company2PapersElement.textContent = company2Papers;
}

// 初始化产业按钮
function initIndustryButtons() {
    return getIndustryList(currentYear).then(industryList => {
        industries = industryList;
        
        // 如果当前产业不在当年产业列表中，使用第一个产业作为默认
        if (industries.indexOf(currentIndustry) === -1) {
            currentIndustry = industries[0];
        }
        
        const industryButtonsContainer = document.getElementById('industryButtons');
        industryButtonsContainer.innerHTML = '';
        
        industries.forEach(industry => {
            const button = document.createElement('button');
            button.className = `industry-btn ${industry === currentIndustry ? 'active' : ''}`;
            button.textContent = industry;
            button.addEventListener('click', () => {
                // 更新当前产业
                currentIndustry = industry;
                
                // 更新按钮状态
                document.querySelectorAll('.industry-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // 更新企业数据（如果企业在该产业中有数据）
                const updatedCompany1 = findCompanyByName(company1['企业中文简称']);
                const updatedCompany2 = findCompanyByName(company2['企业中文简称']);
                
                if (updatedCompany1) company1 = updatedCompany1;
                if (updatedCompany2) company2 = updatedCompany2;
                
                // 更新页面数据
                updateCompanyStats();
                updateCharts();
                updateMetricTables();
            });
            industryButtonsContainer.appendChild(button);
        });
        
        return industryList;
    });
}

// 初始化图表
function initCharts() {
    // 左侧企业图表（倒置坐标轴）
    industryRankChart1 = echarts.init(document.getElementById('industryRankChart1'));
    // 右侧企业图表（倒置坐标轴）
    industryRankChart2 = echarts.init(document.getElementById('industryRankChart2'));
    
    updateCharts();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        industryRankChart1.resize();
        industryRankChart2.resize();
    });
}

// 更新图表
function updateCharts() {
    // 准备左侧企业数据
    const company1Data = prepareIndustryData(company1);
    // 准备右侧企业数据
    const company2Data = prepareIndustryData(company2);
    
    // 左侧企业图表配置
    const option1 = {
        title: {
            text: '企业创新指数分数',
            textStyle: {
                color: "#e6f7ff",
                fontSize: 14
            },
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            textStyle: {
                fontSize: 10 // 字体小一点
            }
        },
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '22%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            inverse: true, // 倒置坐标轴
            splitLine: {
                show: false  // 隐藏纵向网格线
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: "#e6f7ff",
                fontSize: 10, // 字体小一点
                interval: 0,
                rotate: 0
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            }
        },
        yAxis: {
            type: 'category',
            data: company1Data.names,
            position: 'right',
            axisTick: {
                show: false
            },
            axisLabel: {
                color: "#e6f7ff",
                fontSize: 10, // 字体小一点
                interval: 0,
                rotate: 0
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            }
        },
        series: [{
            name: company1['企业中文简称'] || '企业1',
            type: 'bar',
            data: company1Data.values,
            itemStyle: {
                color: '#2f89cf'
            },
            label: {
                show: true,
                position: 'left',
                color: "#e6f7ff",
                fontSize: 10, // 字体小一点
                formatter: '{c}'
            },
            barCategoryGap: '50%' // 增加柱状之间的间距
        }]
    };
    
    // 右侧企业图表配置
    const option2 = {
        title: {
            text: '企业创新指数分数',
            textStyle: {
                color: "#e6f7ff",
                fontSize: 14
            },
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            textStyle: {
                fontSize: 10 // 字体小一点
            }
        },
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '22%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            splitLine: {
                show: false  // 隐藏纵向网格线
            },
            axisTick: {
                show: false // 隐藏横向刻度线
            },
            axisLabel: {
                color: "#e6f7ff",
                fontSize: 10 // 字体小一点
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            }
        },
        yAxis: {
            type: 'category',
            data: company2Data.names,
            axisTick: {
                show: false
            },
            axisLabel: {
                color: "#e6f7ff",
                fontSize: 10, // 字体小一点
                interval: 0,
                rotate: 0
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            }
        },
        series: [{
            name: company2['企业中文简称'] || '企业2',
            type: 'bar',
            data: company2Data.values,
            itemStyle: {
                color: '#ff6b6b'
            },
            label: {
                show: true,
                position: 'right',
                color: "#e6f7ff",
                fontSize: 10, // 字体小一点
                formatter: '{c}'
            },
            barCategoryGap: '50%' // 增加柱状之间的间距
        }]
    };
    
    // 应用图表配置
    industryRankChart1.setOption(option1);
    industryRankChart2.setOption(option2);
}

// 准备产业数据
function prepareIndustryData(company) {
    const data = {
        names: [],
        values: []
    };
    
    // 从globalRankingData中获取企业在各产业的分数
    if (company && globalRankingData[currentYear]) {
        // 遍历所有产业
        for (const industry in globalRankingData[currentYear]) {
            let found = false;
            const industryData = globalRankingData[currentYear][industry];
            // 查找该企业在当前产业中的数据
            for (const companyData of industryData) {
                if (companyData[1] === company['企业中文简称']) {
                    // 使用第一个数值作为分数
                    const score = companyData[3]; // 第一个数值在数组的第三个位置（索引为2）
                    data.names.push(industry);
                    data.values.push(score);
                    found = true;
                    break;
                }
            }
            // 如果企业在当前产业中没有数据，添加默认值0
            if (!found) {
                data.names.push(industry);
                data.values.push(0);
            }
        }
    }
    
    return data;
}

// 在特定产业中查找企业
function findCompanyInIndustry(companyName, industry) {
    if (!globalData[currentYear] || !globalData[currentYear][industry]) return null;
    
    for (const company of globalData[currentYear][industry]) {
        if (company['企业中文简称'] === companyName) {
            return company;
        }
    }
    return null;
}

// 更新指标表格
function updateMetricTables() {
    const selectedMetric = document.querySelector('.metric-btn.active').dataset.metric;
    
    // 更新左侧企业表格
    updateMetricTable('company1MetricTable', company1['企业中文简称'], selectedMetric);
    // 更新右侧企业表格
    updateMetricTable('company2MetricTable', company2['企业中文简称'], selectedMetric);
}

// 更新单个指标表格
function updateMetricTable(tableId, companyName, metric) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    tableBody.innerHTML = '';
    
    // 根据年份、产业、企业名称和一级指标查询数据
    if (globalData[currentYear] && globalData[currentYear][currentIndustry]) {
        const companies = globalData[currentYear][currentIndustry];
        const company = companies.find(c => c['企业中文简称'] === companyName);
        
        if (company && company[metric]) {
            // 遍历二级指标
            for (const [secondaryKey, secondaryValue] of Object.entries(company[metric])) {
                // 遍历三级指标
                for (const [tertiaryKey, tertiaryValue] of Object.entries(secondaryValue)) {
                    // 跳过非数值类型的指标
                    if (typeof tertiaryValue === 'number') {
                        const row = document.createElement('tr');
                        const nameCell = document.createElement('td');
                        const valueCell = document.createElement('td');
                        
                        nameCell.textContent = tertiaryKey;
                        valueCell.textContent = tertiaryValue;
                        
                        row.appendChild(nameCell);
                        row.appendChild(valueCell);
                        tableBody.appendChild(row);
                    }
                }
            }
        } else {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.textContent = '暂无数据';
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    } else {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = '暂无数据';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

// 绑定事件
function bindEvents() {
    // 年份选择事件
    document.getElementById('yearSelect').addEventListener('change', function() {
        currentYear = this.value;
        // 重新加载数据
        Promise.all([loadEnterpriseData(), loadGlobalRankingData()])
            .then(() => {
                // 更新产业按钮并等待完成
                return initIndustryButtons();
            })
            .then(() => {
                // 更新企业数据
                company1 = findCompanyByName(company1['企业中文简称']);
                company2 = findCompanyByName(company2['企业中文简称']);
                
                // 确保默认激活"知识创新"按钮
                document.querySelectorAll('.metric-btn').forEach(btn => btn.classList.remove('active'));
                const knowledgeInnovationBtn = document.querySelector('.metric-btn[data-metric="知识创新"]');
                if (knowledgeInnovationBtn) {
                    knowledgeInnovationBtn.classList.add('active');
                }
                
                // 更新页面显示
                updateCompanyStats();
                updateCharts();
                updateMetricTables();
            });
    });
    
    // 一级指标按钮点击事件
    document.querySelectorAll('.metric-btn').forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.metric-btn').forEach(btn => btn.classList.remove('active'));
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            // 更新指标表格
            updateMetricTables();
        });
    });
    
    // 切换企业按钮事件
    document.getElementById('switchCompany1Btn').addEventListener('click', () => {
        selectedCompanyIndex = 1;
        openCompanyModal();
    });
    
    document.getElementById('switchCompany2Btn').addEventListener('click', () => {
        selectedCompanyIndex = 2;
        openCompanyModal();
    });
    
    // 企业选择弹窗事件
    bindModalEvents();
}

// 绑定弹窗事件
function bindModalEvents() {
    const modal = document.getElementById('companyModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const companySearch = document.getElementById('companySearch');
    const companyList = document.getElementById('companyList');
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 搜索事件
    companySearch.addEventListener('input', () => {
        const searchTerm = companySearch.value.toLowerCase();
        filterCompanies(searchTerm);
    });
    
    // 检查企业在当前年份是否有数据
    function checkCompanyData(companyName, year) {
        try {
            // 检查globalData中是否有该企业的数据
            if (globalData[year]) {
                for (const industry in globalData[year]) {
                    const industryData = globalData[year][industry];
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
            }
            return false;
        } catch (error) {
            console.error('检查企业数据失败:', error);
            return false;
        }
    }
    
    // 确认按钮事件
    confirmBtn.addEventListener('click', () => {
        const selectedCompany = document.querySelector('.modal-company-item.selected');
        if (selectedCompany) {
            const companyName = selectedCompany.dataset.name;
            
            // 检查企业在当前年份是否有数据
            const hasData = checkCompanyData(companyName, currentYear);
            if (!hasData) {
                alert('该企业当前年度无数据，请重新选择。');
                return;
            }
            
            const companyData = findCompanyByName(companyName);
            
            // 检查是否选择了同一个企业
            if (selectedCompanyIndex === 1) {
                if (companyName === company2['企业中文简称']) {
                    alert('不能选择同一个企业');
                    return;
                }
                company1 = companyData;
            } else {
                if (companyName === company1['企业中文简称']) {
                    alert('不能选择同一个企业');
                    return;
                }
                company2 = companyData;
            }
            
            // 更新页面显示
            updateCompanyInfo();
            updateCompanyStats();
            updateCharts();
            updateMetricTables();
            
            // 关闭弹窗
            closeModal();
        }
    });
}

// 打开企业选择弹窗
function openCompanyModal() {
    const modal = document.getElementById('companyModal');
    const companyList = document.getElementById('companyList');
    
    // 加载企业列表
    loadCompanyList();
    
    // 显示弹窗
    modal.style.display = 'flex';
}

// 关闭企业选择弹窗
function closeModal() {
    const modal = document.getElementById('companyModal');
    modal.style.display = 'none';
    
    // 重置搜索框
    document.getElementById('companySearch').value = '';
    
    // 重置确认按钮状态
    document.getElementById('confirmBtn').disabled = true;
}

// 加载企业列表
function loadCompanyList() {
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = '';
    
    // 收集所有企业
    const allCompanies = new Set();
    
    if (globalData[currentYear]) {
        for (const industry of industries) {
            if (globalData[currentYear][industry]) {
                for (const company of globalData[currentYear][industry]) {
                    allCompanies.add(company['企业中文简称']);
                }
            }
        }
    }
    
    // 显示企业列表
    allCompanies.forEach(companyName => {
        const companyItem = document.createElement('div');
        companyItem.className = 'modal-company-item';
        companyItem.dataset.name = companyName;
        companyItem.textContent = companyName;
        
        // 点击选择企业
        companyItem.addEventListener('click', () => {
            // 移除其他选择
            document.querySelectorAll('.modal-company-item').forEach(item => {
                item.classList.remove('selected');
            });
            // 添加当前选择
            companyItem.classList.add('selected');
            // 启用确认按钮
            document.getElementById('confirmBtn').disabled = false;
        });
        
        companyList.appendChild(companyItem);
    });
}

// 过滤企业列表
function filterCompanies(searchTerm) {
    const companyItems = document.querySelectorAll('.modal-company-item');
    
    companyItems.forEach(item => {
        const companyName = item.textContent.toLowerCase();
        if (companyName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initPage);