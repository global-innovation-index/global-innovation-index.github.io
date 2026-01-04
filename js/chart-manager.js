/**
 * 图表管理器模块
 * 负责ECharts图表的创建、管理和销毁
 */
class ChartManager {
  constructor() {
    this.charts = new Map(); // 存储所有图表实例
  }

  /**
   * 注册图表实例
   * @param {string} chartId - 图表ID
   * @param {Object} chartInstance - ECharts实例
   */
  registerChart(chartId, chartInstance) {
    this.charts.set(chartId, chartInstance);
  }

  /**
   * 获取图表实例
   * @param {string} chartId - 图表ID
   * @returns {Object} ECharts实例
   */
  getChart(chartId) {
    return this.charts.get(chartId);
  }

  /**
   * 初始化图表
   * @param {string} containerId - 容器元素ID
   * @param {Object} option - ECharts配置项
   * @returns {Object} ECharts实例
   */
  initChart(containerId, option) {
    const chart = echarts.init(document.getElementById(containerId));
    
    // 设置初始配置
    if (option) {
      chart.setOption(option, true);
    }
    
    // 注册图表
    this.registerChart(containerId, chart);
    
    // 添加窗口大小变化监听，实现响应式
    window.addEventListener('resize', () => {
      chart.resize();
    });
    
    return chart;
  }

  /**
   * 更新图表配置
   * @param {string} chartId - 图表ID
   * @param {Object} option - 新的ECharts配置项
   */
  updateChart(chartId, option) {
    const chart = this.getChart(chartId);
    if (chart) {
      chart.setOption(option, true);
    }
  }

  /**
   * 销毁单个图表
   * @param {string} chartId - 图表ID
   */
  destroyChart(chartId) {
    const chart = this.getChart(chartId);
    if (chart) {
      chart.dispose();
      this.charts.delete(chartId);
    }
  }

  /**
   * 销毁所有图表
   */
  destroyAllCharts() {
    this.charts.forEach((chart, chartId) => {
      chart.dispose();
    });
    this.charts.clear();
  }
}

window.chartManager = new ChartManager();
