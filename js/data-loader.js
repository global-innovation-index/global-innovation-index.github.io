/**
 * 公共数据加载模块
 * 负责所有JSON数据的加载、缓存和错误处理
 */
class DataLoader {
  constructor() {
    this.cache = new Map(); // 数据缓存，避免重复请求
  }

  /**
   * 加载JSON数据
   * @param {string} url - JSON文件路径
   * @returns {Promise} 解析后的JSON数据
   */
  async loadJSON(url) {
    // 检查缓存中是否已有数据
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 将数据存入缓存
      this.cache.set(url, data);
      return data;
    } catch (error) {
      console.error(`加载数据失败 (${url}):`, error);
      throw error;
    }
  }

  /**
   * 显示加载状态
   * @param {string} containerId - 容器元素ID
   */
  showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="loading">正在加载数据...</div>';
    }
  }

  /**
   * 显示错误信息
   * @param {string} containerId - 容器元素ID
   * @param {string} message - 错误消息
   */
  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  /**
   * 清空容器内容
   * @param {string} containerId - 容器元素ID
   */
  clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}

// 创建全局实例，供所有模块使用
window.dataLoader = new DataLoader();
