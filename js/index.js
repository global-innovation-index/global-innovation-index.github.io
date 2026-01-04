/**
 * 图表1：全球企业创新指数排名
 * 显示各产业前20名企业的详细排名数据
 */
(function() {
  let industryData = {};  // 存储所有产业数据
  let isLoading = false;  // 加载状态标识

  /**
   * 从JSON文件加载数据
   */
  async function loadIndustryData() {
    try {
      isLoading = true;
      window.dataLoader.showLoading('tableChart');
      
      // 加载产业排名数据
      industryData = await window.dataLoader.loadJSON('json/global_innovation_index_rankings.json');
      
      // 数据加载完成后，手动触发首次数据加载
      loadDefaultData();
      
    } catch (error) {
      console.error('加载数据失败:', error);
      window.dataLoader.showError('tableChart', '数据加载失败，请刷新页面重试');
    } finally {
      isLoading = false;
    }
  }

  /**
   * 加载默认数据（首次进入页面时调用）
   */
  function loadDefaultData() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();
    
    // 处理生物产业命名不一致问题
    let industryDataForTable;
    if (industryData[currentYear] && industryData[currentYear][currentIndustry]) {
      industryDataForTable = industryData[currentYear][currentIndustry];
    } else if (industryData[currentYear] && industryData[currentYear][(currentIndustry === "生物产业" ? "生物" : "生物产业")]) {
      industryDataForTable = industryData[currentYear][(currentIndustry === "生物产业" ? "生物" : "生物产业")];
    }
    
    if (industryDataForTable) {
      createTable(industryDataForTable);
    } else {
      window.dataLoader.showError('tableChart', '默认数据暂不可用');
    }
  }

  /**
   * 创建表格显示数据
   * @param {Array} data - 表格数据
   */
  function createTable(data) {
    window.dataLoader.clearContainer('tableChart');
    
    if (!data || data.length === 0) {
      window.dataLoader.showError('tableChart', '暂无数据');
      return;
    }
    
    const chartDiv = document.getElementById('tableChart');
    const table = document.createElement('table');
    table.className = 'table-container';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['排名', '企业', '国家/地区', '综合得分', '知识创新', '技术创新', '创新协作'];
    
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表格主体
    const tbody = document.createElement('tbody');
    data.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach((cell, index) => {
        const td = document.createElement('td');
        
        if (index === 1) { // 企业名称列
          // 创建可点击的企业名称，添加页面跳转
          const companyName = document.createElement('span');
          companyName.textContent = cell;
          companyName.className = 'company-name';
          companyName.style.cursor = 'pointer';
          companyName.style.color = 'rgb(141, 206, 249)';
          
          // 添加点击事件，跳转到企业详情页
          companyName.addEventListener('click', () => {
            const currentYear = window.industryManager.getCurrentYear();
            const currentIndustry = window.industryManager.getCurrentIndustry();
            // 构建跳转URL，传递年份、企业名称和产业参数
            const detailUrl = `company-detail.html?year=${currentYear}&company=${encodeURIComponent(cell)}&industry=${encodeURIComponent(currentIndustry)}`;
            window.open(detailUrl, '_blank');
          });
          
          td.appendChild(companyName);
        } else if (index >= 3) {
          // 数字列保留两位小数
          td.textContent = typeof cell === 'number' ? cell.toFixed(2) : cell;
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    chartDiv.appendChild(table);
  }

  /**
   * 切换产业数据显示
   * @param {string} industry - 产业标识
   */
  function switchIndustry(industry) {
    if (isLoading) return;
    
    const currentYear = window.industryManager.getCurrentYear();
    
    // 更新表格数据
    // 处理生物产业命名不一致问题
    let industryDataForTable;
    if (industryData[currentYear] && industryData[currentYear][industry]) {
      industryDataForTable = industryData[currentYear][industry];
    } else if (industryData[currentYear] && industryData[currentYear][(industry === "生物产业" ? "生物" : "生物产业")]) {
      industryDataForTable = industryData[currentYear][(industry === "生物产业" ? "生物" : "生物产业")];
    }
    
    if (industryDataForTable) {
      createTable(industryDataForTable);
    } else {
      window.dataLoader.showError('tableChart', '该产业数据暂不可用');
    }
  }

  /**
   * 初始化产业变化事件监听
   */
  function initIndustryListener() {
    document.addEventListener('industryChanged', (event) => {
      const { industry } = event.detail;
      switchIndustry(industry);
    });
  }

  /**
   * 初始化图表1
   */
  async function init() {
    // 初始化产业管理器
    window.industryManager.init();
    // 注册事件监听
    initIndustryListener();
    // 加载数据
    await loadIndustryData();
  }

  // 启动应用
  init();
})();

/**
 * 图表2：国家/地区入围企业数量排名
 * 以堆叠柱状图形式显示各国在不同排名区间的企业数量
 */
(function(){
  let countryData = {}; // 存储国家排名数据

  /**
   * 从JSON文件加载数据
   */
  async function loadCountryData() {
    try {
      // 加载国家排名数据
      countryData = await window.dataLoader.loadJSON('json/country-rank-data.json');
      // 初始化图表
      initCountryChart();
      // 手动触发首次数据加载
      loadDefaultData();
      
    } catch (error) {
      console.error('加载国家数据失败:', error);
      window.dataLoader.showError('countryChart', '数据加载失败，请刷新页面重试');
    }
  }

  /**
   * 加载默认数据（首次进入页面时调用）
   */
  function loadDefaultData() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();
    updateCountryChart(currentIndustry, currentYear);
  }

  /**
   * 初始化ECharts图表
   */
  function initCountryChart() {
    const chart = window.chartManager.initChart('countryChart');
  }

  /**
   * 生成产业按钮
   */
  function generateIndustryButtons() {
    const container = document.getElementById('industryButtons');
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 获取当前年份和产业数据
    const currentYear = window.industryManager.getCurrentYear();
    const industries = window.industryManager.getCurrentIndustries();
    
    if (!industries) return;
    
    // 为每个产业创建按钮
    industries.forEach(industry => {
      const button = document.createElement('button');
      button.className = 'industry-btn';
      button.textContent = industry.name;
      button.setAttribute('data-industry', industry.key);
      
      // 设置当前产业为激活状态
      if (industry.key === window.industryManager.getCurrentIndustry()) {
        button.classList.add('active');
      }
      
      // 添加点击事件
      button.addEventListener('click', function() {
        const clickedIndustry = this.getAttribute('data-industry');
        window.industryManager.switchIndustry(clickedIndustry);
      });
      
      container.appendChild(button);
    });
  }
  
  /**
   * 监听产业变化事件
   */
  function initIndustryListener() {
    // 生成产业按钮
    generateIndustryButtons();
    
    // 监听产业变化事件
    document.addEventListener('industryChanged', (event) => {
      const { industry, year } = event.detail;
      updateCountryChart(industry, year);
      
      // 重新生成产业按钮，以适应年份变化
      generateIndustryButtons();
      
      // 确保当前选中的产业按钮处于激活状态
      const activeBtn = document.querySelector(`[data-industry="${industry}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    });
  }

  /**
   * 更新图表数据显示
   * @param {string} selectedIndustry - 选中的产业
   * @param {string} year - 选中的年份
   */
  function updateCountryChart(selectedIndustry, year) {
    // 检查数据是否可用
    if (!countryData[year] || !countryData[year].countries || !countryData[year].columns) {
      return;
    }

    const rawData = countryData[year].countries;
    const columns = countryData[year].columns;

    // 使用数据处理工具
    const filterColumns = window.dataUtils.getIndustryColumns(columns, selectedIndustry);
    const processedData = window.dataUtils.processRawData(rawData, columns);
    const filteredData = window.dataUtils.filterValidData(processedData, filterColumns);
    const countryTotals = window.dataUtils.calculateCountryTotals(filteredData, filterColumns);

    const sortedData = countryTotals.map(item => item.data);
    const yAxisData = countryTotals.map(item => item.country);

    // 构建系列数据
    const seriesData = filterColumns.map((col) => {
      let gradientConfig;
      let legendName = '';
      
      // 根据列类型设置不同的渐变颜色和图例名称
      if (col.endsWith('前10')) {
        gradientConfig = {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{
            offset: 0, color: '#97c5e9f8' // 浅蓝色
          }, {
            offset: 1, color: '#2b95e6ff' // 深蓝色
          }]
        };
        legendName = '前10';
      } else if (col.endsWith('前50')) {
        gradientConfig = {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{
            offset: 0, color: 'rgba(255, 197, 96, 0.96)' // 浅橙色 
          }, {
            offset: 1, color: 'rgb(236, 166, 44)' // 浅橙色
          }]
        };
        legendName = '前50';
      } else if (col.endsWith('前100')) {
        gradientConfig = {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{
            offset: 0, color: '#a0d4dbff' // 浅青色
          }, {
            offset: 1, color: '#2ecae2ff' // 深青色
          }]
        };
        legendName = '前100';
      }

      return {
        name: legendName, // 图例显示名称
        type: 'bar',
        stack: 'total',   // 堆叠柱状图
        barWidth: '40%',  // 柱状图宽度
        label: {
          show: false     // 不显示数据标签
        },
        emphasis: {
          focus: 'series' // 高亮系列
        },
        itemStyle: {
          color: gradientConfig // 渐变颜色
        },
        data: sortedData.map(item => item[col] === '/' ? 0 : parseInt(item[col]))
      };
    });

    // ECharts配置项
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow' // 阴影指示器
        },
        textStyle: {
          fontSize: 10 // 字体大小10
        }
      },
      legend: {
        data: seriesData.map(s => s.name),
        left: 'center',   // 图例居中
        top: '0',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: "10"
        }
      },
      grid: {
        left: '60px',     // 左边距
        right: '20px',    // 右边距
        bottom: '0px',    // 底边距
        top: '30px',      // 顶边距
        containLabel: false
      },
      xAxis: {
        show: false,      // 隐藏X轴
        // type: 'value'
      },
      yAxis: {
        type: 'category', // 分类轴（国家名称）
        data: yAxisData,
        axisLabel: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10,
          interval: 0      // 显示所有标签
        },
        axisLine: {
          show: false     // 隐藏轴线
        },
        axisTick: {
          show: false     // 隐藏刻度
        }
      },
      series: seriesData
    };

    // 更新图表
    window.chartManager.updateChart('countryChart', option);
  }

  /**
   * 初始化图表2
   */
  async function init() {
    // 注册事件监听
    initIndustryListener();
    // 加载数据
    await loadCountryData();
  }

  // 启动应用
  init();
})();

/**
 * 图表3：企业知识创新画像
 * 支持雷达图、多Y轴折柱图、系列按列分布图三种视图
 */
(function(){
  let indicatorData = {}; // 存储指标数据
  let currentSecondaryIndicator = '知识创新产出'; // 当前二级指标
  let currentThirdIndicator = 'Web of Science论文数'; // 默认三级指标
  let isDataLoaded = false; // 标记数据是否已加载

  /**
   * 从JSON文件加载数据
   */
  async function loadIndicatorData() {
    try {
      window.dataLoader.showLoading('indicatorChart');
      // 使用时间戳避免缓存
      const timestamp = new Date().getTime();
      indicatorData = await window.dataLoader.loadJSON(`json/knowledge_innovation.json?t=${timestamp}`);
      isDataLoaded = true;
      initIndicatorChart();
      loadDefaultData();
    } catch (error) {
      console.error('加载指标数据失败:', error);
      window.dataLoader.showError('indicatorChart', '数据加载失败，请刷新页面重试');
      isDataLoaded = false;
    }
  }

  /**
   * 初始化图表
   */
  function initIndicatorChart() {
    window.chartManager.initChart('indicatorChart');
    initControlButtons();
    initIndustryListener();
  }

  /**
   * 初始化二级指标按钮
   */
  function initControlButtons() {
    const secondaryIndicators = ['知识创新产出', '知识创新影响', '知识创新扩散'];
    const container = document.getElementById('secondaryIndicatorButtons');
    
    container.innerHTML = '';
    
    secondaryIndicators.forEach(indicator => {
      const button = document.createElement('button');
      button.className = 'secondary-indicator-btn';
      button.textContent = indicator;
      button.setAttribute('data-indicator', indicator);
      
      if (indicator === '知识创新产出') {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        // 更新按钮状态 - 只操作当前容器内的按钮
        container.querySelectorAll('.secondary-indicator-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 切换二级指标
        currentSecondaryIndicator = indicator;
        
        // 只有知识创新扩散显示三级指标按钮
        if (indicator === '知识创新扩散') {
          document.getElementById('thirdIndicatorButtons').style.display = 'flex';
          updateThirdIndicatorButtons();
          updateChart(); // 确保点击知识创新扩散时也调用updateChart
        } else {
          document.getElementById('thirdIndicatorButtons').style.display = 'none';
          updateChart();
        }
      });
      
      container.appendChild(button);
    });
  }

  /**
   * 监听产业变化事件
   */
  function initIndustryListener() {
    document.addEventListener('industryChanged', (event) => {
      const { industry, year } = event.detail;
      
      // 直接更新图表，不重新加载数据
      if (currentSecondaryIndicator === '知识创新扩散') {
        updateThirdIndicatorButtons();
      }
      updateChart();
    });
  }

  /**
   * 更新三级指标按钮
   */
  function updateThirdIndicatorButtons() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();
        
    // 检查数据是否存在
    if (!isDataAvailable(currentYear, currentIndustry)) {
      console.warn(`未找到 ${currentYear} 年 ${currentIndustry} 的数据`);
      // 清空按钮容器
      const container = document.getElementById('thirdIndicatorButtons');
      container.innerHTML = '<button class="third-indicator-btn" style="color: #ff6b6b;">暂无数据</button>';
      return;
    }

    // 处理生物产业命名不一致问题
    let data = indicatorData[currentYear][currentIndustry];
    
    // 如果当前产业是"生物产业"但找不到数据，尝试使用"生物"
    if (currentIndustry === "生物产业" && !data) {
      data = indicatorData[currentYear]["生物"];
    }
    
    // 如果当前产业是"生物"但找不到数据，尝试使用"生物产业"
    if (currentIndustry === "生物" && !data) {
      data = indicatorData[currentYear]["生物产业"];
    }
    
    // 根据当前二级指标获取对应的三级指标
    let thirdIndicators = [];
    if (data[0] && data[0].知识创新 && data[0].知识创新[currentSecondaryIndicator]) {
      const allThirdIndicators = Object.keys(data[0].知识创新[currentSecondaryIndicator]);
      
      // 过滤掉所有值都为null的三级指标
      thirdIndicators = allThirdIndicators.filter(indicator => {
        // 检查是否存在至少一个非null值
        return data.some(item => {
          const value = item.知识创新[currentSecondaryIndicator][indicator];
          return value !== null && value !== undefined;
        });
      });
    }
    
    const container = document.getElementById('thirdIndicatorButtons');
    
    container.innerHTML = '';
    
    // 如果没有三级指标数据
    if (thirdIndicators.length === 0) {
      container.innerHTML = '<button class="third-indicator-btn" style="color: #ff6b6b;">暂无指标数据</button>';
      return;
    }
    
    thirdIndicators.forEach((indicator) => {
      const button = document.createElement('button');
      button.className = 'third-indicator-btn';
      button.textContent = indicator;
      button.setAttribute('data-indicator', indicator);
      
      // 如果是第一个按钮，设置为默认选中
      if (indicator === thirdIndicators[0]) {
        button.classList.add('active');
        currentThirdIndicator = indicator;
      }
      
      button.addEventListener('click', () => {
        // 更新按钮状态 - 只操作当前图表3的三级指标按钮
        document.querySelectorAll('#thirdIndicatorButtons .third-indicator-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 切换三级指标
        currentThirdIndicator = indicator;
        updateChart();
      });
      
      container.appendChild(button);
    });

    // 如果当前没有激活的按钮，自动选择第一个并更新图表
    const activeBtn = container.querySelector('.third-indicator-btn.active');
    if (!activeBtn && thirdIndicators.length > 0) {
      const firstButton = container.querySelector('.third-indicator-btn');
      if (firstButton) {
        firstButton.classList.add('active');
        currentThirdIndicator = thirdIndicators[0];
        // 立即更新图表
        updateChart();
      }
    } else if (activeBtn) {
      // 如果已经有激活的按钮，确保图表更新
      updateChart();
    }
  }

  /**
   * 检查数据是否可用
   */
  function isDataAvailable(year, industry) {
    if (!isDataLoaded || !indicatorData) {
      return false;
    }
    
    if (!indicatorData[year]) {
      return false;
    }
    
    // 检查当前产业名称是否有数据
    if (indicatorData[year][industry]) {
      return true;
    }
    
    // 处理生物产业命名不一致问题
    if (industry === "生物产业" && indicatorData[year]["生物"]) {
      return true;
    }
    
    if (industry === "生物" && indicatorData[year]["生物产业"]) {
      return true;
    }
    
     return false;
   }

  /**
   * 加载默认数据
   */
  function loadDefaultData() {
    // 默认隐藏三级指标按钮（知识创新产出不需要）
    document.getElementById('thirdIndicatorButtons').style.display = 'none';
    updateChart();
  }

  /**
   * 更新图表
   */
  function updateChart() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();


    // 检查数据是否可用
    if (!isDataAvailable(currentYear, currentIndustry)) {
      console.warn(`数据不可用: ${currentYear}年, ${currentIndustry}`);
      window.dataLoader.showError('indicatorChart', `${currentYear}年${currentIndustry}数据暂不可用`);
      return;
    }

    // 处理生物产业命名不一致问题
    let data = indicatorData[currentYear][currentIndustry];
    
    // 如果当前产业是"生物产业"但找不到数据，尝试使用"生物"
    if (currentIndustry === "生物产业" && !data) {
      data = indicatorData[currentYear]["生物"];
    }
    
    // 如果当前产业是"生物"但找不到数据，尝试使用"生物产业"
    if (currentIndustry === "生物" && !data) {
      data = indicatorData[currentYear]["生物产业"];
    }
    
    // 检查数据结构是否正确
    if (!data[0] || !data[0].知识创新 || !data[0].知识创新[currentSecondaryIndicator]) {
      console.warn(`未找到 ${currentSecondaryIndicator} 的数据`);
      window.dataLoader.showError('indicatorChart', `${currentSecondaryIndicator} 数据暂不可用`);
      return;
    }
    
    // 根据二级指标选择图表类型
    switch (currentSecondaryIndicator) {
      case '知识创新产出':
        createColumnChart(data); // 系列分布柱状图
        break;
      case '知识创新影响':
        createMultiAxisChart(data);
        break;
      case '知识创新扩散':
        createRadarChart(data); // 雷达图
        break;
      default:
        console.warn('未知的二级指标:', currentSecondaryIndicator);
        window.dataLoader.showError('indicatorChart', '未知的指标类型');
    }
  }

  /**
   * 创建系列分布柱状图 - 用于知识创新产出
   */
  function createColumnChart(data) {
    const companies = data.map(item => item.企业中文简称);
    const allIndicators = Object.keys(data[0].知识创新[currentSecondaryIndicator]);
    
    // 过滤掉所有值都为null的指标
    const indicators = allIndicators.filter(indicator => {
      // 检查是否存在至少一个非null值
      return data.some(item => {
        const value = item.知识创新[currentSecondaryIndicator][indicator];
        return value !== null && value !== undefined;
      });
    });
    
    const series = indicators.map(indicator => {
      return {
        name: indicator,
        type: 'bar',
        barWidth: '25%',
        barGap: 0,
        emphasis: {
          focus: 'series'
        },
        data: data.map(item => {
          const value = item.知识创新[currentSecondaryIndicator][indicator];
          return value !== null && value !== undefined ? parseFloat(value.toFixed(1)) : 0;
        })
      };
    });

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        textStyle: {
          fontSize: 10 // 字体大小10
        }
      },
      legend: {
        data: indicators,
        bottom:1,
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 9 // 字体大小11
        },
        itemWidth: 8,
        itemHeight: 8
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%', // 为底部图例留出空间
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: companies,
        axisLabel: {
          color: 'rgba(255,255,255,.6)',
          fontSize: 10, // 字体大小11
          interval: 0,
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.3)'
          }
        }
      },
      yAxis: {
        type: 'value',
        // name: '数值',
        axisLabel: {
          color: 'rgba(255,255,255,.6)',
          fontSize: 10, // 字体大小11
          formatter: '{value}'
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.3)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.1)'
          }
        }
      },
      series: series,
      color: ['rgba(78,197,196,0.8)', 'rgb(236, 166, 44)','rgba(255,107,107,0.8)','rgba(79,165,222,0.8)', 'rgba(150,206,180,0.8)', 'rgba(221,160,221,0.8)', 'rgba(135,206,235,0.8)']
    };

    window.chartManager.updateChart('indicatorChart', option);
  }

  /**
   * 创建多Y轴折柱图 - 用于知识创新影响
   */
  function createMultiAxisChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const allIndicators = Object.keys(data[0].知识创新[currentSecondaryIndicator]);
    
    // 过滤掉所有值都为null的指标
    const originalIndicators = allIndicators.filter(indicator => {
      // 检查是否存在至少一个非null值
      return data.some(item => {
        const value = item.知识创新[currentSecondaryIndicator][indicator];
        return value !== null && value !== undefined;
      });
    });
    
    // 需要放在左侧Y轴的指标名称
    const leftAxisIndicators = ['篇均论文被引频次', '论文施引国家数'];
    
    // 重新排序指标，确保左侧Y轴的指标放在前两行
    const indicators = [...leftAxisIndicators];
    originalIndicators.forEach(indicator => {
      if (!leftAxisIndicators.includes(indicator)) {
        indicators.push(indicator);
      }
    });
    
    // 过滤掉左侧Y轴指标中可能不存在的指标
    const filteredLeftAxisIndicators = leftAxisIndicators.filter(indicator => 
      originalIndicators.includes(indicator)
    );
    // 更新指标数组，只包含有效的左侧Y轴指标
    indicators.splice(0, leftAxisIndicators.length, ...filteredLeftAxisIndicators);
    
    const series = indicators.map((indicator, index) => {
      // 判断指标应该放在左侧还是右侧Y轴
      const isLeftAxis = leftAxisIndicators.includes(indicator);
      // 判断是否为柱状图类型（前两个指标和论文施引国家数）
      const isBarChart = leftAxisIndicators.includes(indicator); // 所有左侧Y轴指标都用柱状图
      
      return {
        name: indicator, // 图例使用三级指标名称
        barWidth: '30%',
        barGap: 0,
        type: isBarChart ? 'bar' : 'line',
        yAxisIndex: isLeftAxis ? 0 : 1, // 根据指标名称分配Y轴
        data: data.slice(0, 10).map(item => {
          const value = item.知识创新[currentSecondaryIndicator][indicator];
          return value !== null && value !== undefined ? parseFloat(value.toFixed(1)) : 0;
        }),
        itemStyle: {
          opacity: 0.8
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 4
      };
    });

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        textStyle: {
          fontSize: 10 // 字体大小10
        }
      },
      legend: {
        data: indicators, // 显示重新排序后的指标名称，确保前两个是左侧Y轴的指标
        bottom: '0', // 图例放在下方
        left: 'center',
        width: '80%',
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10 // 字体大小10
        },
        itemWidth: 8,
        itemHeight: 8
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 为底部图例留出空间
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: companies, // X轴显示企业
        axisLabel: {
          color: 'rgba(255,255,255,.6)',
          fontSize: 10, // 字体大小11
          interval: 0,
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.3)'
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          // name: '数值',
          position: 'left',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10, // 字体大小11
            formatter: '{value}'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255,255,255,.6)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          }
        },
        {
          type: 'value',
          // name: '数值',
          position: 'right',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10, // 字体大小11
            formatter: '{value}'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255,255,255,.6)'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series,
      color: ['rgba(79,165,222,0.8)','rgba(78,197,196,0.8)', 'rgb(236, 166, 44)','rgba(255,107,107,0.8)', 'rgba(150,206,180,0.8)', 'rgba(221,160,221,0.8)', 'rgba(135,206,235,0.8)']
    };

    window.chartManager.updateChart('indicatorChart', option);
  }

  /**
   * 创建雷达图 - 用于知识创新扩散
   */
  function createRadarChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const countries = data.slice(0, 10).map(item => item.国家);
    const currentThirdData = data.slice(0, 10).map(item => {
      const value = item.知识创新[currentSecondaryIndicator][currentThirdIndicator];
      return value !== null && value !== undefined ? parseFloat(value.toFixed(1)) : 0;
    });

    // 计算数据的最大值和最小值
    const maxValue = Math.max(...currentThirdData);
    const minValue = Math.min(...currentThirdData);
    
    // 解决数据差异大的问题：使用对数刻度或设置合理的范围
    let radarMax, radarMin;
    
    if (maxValue / minValue > 100) {
      // 如果数据差异很大，使用对数思路处理
      // 设置最小值为0或数据最小值的90%
      radarMin = Math.max(0, minValue * 0.9);
      // 设置最大值为数据最大值的110%
      radarMax = maxValue * 1.1;
    } else {
      // 数据差异不大，使用常规范围
      const range = maxValue - minValue;
      radarMax = Math.ceil(maxValue + range * 0.1);
      radarMin = Math.floor(Math.max(0, minValue - range * 0.1));
    }

    // 如果最小值接近0，设置为0
    if (radarMin < maxValue * 0.01) {
      radarMin = 0;
    }

    // 雷达图指标 - 十个角对应十个企业
    const radarIndicator = companies.map((company, index) => ({
      name: company,
      max: radarMax,
      min: radarMin
    }));

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 10
        },
        formatter: function(params) {
          // 显示所有企业的数据概览
          let tooltipContent = `<div style="margin-bottom: 8px; font-weight: bold;">${currentThirdIndicator}</div>`;
          
          // 为每个企业添加一行数据
          companies.forEach((company, index) => {
            const value = currentThirdData[index];
            const country = countries[index];
            tooltipContent += `
              <div style="margin: 2px 0;">
                ${company} (${country})：<span style="color: #45B7D1; font-weight: bold;">${value}</span>
              </div>
            `;
          });
          
          return tooltipContent;
        }
      },
      legend: {
        show: false // 取消图例说明
      },
      radar: {
        indicator: radarIndicator,
        axisName: {
          color: 'rgba(229, 208, 208, 0.6)',
          fontSize: 9,
          padding: [1, 1],
          formatter: function(name) {
            // 企业名称过长时换行显示
            if (name.length > 4) {
              return name.substring(0, 4) + '\n' + name.substring(4);
            }
            return name;
          }
        },
        shape: 'circle',
        splitNumber: 5,
        center: ['50%', '50%'],
        radius: '60%',
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.1)'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255,255,255,.02)', 'rgba(255,255,255,.05)']
          }
        },
        axisLine: {
          show: false // 取消轴线显示
        }
      },
      series: [{
        type: 'radar',
        data: [{
          value: currentThirdData,
          name: currentThirdIndicator,
          symbol: 'circle', // 显示数据点
          symbolSize: 3,
          lineStyle: {
            width: 1,
            color: '#45B7D1' // 浅蓝色
          },
          areaStyle: {
            color: 'rgba(69, 183, 209, 0.3)' // 浅蓝色半透明
          },
          itemStyle: {
            color: '#45B7D1' // 浅蓝色
          }
        }],
        emphasis: {
          lineStyle: {
            width: 2,
            color: '#45B7D1'
          },
          areaStyle: {
            color: 'rgba(69, 183, 209, 0.5)' // 高亮时加深透明度
          }
        }
      }]
    };

    window.chartManager.updateChart('indicatorChart', option);
  }

  /**
   * 重新加载数据
   */
  async function reloadData() {
    isDataLoaded = false;
    await loadIndicatorData();
  }

  /**
   * 初始化图表3
   */
  async function init() {
    await loadIndicatorData();
    
    // 暴露重新加载方法给全局，以便其他模块调用
    window.indicatorChart = {
      reloadData: reloadData,
      updateChart: updateChart
    };
  }

  // 启动应用
  init();
})();

/**
 * 图表4：企业技术创新画像
 * 支持雷达图、多Y轴折柱图
 */
(function(){
  let techInnovationData = {}; // 存储技术创新数据
  let currentSecondaryIndicator = '技术创新产出'; // 当前二级指标
  let currentThirdIndicator = '发明专利数'; // 默认三级指标
  let isDataLoaded = false; // 标记数据是否已加载

  /**
   * 从JSON文件加载数据
   */
  async function loadTechInnovationData() {
    try {
      window.dataLoader.showLoading('techInnovationChart');
      const timestamp = new Date().getTime();
      techInnovationData = await window.dataLoader.loadJSON(`json/technology_innovation.json?t=${timestamp}`);
      isDataLoaded = true;
      initTechInnovationChart();
      loadDefaultTechData();
    } catch (error) {
      console.error('加载技术创新数据失败:', error);
      window.dataLoader.showError('techInnovationChart', '数据加载失败，请刷新页面重试');
      isDataLoaded = false;
    }
  }

  /**
   * 初始化图表4
   */
  function initTechInnovationChart() {
    window.chartManager.initChart('techInnovationChart');
    initTechControlButtons();
    initTechIndustryListener();
  }

  /**
   * 初始化二级指标按钮
   */
  function initTechControlButtons() {
    const secondaryIndicators = ['技术创新产出', '技术创新质量', '技术创新影响'];
    const container = document.getElementById('techSecondaryIndicatorButtons');
    
    if (!container) {
      console.error('未找到技术创新二级指标按钮容器');
      return;
    }
    
    container.innerHTML = '';
    
    secondaryIndicators.forEach(indicator => {
      const button = document.createElement('button');
      button.className = 'secondary-indicator-btn';
      button.textContent = indicator;
      button.setAttribute('data-indicator', indicator);
      
      if (indicator === '技术创新产出') {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        // 更新按钮状态
        document.querySelectorAll('#techSecondaryIndicatorButtons .secondary-indicator-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 切换二级指标
        currentSecondaryIndicator = indicator;
        
        // 技术创新影响显示三级指标按钮，其他不显示
        if (indicator === '技术创新影响') {
          document.getElementById('techThirdIndicatorButtons').style.display = 'flex';
          updateTechThirdIndicatorButtons();
        } else {
          document.getElementById('techThirdIndicatorButtons').style.display = 'none';
          updateTechChart();
        }
      });
      
      container.appendChild(button);
    });
  }

  /**
   * 监听产业变化事件
   */
  function initTechIndustryListener() {
    document.addEventListener('industryChanged', (event) => {
      const { industry, year } = event.detail;
      
      if (currentSecondaryIndicator === '技术创新影响') {
        updateTechThirdIndicatorButtons();
      }
      updateTechChart();
    });
  }

  /**
   * 更新三级指标按钮
   */
  function updateTechThirdIndicatorButtons() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();
    
    
    // 检查数据是否存在
    if (!isTechDataAvailable(currentYear, currentIndustry)) {
      console.warn(`未找到 ${currentYear} 年 ${currentIndustry} 的技术创新数据`);
      const container = document.getElementById('techThirdIndicatorButtons');
      if (container) {
        container.innerHTML = '<button class="third-indicator-btn" style="color: #ff6b6b;">暂无数据</button>';
      }
      return;
    }

    const data = techInnovationData[currentYear][currentIndustry];
    
    // 获取技术创新影响的三级指标
    let thirdIndicators = [];
    if (data[0] && data[0].技术创新 && data[0].技术创新['技术创新影响']) {
      thirdIndicators = Object.keys(data[0].技术创新['技术创新影响']);
    }
    
    const container = document.getElementById('techThirdIndicatorButtons');
    if (!container) {
      console.error('未找到技术创新三级指标按钮容器');
      return;
    }
    
    container.innerHTML = '';
    
    if (thirdIndicators.length === 0) {
      container.innerHTML = '<button class="third-indicator-btn" style="color: #ff6b6b;">暂无指标数据</button>';
      return;
    }
    
    thirdIndicators.forEach((indicator) => {
      const button = document.createElement('button');
      button.className = 'third-indicator-btn';
      button.textContent = indicator;
      button.setAttribute('data-indicator', indicator);
      
      if (indicator === thirdIndicators[0]) {
        button.classList.add('active');
        currentThirdIndicator = indicator;
      }
      
      button.addEventListener('click', () => {
        document.querySelectorAll('#techThirdIndicatorButtons .third-indicator-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        currentThirdIndicator = indicator;
        updateTechChart();
      });
      
      container.appendChild(button);
    });

    const activeBtn = container.querySelector('.third-indicator-btn.active');
    if (!activeBtn && thirdIndicators.length > 0) {
      const firstButton = container.querySelector('.third-indicator-btn');
      if (firstButton) {
        firstButton.classList.add('active');
        currentThirdIndicator = thirdIndicators[0];
        updateTechChart();
      }
    } else if (activeBtn) {
      updateTechChart();
    }
  }

  /**
   * 检查技术创新数据是否可用
   */
  function isTechDataAvailable(year, industry) {
    if (!isDataLoaded || !techInnovationData) {
      return false;
    }
    if (!techInnovationData[year]) {
      return false;
    }
    if (!techInnovationData[year][industry]) {
      return false;
    }
    return true;
  }

  /**
   * 加载默认数据
   */
  function loadDefaultTechData() {
    const thirdButtonsContainer = document.getElementById('techThirdIndicatorButtons');
    if (thirdButtonsContainer) {
      thirdButtonsContainer.style.display = 'none';
    }
    updateTechChart();
  }

  /**
   * 更新技术创新图表
   */
  function updateTechChart() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();

    if (!isTechDataAvailable(currentYear, currentIndustry)) {
      window.dataLoader.showError('techInnovationChart', `${currentYear}年${currentIndustry}数据暂不可用`);
      return;
    }

    const data = techInnovationData[currentYear][currentIndustry];
    
    if (!data[0] || !data[0].技术创新 || !data[0].技术创新[currentSecondaryIndicator]) {
      window.dataLoader.showError('techInnovationChart', `${currentSecondaryIndicator} 数据暂不可用`);
      return;
    }
    
    // 根据二级指标选择图表类型
    switch (currentSecondaryIndicator) {
      case '技术创新产出':
        createTechMultiAxisChart(data);
        break;
      case '技术创新质量':
        createTechMultiAxisChart(data);
        break;
      case '技术创新影响':
        createTechRadarChart(data);
        break;
      default:
        window.dataLoader.showError('techInnovationChart', '未知的指标类型');
    }
  }

  /**
   * 创建多Y轴折柱图 - 用于技术创新产出和技术创新质量
   */
  function createTechMultiAxisChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const indicators = Object.keys(data[0].技术创新[currentSecondaryIndicator]);
    
    const series = indicators.map((indicator, index) => {
      return {
        name: indicator,
        barWidth: '30%',
        type: index === 0 ? 'bar' : 'line',
        yAxisIndex: index === 0 ? 0 : 1,
        data: data.slice(0, 10).map(item => 
          parseFloat(item.技术创新[currentSecondaryIndicator][indicator].toFixed(1))
        ),
        itemStyle: {
          opacity: 0.8
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 4
      };
    });

    const option = {
      tooltip: {
        trigger: 'axis',
        textStyle: {
          fontSize: 10
        },
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: indicators,
        bottom: '0',
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10
        },
        itemWidth: 8,
        itemHeight: 8
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%', // 为底部图例留出空间
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: companies,
        axisLabel: {
          color: 'rgba(255,255,255,.6)',
          fontSize: 10,
          interval: 0,
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.3)'
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          // name: '数值',
          position: 'left',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10,
            formatter: '{value}'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255,255,255,.3)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          }
        },
        {
          type: 'value',
          // name: '数值',
          position: 'right',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10,
            formatter: '{value}'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255,255,255,.3)'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series,
      color: ['rgba(78,197,196,0.8)', 'rgb(236, 166, 44)','rgba(255,107,107,0.8)','rgba(231, 111, 231, 0.8)', 'rgba(150,206,180,0.8)', 'rgba(135,206,235,0.8)']
    };

    window.chartManager.updateChart('techInnovationChart', option);
  }

  /**
   * 创建雷达图 - 用于技术创新影响
   */
  function createTechRadarChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const countries = data.slice(0, 10).map(item => item.国家);
    const currentThirdData = data.slice(0, 10).map(item => {
      const value = item.技术创新[currentSecondaryIndicator][currentThirdIndicator];
      return parseFloat(value.toFixed(1));
    });

    // 计算数据的最大值和最小值
    const maxValue = Math.max(...currentThirdData);
    const minValue = Math.min(...currentThirdData);
    
    // 处理数据差异
    let radarMax, radarMin;
    if (maxValue / minValue > 100) {
      radarMin = Math.max(0, minValue * 0.9);
      radarMax = maxValue * 1.1;
    } else {
      const range = maxValue - minValue;
      radarMax = Math.ceil(maxValue + range * 0.1);
      radarMin = Math.floor(Math.max(0, minValue - range * 0.1));
    }

    if (radarMin < maxValue * 0.01) {
      radarMin = 0;
    }

    // 雷达图指标
    const radarIndicator = companies.map((company, index) => ({
      name: company,
      max: radarMax,
      min: radarMin
    }));

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 10
        },
        formatter: function(params) {
          let tooltipContent = `<div style="margin-bottom: 8px; font-weight: bold;">${currentThirdIndicator}</div>`;
          
          companies.forEach((company, index) => {
            const value = currentThirdData[index];
            const country = countries[index];
            tooltipContent += `
              <div style="margin: 2px 0;">
                ${company} (${country})：<span style="color: #45B7D1; font-weight: bold;">${value}</span>
              </div>
            `;
          });
          
          return tooltipContent;
        }
      },
      legend: {
        show: false
      },
      radar: {
        indicator: radarIndicator,
        shape: 'circle',
        splitNumber: 5,
        center: ['50%', '50%'],
        radius: '60%',
        axisName: {
          color: 'rgba(255,255,255,.6)',
          fontSize: 8,
          padding: [2, 2],
          formatter: function(name) {
            if (name.length > 4) {
              return name.substring(0, 4) + '\n' + name.substring(4);
            }
            return name;
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,.1)'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255,255,255,.02)', 'rgba(255,255,255,.05)']
          }
        },
        axisLine: {
          show: false
        }
      },
      series: [{
        type: 'radar',
        data: [{
          value: currentThirdData,
          name: currentThirdIndicator,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 1,
            color: '#45B7D1'
          },
          areaStyle: {
            color: 'rgba(69, 183, 209, 0.3)'
          },
          itemStyle: {
            color: '#45B7D1'
          }
        }],
        emphasis: {
          lineStyle: {
            width: 2,
            color: '#45B7D1'
          },
          areaStyle: {
            color: 'rgba(69, 183, 209, 0.5)'
          }
        }
      }]
    };

    window.chartManager.updateChart('techInnovationChart', option);
  }

  /**
   * 初始化技术创新图表
   */
  async function init() {
    await loadTechInnovationData();
    
    // 暴露方法给全局
    window.techInnovationChart = {
      reloadData: loadTechInnovationData,
      updateChart: updateTechChart
    };
  }

  // 启动应用
  init();
})();

/**
 * 图表5：企业创新协作画像
 * 支持双X轴横向柱状图
 */
(function(){
  let collaborationData = {}; // 存储创新协作数据
  let currentSecondaryIndicator = '创新主体规模'; // 当前二级指标
  let isDataLoaded = false; // 标记数据是否已加载

  /**
   * 从JSON文件加载数据
   */
  async function loadCollaborationData() {
    try {
      window.dataLoader.showLoading('collaborationChart');
      const timestamp = new Date().getTime();
      collaborationData = await window.dataLoader.loadJSON(`json/collaboration_innovation.json?t=${timestamp}`);
      isDataLoaded = true;
      initCollaborationChart();
      updateCollaborationChart();
    } catch (error) {
      console.error('加载创新协作数据失败:', error);
      window.dataLoader.showError('collaborationChart', '数据加载失败，请刷新页面重试');
      isDataLoaded = false;
    }
  }

  /**
   * 初始化图表5
   */
  function initCollaborationChart() {
    window.chartManager.initChart('collaborationChart');
    initCollaborationButtons();
    initCollaborationListener();
  }

  /**
   * 初始化二级指标按钮
   */
  function initCollaborationButtons() {
    const secondaryIndicators = ['创新主体规模', '创新主体地位', '创新协作水平'];
    const container = document.getElementById('collaborationSecondaryButtons');
    
    if (!container) {
      console.error('未找到创新协作二级指标按钮容器');
      return;
    }
    
    container.innerHTML = '';
    
    secondaryIndicators.forEach(indicator => {
      const button = document.createElement('button');
      button.className = 'secondary-indicator-btn';
      button.textContent = indicator;
      button.setAttribute('data-indicator', indicator);
      
      if (indicator === '创新主体规模') {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        // 更新按钮状态
        document.querySelectorAll('#collaborationSecondaryButtons .secondary-indicator-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 切换二级指标
        currentSecondaryIndicator = indicator;
        updateCollaborationChart();
      });
      
      container.appendChild(button);
    });
  }

  /**
   * 监听产业变化事件
   */
  function initCollaborationListener() {
    document.addEventListener('industryChanged', (event) => {
      const { industry, year } = event.detail;
      updateCollaborationChart();
    });
  }

  /**
   * 检查创新协作数据是否可用
   */
  function isCollaborationDataAvailable(year, industry) {
    if (!isDataLoaded || !collaborationData) {
      return false;
    }
    if (!collaborationData[year]) {
      return false;
    }
    if (!collaborationData[year][industry]) {
      return false;
    }
    return true;
  }

  /**
   * 更新创新协作图表
   */
  function updateCollaborationChart() {
    const currentYear = window.industryManager.getCurrentYear();
    const currentIndustry = window.industryManager.getCurrentIndustry();

    if (!isCollaborationDataAvailable(currentYear, currentIndustry)) {
      window.dataLoader.showError('collaborationChart', `${currentYear}年${currentIndustry}数据暂不可用`);
      return;
    }

    const data = collaborationData[currentYear][currentIndustry];
    
    if (!data[0] || !data[0].创新协作 || !data[0].创新协作[currentSecondaryIndicator]) {
      window.dataLoader.showError('collaborationChart', `${currentSecondaryIndicator} 数据暂不可用`);
      return;
    }
    
    // 根据二级指标选择图表类型
    switch (currentSecondaryIndicator) {
      case '创新主体规模':
        createScaleChart(data);
        break;
      case '创新主体地位':
        createStatusChart(data);
        break;
      case '创新协作水平':
        createLevelChart(data);
        break;
      default:
        window.dataLoader.showError('collaborationChart', '未知的指标类型');
    }
  }

  /**
   * 创建创新主体规模图表 - 倒T字形横向柱状图
   */
  function createScaleChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const paperData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['论文合著者数量']
    );
    const patentData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['专利发明人数量']
    );

    // 计算最大值用于确定坐标轴范围
    const maxPaper = Math.max(...paperData);
    const maxPatent = Math.max(...patentData);
    // 使用相同的最大值范围，确保左右两侧显示比例一致
    const maxValue = Math.max(maxPaper, maxPatent) * 1.2;

    const option = {
      tooltip: {
        trigger: 'axis',
        textStyle: {
          fontSize: 10
        },
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(function(item) {
            // 显示绝对值
            const absValue = Math.abs(item.value);
            result += item.marker + item.seriesName + ': ' + absValue + '<br/>';
          });
          return result;
        }
      },
      legend: {
        data: ['论文合著者数量', '专利发明人数量'],
        bottom: '0',
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10
        },
        itemGap: 10,
        itemWidth: 10,
        itemHeight: 10
      },
      grid: {
        // 调整网格布局，为Y轴留出中间位置
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true
      },
      xAxis: [
        {
          // 左侧X轴（负值方向）
          type: 'value',
          position: 'center', // 设置X轴在中间位置
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10,
            formatter: function(value) {
              return Math.abs(value); // 显示绝对值
            }
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false // 不显示分隔线，避免与右侧X轴分隔线冲突
          },
          min: -maxValue,
          max: 0
        },
        {
          // 右侧X轴（正值方向）
          type: 'value',
          position: 'center', // 设置X轴在中间位置，与左侧X轴重合
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          },
          min: 0,
          max: maxValue
        }
      ],
      yAxis: {
        type: 'category',
        // 移除Y轴线，让企业名称显示在中间
        axisLine: {
          show: false
        },
        // 移除Y轴刻度
        axisTick: {
          show: false
        },
        // 优化Y轴标签样式，确保居中显示
        axisLabel: {
          color: 'rgba(255,255,255,.8)',
          fontSize: 10,
          interval: 0,
          textAlign: 'center',
          padding: [0, 10, 0, 10] // 增加内边距，让文本更居中
        },
        data: companies
      },
      series: [
        {
          name: '论文合著者数量',
          type: 'bar',
          xAxisIndex: 0,
          data: paperData.map(value => -value), // 负值，向左延伸
          itemStyle: {
            color: '#FF6B6B',
            borderRadius: [4, 0, 0, 4] // 左侧圆角
          },
          label: {
            show: true,
            position: 'left',
            color: '#FF6B6B',
            fontSize: 10,
            formatter: function(params) {
              return Math.abs(params.value); // 显示绝对值
            }
          }
        },
        {
          name: '专利发明人数量',
          type: 'bar',
          xAxisIndex: 1,
          data: patentData,
          itemStyle: {
            color: '#4ECDC4',
            borderRadius: [0, 4, 4, 0] // 右侧圆角
          },
          label: {
            show: true,
            position: 'right',
            color: '#4ECDC4',
            fontSize: 10
          }
        }
      ]
    };

    window.chartManager.updateChart('collaborationChart', option);
  }

  /**
   * 创建创新主体地位图表 - 倒T字形横向柱状图
   */
  function createStatusChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    
    // 左侧数据：论文相关指标
    const paperDegreeData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['论文合著网络节点度数']
    );
    const paperCentralityData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['论文合著网络特征向量中心性']
    );
    
    // 右侧数据：专利相关指标
    const patentDegreeData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['专利合作网络节点度数']
    );
    const patentCentralityData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['专利合作网络特征向量中心性']
    );

    // 计算最大值
    const maxLeft = Math.max(...[...paperDegreeData, ...paperCentralityData]) * 1.2;
    const maxRight = Math.max(...[...patentDegreeData, ...patentCentralityData]) * 1.2;

    const option = {
      tooltip: {
        trigger: 'axis',
        textStyle: {
          fontSize: 10
        },
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(function(item) {
            // 显示绝对值
            const absValue = Math.abs(item.value);
            result += item.marker + item.seriesName + ': ' + absValue + '<br/>';
          });
          return result;
        }
      },
      legend: {
        data: [
          '论文合著网络节点度数',
          '论文合著网络特征向量中心性',
          '专利合作网络节点度数',
          '专利合作网络特征向量中心性'
        ],
        bottom: '0',
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10
        },
        itemGap: 10,
        itemWidth: 10,
        itemHeight: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true
      },
      xAxis: [
        {
          // 左侧X轴
          type: 'value',
          position: 'bottom',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10,
            formatter: function(value) {
              return Math.abs(value);
            }
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          },
          min: -maxLeft,
          max: 0
        },
        {
          // 右侧X轴
          type: 'value',
          position: 'top',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          },
          min: 0,
          max: maxRight
        }
      ],
      yAxis: {
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: 'rgba(255,255,255,.8)',
          fontSize: 10,
          interval: 0
        },
        data: companies
      },
      series: [
        {
          name: '论文合著网络节点度数',
          type: 'bar',
          xAxisIndex: 0,
          data: paperDegreeData.map(value => -value),
          itemStyle: {
            color: '#FF6B6B',
            borderRadius: [4, 0, 0, 4]
          },
          label: {
            show: true,
            position: 'left',
            color: '#FF6B6B',
            fontSize: 8,
            formatter: function(params) {
              return Math.abs(params.value);
            }
          }
        },
        {
          name: '论文合著网络特征向量中心性',
          type: 'bar',
          xAxisIndex: 0,
          data: paperCentralityData.map(value => -value),
          itemStyle: {
            color: '#FFA8A8',
            borderRadius: [4, 0, 0, 4]
          },
          label: {
            show: true,
            position: 'left',
            color: '#FFA8A8',
            fontSize: 8,
            formatter: function(params) {
              return Math.abs(params.value);
            }
          }
        },
        {
          name: '专利合作网络节点度数',
          type: 'bar',
          xAxisIndex: 1,
          data: patentDegreeData,
          itemStyle: {
            color: '#4ECDC4',
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#4ECDC4',
            fontSize: 8
          }
        },
        {
          name: '专利合作网络特征向量中心性',
          type: 'bar',
          xAxisIndex: 1,
          data: patentCentralityData,
          itemStyle: {
            color: '#A8EEE4',
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#A8EEE4',
            fontSize: 8
          }
        }
      ]
    };

    window.chartManager.updateChart('collaborationChart', option);
  }

  /**
   * 创建创新协作水平图表 - 倒T字形横向柱状图
   */
  function createLevelChart(data) {
    const companies = data.slice(0, 10).map(item => item.企业中文简称);
    const intlPaperData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['国际合作论文数']
    );
    const coopPatentData = data.slice(0, 10).map(item => 
      item.创新协作[currentSecondaryIndicator]['合作专利数']
    );

    // 计算最大值
    const maxLeft = Math.max(...intlPaperData) * 1.2;
    const maxRight = Math.max(...coopPatentData) * 1.2;

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        textStyle: {
          fontSize: 10
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            result += param.marker + param.seriesName + ': ' + Math.abs(param.value) + '<br/>';
          });
          return result;
        }
      },
      legend: {
        data: ['国际合作论文数', '合作专利数'],
        bottom: '0',
        textStyle: {
          color: "rgba(255,255,255,.5)",
          fontSize: 10
        },
        itemGap: 10,
        itemWidth: 10,
        itemHeight: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true
      },
      xAxis: [
        {
          // 左侧X轴
          type: 'value',
          position: 'bottom',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10,
            formatter: function(value) {
              return Math.abs(value);
            }
          },
          axisLine: {
            show:false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,.1)'
            }
          },
          min: -maxLeft,
          max: 0
        },
        {
          // 右侧X轴
          type: 'value',
          position: 'top',
          axisLabel: {
            color: 'rgba(255,255,255,.6)',
            fontSize: 10
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: { show: false },
          min: 0,
          max: maxRight
        }
      ],
      yAxis: {
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: 'rgba(255,255,255,.8)',
          fontSize: 10,
          interval: 0
        },
        data: companies
      },
      series: [
        {
          name: '国际合作论文数',
          type: 'bar',
          xAxisIndex: 0,
          data: intlPaperData.map(value => -value),
          itemStyle: {
            color: '#45B7D1',
            borderRadius: [4, 0, 0, 4]
          },
          label: {
            show: true,
            position: 'left',
            color: '#45B7D1',
            fontSize: 10,
            formatter: function(params) {
              return Math.abs(params.value);
            }
          }
        },
        {
          name: '合作专利数',
          type: 'bar',
          xAxisIndex: 1,
          data: coopPatentData,
          itemStyle: {
            color: '#96CEB4',
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#96CEB4',
            fontSize: 10
          }
        }
      ]
    };

    window.chartManager.updateChart('collaborationChart', option);
  }

  /**
   * 初始化创新协作图表
   */
  async function init() {
    await loadCollaborationData();
    
    window.collaborationChart = {
      reloadData: loadCollaborationData,
      updateChart: updateCollaborationChart
    };
  }

  // 启动应用
  init();
})();

/**
 * 地图：世界地图模块
 */
function initWorldMap() {
  // 获取MapChart元素
  const mapChartElement = document.querySelector('.MapChart');
  if (!mapChartElement) {
    console.error('MapChart元素不存在');
    return;
  }
  
  // 确保ECharts已加载
  if (typeof echarts === 'undefined') {
    console.error('ECharts未加载');
    return;
  }
  
  // 初始化图表实例
  const mapChart = echarts.init(mapChartElement);
  
  // 用于存储选中的国家
  let selectedCountries = [];
  let countryData = {}; // 存储所有国家数据
  
  // 加载世界地图GeoJSON数据
  fetch('json/worldZH.json')
    .then(response => response.json())
    .then(worldJson => {
      // 注册世界地图
      echarts.registerMap('world', worldJson);
      
      // 从JSON文件加载国家数据
      return fetch('json/country-total-freq.json').then(response => response.json());
    })
    .then(data => {
      countryData = data;      
      // 获取当前年份选择器的值
      const getCurrentYear = () => {
        return document.getElementById('yearSelect')?.value || '2024';
      };
      
      // 更新地图数据的函数
      const updateMapData = (year) => {
        // 获取对应年份的数据
        const yearData = countryData[year] || countryData["2024"];
        
        // 转换数据格式，确保与地图名称匹配
        const formattedData = yearData.map(item => {
          // 统一国家名称，确保与地图数据匹配
          let countryName = item.name;
          if (countryName === "中国大陆") {
            countryName = "中国";
          } else if (countryName === "中国台湾") {
            countryName = "台湾";
          }
          return {
            name: countryName,
            value: item.freq, // 使用freq作为value
            freq: item.freq,  // 同时保留freq字段
            itemStyle: {
              areaColor: 'rgb(10, 155, 227)', // 深色（比默认的浅蓝深一点）
              borderColor: 'rgb(53, 146, 192)',
              borderWidth: 0.5
            }
          };
        });
        
        // 设置地图配置
        const option = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            formatter: function(params) {
              const data = params.data || {};
              return params.name + '<br/>'
                    + '企业上榜总频次: ' + (data.freq || '-');
            },
            backgroundColor: 'rgba(0, 0, 0, 0.34)',
            borderColor: '#333',
            textStyle: {
              color: '#fff',
              fontSize: 10
            }
          },
          series: [{
            name: '世界地图',
            type: 'map',
            map: 'world',
            roam: false,//禁止缩放和拖动
            scaleLimit: {
              min: 1,
              max: 5
            },
            zoom: 1.3,//初始缩放级别
            label: {
              show: false
            },
            //鼠标悬停高亮样式
            emphasis: {
              label: {
                show: true,
                fontSize: 9,
                fontWeight: 'bold',
                color: '#fff'
              },
              itemStyle: {
                areaColor: 'rgb(240, 225, 60)',
                borderWidth: 0.8,
                borderColor: 'rgb(240, 239, 233)'
              }
            },
            //默认样式
            itemStyle: {
              areaColor: 'rgb(102, 204, 255)',
              borderColor: 'rgb(36, 170, 237)',
              borderWidth: 0.5
            },
            data: formattedData
          }]
        };
        
        // 设置配置
        mapChart.setOption(option);
      };
      
      // 初始化地图数据
      updateMapData(getCurrentYear());
      
      // 年份选择器的change事件已经在industry-manager.js中处理了
      // 这里不再重复添加事件监听器
      
      // 监听产业变化事件，更新地图数据
      document.addEventListener('industryChanged', (event) => {
        const { year } = event.detail;
        updateMapData(year);
      });
      
      // 添加点击事件
        mapChart.on('click', function(params) {          
          // 获取当前年份
          const currentYear = getCurrentYear();
          // 获取当前年份的数据
          const yearData = countryData[currentYear] || countryData["2024"];
          
          // 检查点击的国家是否存在于当前年份的数据中
          const countryExists = yearData.some(item => {
            // 统一国家名称匹配逻辑
            let countryName = item.name;
            if (countryName === "中国大陆") countryName = "中国";
            else if (countryName === "中国台湾") countryName = "台湾";
            return countryName === params.name;
          });
          
          // 只有存在数据的国家才响应点击事件
          if (countryExists) {
            // 如果已经选中了两个国家，重置选择
            if (selectedCountries.length >= 2) {
              selectedCountries = [];
            }
            
            // 添加当前选中的国家
            selectedCountries.push(params.name);
            
            if (selectedCountries.length === 1) {
              // 第一次点击，提示用户选择另一个国家
              // 创建自定义小弹窗
              const customAlert = document.createElement('div');
              customAlert.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(47, 137, 207, 0.9);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 9999;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                text-align: center;
              `;
              customAlert.textContent = '请选择另一个国家';
              document.body.appendChild(customAlert);
              
              // 2秒后自动消失
              setTimeout(() => {
                document.body.removeChild(customAlert);
              }, 2000);
            } else if (selectedCountries.length === 2) {
              // 第二次点击，跳转到对比页面
              const country1 = selectedCountries[0];
              const country2 = selectedCountries[1];
                            
              // 构建URL
              const url = `country-detail.html?country1=${encodeURIComponent(country1)}&country2=${encodeURIComponent(country2)}&year=${currentYear}`;
              
              // 新开窗口跳转到国家对比页面
              window.open(url, '_blank');
            }
          } else {
            // 可选：给用户提示该国家没有数据
            console.log('该国家在当前年份没有数据');
          }
        });
      
      // 响应式调整
      window.addEventListener('resize', function() {
        mapChart.resize();
      });
    })
    .catch(error => {
      console.error('加载地图数据失败:', error);
      mapChartElement.innerHTML = '<div style="text-align: center; padding: 50px; color: white;">地图加载失败</div>';
    });
}

// 初始化图表
(function() {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initWorldMap();
      // 注意：initChinaMap函数在index.js中定义，此处不再重复调用
    });
  } else {
    // DOM已经加载完成
    initWorldMap();
  }
})();
