/**
 * 数据处理工具模块
 * 提供通用的数据处理和转换功能
 */
class DataUtils {
  /**
   * 过滤有效数据（排除'/'）
   * @param {Array} data - 原始数据
   * @param {Array} columns - 列名数组
   * @returns {Array} 过滤后的数据
   */
  filterValidData(data, columns) {
    return data.filter(item => {
      return columns.some(col => {
        return item[col] !== '/' && parseInt(item[col]) > 0;
      });
    });
  }

  /**
   * 计算国家总数并排序
   * @param {Array} data - 国家数据
   * @param {Array} filterColumns - 需要计算的列
   * @returns {Array} 排序后的国家数据
   */
  calculateCountryTotals(data, filterColumns) {
    const countryTotals = data.map(item => {
      let total = 0;
      filterColumns.forEach(col => {
        if (item[col] !== '/') {
          total += parseInt(item[col]);
        }
      });
      return {
        country: item['国家/地区'],
        total: total,
        data: item
      };
    });

    // 按总数降序排序
    countryTotals.sort((a, b) => a.total - b.total);
    return countryTotals;
  }

  /**
   * 处理原始数据为对象格式
   * @param {Array} rawData - 原始数组数据
   * @param {Array} columns - 列名数组
   * @returns {Array} 处理后的对象数组
   */
  processRawData(rawData, columns) {
    return rawData.map(row => {
      const item = {};
      columns.forEach((col, index) => {
        item[col] = row[index];
      });
      return item;
    });
  }

  /**
   * 获取当前产业的列
   * @param {Array} columns - 所有列名
   * @param {string} selectedIndustry - 选中的产业
   * @returns {Array} 过滤后的列名
   */
  getIndustryColumns(columns, selectedIndustry) {
    // 使用正则表达式进行精确匹配，确保只匹配完整的产业名称
    // 列名格式为 "产业名_前10"、"产业名_前50" 和 "产业名_前100"
    const regex = new RegExp(`^${selectedIndustry}_(前10|前50|前100)$`);
    let matchedColumns = columns.filter(col => regex.test(col));
    
    // 处理生物产业双名称问题
    if (matchedColumns.length === 0) {
      let alternativeIndustry = '';
      if (selectedIndustry === '生物产业') {
        alternativeIndustry = '生物';
      } else if (selectedIndustry === '生物') {
        alternativeIndustry = '生物产业';
      }
      
      if (alternativeIndustry) {
        const alternativeRegex = new RegExp(`^${alternativeIndustry}_(前10|前50|前100)$`);
        matchedColumns = columns.filter(col => alternativeRegex.test(col));
      }
    }
    
    return matchedColumns;
  }

  /**
   * 格式化数字（保留两位小数）
   * @param {number} value - 原始数值
   * @returns {string} 格式化后的字符串
   */
  formatNumber(value) {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  }

  /**
   * 安全转换为数字
   * @param {string} value - 原始值
   * @returns {number} 转换后的数字
   */
  safeParseInt(value) {
    if (value === '/') return 0;
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }
}

window.dataUtils = new DataUtils();