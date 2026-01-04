/**
 * 产业数据管理模块
 * 负责管理年份切换、产业数据加载和展示
 */
class IndustryManager {
  constructor() {
    this.currentIndustry = '未来信息';  // 当前选中的产业，默认选中未来信息
    this.currentYear = '2025';          // 当前选中的年份
    this.industryData = null;           // 存储加载的JSON数据
    // 不同年份对应的产业配置
    this.industryConfig = {
      '2024': [
        { key: '新一代信息技术', name: '新一代信息技术' },
        { key: '高端装备制造', name: '高端装备制造' },
        { key: '新材料', name: '新材料' },
        { key: '生物产业', name: '生物产业' },
        { key: '新能源汽车', name: '新能源汽车' },
        { key: '新能源', name: '新能源' }
      ],
      '2025': [
        { key: '未来信息', name: '未来信息' },
        { key: '未来制造', name: '未来制造' },
        { key: '未来材料', name: '未来材料' },
        { key: '未来健康', name: '未来健康' },
        { key: '未来能源', name: '未来能源' }
      ]
    };
  }

  /**
   * 加载产业排名数据
   * @returns {Promise} 加载完成的Promise
   */
  async loadIndustryData() {
    try {
      // 使用全局dataLoader加载JSON数据
      this.industryData = await window.dataLoader.loadJSON('json/global_innovation_index_rankings.json');
      return this.industryData;
    } catch (error) {
      console.error('加载产业数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定年份的企业数据
   * @param {string} year - 年份
   * @param {string} industry - 产业名称
   * @returns {Array} 企业数据数组
   */
  getCompanyDataByYearAndIndustry(year, industry) {
    if (!this.industryData || !this.industryData[year]) {
      return [];
    }
    
    // 处理生物产业命名不一致问题：支持"生物"和"生物产业"两种键名
    let data = this.industryData[year][industry] || [];
    
    // 如果当前产业是"生物产业"但找不到数据，尝试使用"生物"
    if (industry === "生物产业" && data.length === 0) {
      data = this.industryData[year]["生物"] || [];
    }
    
    // 如果当前产业是"生物"但找不到数据，尝试使用"生物产业"
    if (industry === "生物" && data.length === 0) {
      data = this.industryData[year]["生物产业"] || [];
    }
    
    return data;
  }

  /**
   * 获取产业平均综合得分
   * @param {string} year - 年份
   * @param {string} industry - 产业名称
   * @returns {number} 平均得分
   */
  getIndustryAverageScore(year, industry) {
    const companies = this.getCompanyDataByYearAndIndustry(year, industry);
    if (!companies || companies.length === 0) {
      return 0;
    }
    
    // 计算综合得分平均值（第四列数据）
    const totalScore = companies.reduce((sum, company) => {
      // 企业数据格式为 [排名, 企业名称, 国家/地区, 多个得分值]
      // 综合得分为第四列
      return sum + (parseFloat(company[3]) || 0);
    }, 0);
    
    return (totalScore / companies.length).toFixed(1);
  }

  /**
   * 更新产业指数展示模块
   * 根据当前年份更新产业名称和得分
   */
  updateIndustryScoreModule() {
    const industries = this.industryConfig[this.currentYear];
    const yearBtns = document.querySelectorAll('.year-btn');
    const industryItems = document.querySelectorAll('.industry-item');
    
    // 更新年份按钮状态
    yearBtns.forEach(btn => {
      const year = btn.getAttribute('data-year');
      if (year === this.currentYear) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // 重置所有产业项显示
    industryItems.forEach(item => {
      item.style.display = 'none';
      item.classList.remove('active'); // 移除所有active类
    });
    
    // 更新产业项显示
    industries.forEach((industry, index) => {
      const item = industryItems[index];
      if (item) {
        // 显示该产业项
        item.style.display = 'block';
        // 更新data-industry属性
        item.setAttribute('data-industry', industry.key);
        
        // 更新标签显示
        const label = item.querySelector('.industry-item--label');
        if (label) {
          label.textContent = industry.name;
        }
        
        // 更新进度条数据和显示
        const progress = item.querySelector('.industry-item--el-progress');
        const percentage = item.querySelector('.progress-percentage');
        let score = 0;
        
        if (progress && percentage) {
          // 获取当前企业名称
          const companyName = this.getCurrentCompanyName();
          
          // 尝试根据企业名称查找匹配的数据行
          const companyData = this.getCompanyDataByYearIndustryAndName(this.currentYear, industry.key, companyName);
          
          if (companyData) {
            // 找到了匹配企业，使用其第四列数据
            score = companyData[3];
          } else {
            // 如果找不到匹配企业，显示为0
            score = 0;
          }
          
          // 更新数据属性
          progress.setAttribute('data-value', score);
          
          // 更新百分比文本，确保显示为数值
          percentage.textContent = score;
          
          // 设置进度条背景宽度，使用正确的百分比值
          progress.style.setProperty('--progress-width', `${score}%`);
          progress.style.width = '150px'; // 确保进度条宽度不变
        }
        
        // 添加点击事件 - 只有当产业得分不为0时才允许点击
        if (score !== 0) {
          item.onclick = () => {
            this.switchIndustry(industry.key);
          };
          item.style.cursor = 'pointer';
          item.classList.remove('disabled');
        } else {
          // 得分为0时，移除点击事件并添加禁用样式
          item.onclick = null;
          item.style.cursor = 'not-allowed';
          item.classList.add('disabled');
        }
        
        // 为第一个产业项添加默认选中状态
        if (index === 0 && !this.currentIndustry) {
          this.currentIndustry = industry.key;
        }
      }
    });
    
    // 设置选中状态
    this.updateIndustryItemState(this.currentIndustry);
    
    // 检查当前激活产业的得分，如果为0，则自动切换到第一个得分不为0的产业
    const currentIndustryItem = document.querySelector(`.industry-item[data-industry="${this.currentIndustry}"]`);
    if (currentIndustryItem) {
      const currentProgress = currentIndustryItem.querySelector('.industry-item--el-progress');
      if (currentProgress) {
        const currentScore = parseFloat(currentProgress.getAttribute('data-value'));
        if (currentScore === 0) {
          // 遍历所有产业项，找到第一个得分不为0的产业
          const industryItems = document.querySelectorAll('.industry-item');
          let firstNonZeroIndustry = null;
          
          for (const item of industryItems) {
            const progress = item.querySelector('.industry-item--el-progress');
            if (progress) {
              const score = parseFloat(progress.getAttribute('data-value'));
              if (score !== 0) {
                firstNonZeroIndustry = item.getAttribute('data-industry');
                break;
              }
            }
          }
          
          // 如果找到非零得分产业，则切换到该产业
          if (firstNonZeroIndustry) {
            this.switchIndustry(firstNonZeroIndustry);
            
            // 模拟点击事件，确保所有相关的数据都能正确更新
            setTimeout(() => {
              const firstNonZeroIndustryItem = document.querySelector(`.industry-item[data-industry="${firstNonZeroIndustry}"]`);
              if (firstNonZeroIndustryItem && typeof firstNonZeroIndustryItem.click === 'function') {
                firstNonZeroIndustryItem.click();
              }
            }, 50);
          }
        }
      }
    }
  }

  /**
   * 更新产业项的选中状态
   * @param {string} industry - 当前选中的产业
   */
  updateIndustryItemState(industry) {
    // 移除所有产业项的active类和industry-item--active类
    document.querySelectorAll('.industry-item').forEach(item => {
      item.classList.remove('active');
      item.classList.remove('industry-item--active');
    });
    
    // 为当前选中的产业项添加active类
    const activeItem = document.querySelector(`.industry-item[data-industry="${industry}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      // 同时添加industry-item--active以兼容可能的CSS选择器
      activeItem.classList.add('industry-item--active');
    }
  }

  /**
   * 切换产业
   * @param {string} industry - 产业标识
   */
  switchIndustry(industry) {
    this.currentIndustry = industry;
    this.updateIndustryItemState(industry);
    // 确保触发产业变化事件
    this.triggerIndustryChanged();
  }

  /**
   * 切换年份
   * @param {string} year - 年份
   */
  async switchYear(year) {
    this.currentYear = year;
    
    // 确保数据已加载
    if (!this.industryData) {
      await this.loadIndustryData();
    }
    
    // 检查当前产业是否存在于新年份的产业配置中
    const industries = this.industryConfig[this.currentYear];
    const industryExists = industries.some(industry => industry.key === this.currentIndustry);
    
    // 如果当前产业不存在于新年份的产业配置中，切换到新年份的第一个产业
    if (!industryExists) {
      this.currentIndustry = industries[0].key;
    }
    
    // 先更新产业数据显示，获取最新的产业得分
    this.updateIndustryScoreModule();
    
    // 检查当前激活产业的得分
    const currentIndustryItem = document.querySelector(`.industry-item[data-industry="${this.currentIndustry}"]`);
    let currentScore = 0;
    if (currentIndustryItem) {
      const currentProgress = currentIndustryItem.querySelector('.industry-item--el-progress');
      if (currentProgress) {
        currentScore = parseFloat(currentProgress.getAttribute('data-value'));
      }
    }
    
    // 如果当前产业得分为0，查找第一个非零得分产业
    if (currentScore === 0) {
      // 遍历所有产业项，找到第一个得分不为0的产业
      const industryItems = document.querySelectorAll('.industry-item');
      let firstNonZeroIndustry = null;
      
      for (const item of industryItems) {
        const progress = item.querySelector('.industry-item--el-progress');
        if (progress) {
          const score = parseFloat(progress.getAttribute('data-value'));
          if (score !== 0) {
            firstNonZeroIndustry = item.getAttribute('data-industry');
            break;
          }
        }
      }
      
      // 如果找到非零得分产业，则切换到该产业
      if (firstNonZeroIndustry) {
        this.switchIndustry(firstNonZeroIndustry);
        
        // 延迟触发点击事件，确保所有数据都已更新
        setTimeout(() => {
          const firstNonZeroIndustryItem = document.querySelector(`.industry-item[data-industry="${firstNonZeroIndustry}"]`);
          if (firstNonZeroIndustryItem && typeof firstNonZeroIndustryItem.click === 'function') {
            firstNonZeroIndustryItem.click();
          }
        }, 100);
      } else {
        // 没有找到非零得分产业，仍然触发产业变化事件
        this.triggerIndustryChanged();
      }
    } else {
      // 当前产业得分不为0，确保触发产业变化事件
      this.triggerIndustryChanged();
    }
    
  }

  /**
   * 更新按钮选中状态
   * @param {string} industry - 当前选中的产业
   */
  updateButtonState(industry) {
    // 移除所有按钮的active类
    document.querySelectorAll('.industry-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 为当前选中的按钮添加active类
    const activeBtn = document.querySelector(`[data-industry="${industry}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * 触发产业变化事件
   * 用于通知其他组件产业或年份发生了变化
   */
  triggerIndustryChanged() {
    const event = new CustomEvent('industryChanged', {
      detail: { 
        industry: this.currentIndustry,
        year: this.currentYear 
      }
    });
    document.dispatchEvent(event);
    
    // 触发产业变化后，默认选中知识创新指标
    setTimeout(() => {
      const knowledgeIndicator = document.querySelector('.index-score-1');
      if (knowledgeIndicator && typeof knowledgeIndicator.click === 'function') {
        knowledgeIndicator.click();
      }
    }, 100);
  }

  /**
   * 初始化年份选择器事件
   */
  initYearSelectorEvents() {
    // 为年份按钮添加点击事件
    document.querySelectorAll('.year-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', () => {
          const year = btn.getAttribute('data-year');
          this.switchYear(year);
        });
      }
    });
    
    // 为年份下拉选择框添加change事件监听
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        const year = yearSelect.value;
        this.switchYear(year);
      });
    }
  }

  /**
   * 获取当前年份下的所有产业
   * @returns {Array} 产业数组
   */
  getCurrentIndustries() {
    return this.industryConfig[this.currentYear];
  }

  /**
   * 获取当前选中的产业
   * @returns {string} 产业标识
   */
  getCurrentIndustry() {
    return this.currentIndustry;
  }

  /**
   * 获取当前选中的年份
   * @returns {string} 年份
   */
  getCurrentYear() {
    return this.currentYear;
  }
  
  /**
   * 获取当前页面的企业名称
   * 从URL参数或全局变量中获取
   * @returns {string} 企业名称
   */
  getCurrentCompanyName() {
    // 尝试从window对象获取企业名称（如果在页面加载后设置）
    if (window.currentParams && window.currentParams.company) {
      return window.currentParams.company;
    }
    
    // 尝试从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('company') || '';
  }
  
  /**
   * 根据年份、产业和企业名称获取企业数据
   * @param {string} year - 年份
   * @param {string} industry - 产业名称
   * @param {string} companyName - 企业名称
   * @returns {Array|null} 企业数据数组或null
   */
  getCompanyDataByYearIndustryAndName(year, industry, companyName) {
    // 处理生物产业命名不一致问题：尝试两种可能的产业名称
    let companies = this.getCompanyDataByYearAndIndustry(year, industry);
    
    // 如果当前产业是"生物产业"但找不到匹配企业，尝试使用"生物"
    if (industry === "生物产业" && (!companies || companies.length === 0)) {
      companies = this.getCompanyDataByYearAndIndustry(year, "生物");
    }
    
    // 如果当前产业是"生物"但找不到匹配企业，尝试使用"生物产业"
    if (industry === "生物" && (!companies || companies.length === 0)) {
      companies = this.getCompanyDataByYearAndIndustry(year, "生物产业");
    }
    
    if (!companies || !companyName) {
      return null;
    }
    
    // 查找匹配的企业数据
    return companies.find(company => company[1] === companyName) || null;
  }

  /**
   * 初始化产业指数模块
   */
  initIndustryScoreModule() {
    // 初始化年份选择器事件
    this.initYearSelectorEvents();
    
    // 加载产业数据并更新显示
    this.loadIndustryData().then(() => {
      // 确保年份选择器的值与当前年份一致
      const yearSelect = document.getElementById('yearSelect');
      if (yearSelect && yearSelect.value !== this.currentYear) {
        yearSelect.value = this.currentYear;
      }
      
      // 更新产业指数显示
      this.updateIndustryScoreModule();
      
      // 触发产业变化事件，确保其他组件获取最新数据
      this.triggerIndustryChanged();
    }).catch(error => {
      console.error('初始化产业指数模块失败:', error);
    });
  }

  /**
   * 修正进度条样式
   */
  fixProgressBarStyles() {
    // 为所有进度条设置正确的宽度
    document.querySelectorAll('.industry-item--el-progress').forEach(progress => {
      const value = parseFloat(progress.getAttribute('data-value')) || 0;
      
      // 设置CSS变量控制进度条宽度
      progress.style.setProperty('--progress-width', `${value}%`);
      
      // 创建或更新内联样式确保进度显示正确
      let styleElement = document.getElementById('progress-bar-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'progress-bar-style';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        .industry-item--el-progress::after {
          width: var(--progress-width, 0%) !important;
        }
      `;
      
      // 确保百分比文本正确显示
      const percentage = progress.querySelector('.progress-percentage');
      if (percentage) {
        percentage.textContent = value;
      }
    });
  }
  
  /**
   * 更新所有进度条的显示
   */
  updateProgressBars() {
    this.fixProgressBarStyles();
  }

  /**
   * 初始化模块
   */
  init() {
    // 当DOM加载完成后初始化产业指数模块
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initIndustryScoreModule());
    } else {
      this.initIndustryScoreModule();
    }
  }
}

// 创建全局实例，供所有模块使用
window.industryManager = new IndustryManager();

// 监听DOM加载完成事件
window.addEventListener('DOMContentLoaded', () => {
  // 直接初始化年份选择器事件和产业指数模块
  window.industryManager.initYearSelectorEvents();
  window.industryManager.initIndustryScoreModule();
});