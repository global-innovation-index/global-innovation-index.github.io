// 全局变量定义
let country1 = '日本';
let country2 = '美国';
let selectedYear = '2025';
let selectedIndustry = '未来信息';

// 获取URL参数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    country1 = params.get('country1') || '日本';
    country2 = params.get('country2') || '美国';
    selectedYear = params.get('year') || '2025';
    
    // 设置年份选择器
    $('#yearSelect').val(selectedYear);
}

// 获取指定年份的国家列表
function getCountryList(year) {
    return $.getJSON('json/country-total-freq.json').then(function(data) {
        var yearData = data[year] || data["2024"];
        return yearData.map(function(item) { return item.name; });
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('加载国家列表失败:', textStatus, errorThrown);
        return [];
    });
}

// 动态生成国家选择器选项
function generateCountrySelectOptions(selectId, selectedCountry, year) {
    getCountryList(year).then(function(countries) {
        var select = $('#' + selectId);
        select.empty();
        
        countries.forEach(function(country) {
            // 如果是另一个选择器的当前值，则禁用此选项
            var otherSelectId = selectId === 'country1Select' ? 'country2Select' : 'country1Select';
            var otherSelectedCountry = $('#' + otherSelectId).val();
            var isDisabled = country === otherSelectedCountry;
            
            // 灵活匹配国家名称，处理"中国"和"中国大陆"的情况
            var isSelected = false;
            if (country === selectedCountry) {
                isSelected = true;
            } else if ((country === "中国" && selectedCountry === "中国大陆") || 
                       (country === "中国大陆" && selectedCountry === "中国")) {
                isSelected = true;
            }
            
            select.append('<option value="' + country + '" ' + 
                         (isSelected ? 'selected' : '') + 
                         (isDisabled ? ' disabled' : '') + '>' + country + '</option>');
        });
    });
}

// 初始化事件监听器
function initEventListeners() {
    // 年份选择器事件
    $('#yearSelect').change(function() {
        selectedYear = $(this).val();
        updateCountryData(country1, country2, selectedYear);
        
        // 年份改变时，重新生成国家选择器选项
        generateCountrySelectOptions('country1Select', country1, selectedYear);
        generateCountrySelectOptions('country2Select', country2, selectedYear);
        
        // 获取新年份的产业列表，默认选择第一个产业
        getIndustryList(selectedYear).then(function(industries) {
            selectedIndustry = industries[0] || '未来信息';
            
            // 年份改变时重新生成产业按钮，使用新年份的第一个产业作为默认激活
            generateIndustryButtons(selectedYear, selectedIndustry);
            
            // 更新图表和表格
            updateCharts();
        });
    });
    
    // 左侧国家选择器事件
    $('#country1Select').change(function() {
        var newCountry = $(this).val();
        if (newCountry !== country2) {
            country1 = newCountry;
            updateCountryData(country1, country2, selectedYear);
            updateCountryInfo(country1, country2);
            updateCharts();
            
            // 更新右侧选择器的禁用选项
            generateCountrySelectOptions('country2Select', country2, selectedYear);
        }
    });
    
    // 右侧国家选择器事件
    $('#country2Select').change(function() {
        var newCountry = $(this).val();
        if (newCountry !== country1) {
            country2 = newCountry;
            updateCountryData(country1, country2, selectedYear);
            updateCountryInfo(country1, country2);
            updateCharts();
            
            // 更新左侧选择器的禁用选项
            generateCountrySelectOptions('country1Select', country1, selectedYear);
        }
    });
}

// 更新国家信息（标题和国旗）
function updateCountryInfo(country1, country2) {
    // 更新国家标题
    $('#country1Title').text(country1);
    $('#country2Title').text(country2);
    
    // 更新企业数据表格标题
    $('#country1TableTitle').text(country1 + '企业数据');
    $('#country2TableTitle').text(country2 + '企业数据');
    
    // 这里可以添加国旗更新逻辑，如果需要的话
}

// 修改产业按钮点击事件，确保表格也能更新
// generateIndustryButtons函数在第155行有完整实现

// 从JSON文件获取国家数据
function getCountryData(countryName, year) {
    // 使用jQuery的getJSON方法加载数据源
    return $.getJSON('json/country-total-freq.json').then(function(data) {
        var yearData = data[year] || data["2024"];
        
        // 调试：打印所有国家名称
        var allCountryNames = yearData.map(function(item) { return item.name; });
        
        // 灵活匹配国家名称
        var countryData = yearData.find(function(item) {
            // 直接匹配
            if (item.name === countryName) return true;
            
            // 特别处理"中国"和"中国大陆"的匹配
            if (countryName === "中国" && item.name === "中国大陆") return true;
            if (countryName === "中国大陆" && item.name === "中国") return true;
            
            // 特别处理"中国台湾"的情况
            if (countryName === "中国台湾" && item.name === "中国台湾") return true;
            
            return false;
        });
        
        
        // 如果没有找到，返回默认数据
        if (!countryData) {
            return {
                name: countryName,
                code: "XX",
                rank: "N/A"
            };
        }
        
        return countryData;
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('加载数据失败:', textStatus, errorThrown);
        // 加载失败时返回默认数据
        return {
            name: countryName,
            code: "XX",
            rank: "N/A"
        };
    });
}

// 国旗图片缓存对象，用于存储已加载的图片
const flagImageCache = {};

// 预加载常用国家的国旗图片
function preloadFlagImages() {
    // 常用国家代码列表，可以根据实际使用情况调整
    const commonCountryCodes = ['us', 'cn', 'jp', 'de', 'gb', 'fr', 'ca', 'au', 'kr', 'ru'];
    
    commonCountryCodes.forEach(code => {
        const img = new Image();
        img.src = getFlagUrl(code);
        flagImageCache[code] = img;
    });
}

// 获取国旗图片URL
function getFlagUrl(countryCode) {
    // 使用CDN API获取国旗图片
    // https://flagcdn.com 是一个免费的国旗CDN服务
    // 使用w160尺寸平衡清晰度和加载速度
    return "https://flagcdn.com/w160/" + countryCode.toLowerCase() + ".png";
}

// 加载国旗图片（带缓存机制）
function loadFlagImage(flagElement, countryCode, countryName) {
    // 设置默认占位符
    flagElement.attr('src', '');
    flagElement.attr('alt', countryName + '国旗');
    
    // 如果图片已在缓存中，直接使用
    if (flagImageCache[countryCode]) {
        flagElement.attr('src', flagImageCache[countryCode].src);
        return;
    }
    
    // 否则创建新图片对象加载
    const img = new Image();
    img.onload = function() {
        // 图片加载完成后存入缓存
        flagImageCache[countryCode] = img;
        flagElement.attr('src', img.src);
    };
    img.onerror = function() {
        // 加载失败时使用默认图片或保持空白
        console.error('加载国旗图片失败:', countryCode);
    };
    img.src = getFlagUrl(countryCode);
}

// 获取产业排名数据
function getIndustryRankData(year) {
    return $.getJSON('json/country-rank-data.json').then(function(data) {
        return data[year] || data["2024"];
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('加载产业排名数据失败:', textStatus, errorThrown);
        return null;
    });
}

// 从JSON文件获取产业列表
function getIndustryList(year) {
    return $.getJSON('json/industry-total.json').then(function(data) {
        return data[year] || data["2025"];
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('加载产业列表失败:', textStatus, errorThrown);
        // 加载失败时返回默认产业列表
        return ["未来信息", "未来制造", "未来材料", "未来健康", "未来能源"];
    });
}

// 动态生成产业按钮
// 删除重复的generateIndustryButtons函数定义



// 修改实际的generateIndustryButtons函数，更新点击事件
function generateIndustryButtons(year, currentIndustry) {
    
    getIndustryList(year).then(function(industries) {
        
        // 如果当前产业不在当年产业列表中，使用第一个产业作为默认
        if (industries.indexOf(currentIndustry) === -1) {
            currentIndustry = industries[0];
        }
        
        // 清空现有按钮
        var buttonContainer = $('#industryButtons');
        buttonContainer.empty();
        
        // 生成新按钮
        industries.forEach(function(industry) {
            var button = $('<button></button>')
                .addClass('industry-btn')
                .text(industry)
                .attr('data-industry', industry);
            
            // 设置当前选中的产业按钮为激活状态
            if (industry === currentIndustry) {
                button.addClass('active');
                // 更新全局变量
                selectedIndustry = currentIndustry;
            }
            
            // 添加点击事件
            button.click(function() {
                // 移除其他按钮的激活状态
                $('.industry-btn').removeClass('active');
                // 设置当前按钮为激活状态
                $(this).addClass('active');
                // 获取选中的产业
                selectedIndustry = $(this).attr('data-industry');
                // 更新图表和表格
                updateCharts();
            });
            
            // 添加到容器
            buttonContainer.append(button);
        });
    });
}

// 绘制单个国家的产业排名图表
function drawSingleIndustryChart(country, year, industry, chartContainerId, isRightCountry) {
    
    getIndustryRankData(year).then(function(data) {
        if (!data) {
            console.error('没有找到产业排名数据');
            return;
        }
        
        // 解析国家数据
        var countryData = null;
        
        data.countries.forEach(function(countryRow) {
            // 灵活匹配国家名称
            var matchCountry = false;
            
            if (countryRow[0] === country) matchCountry = true;
            
            // 特别处理"中国"和"中国大陆"的匹配
            if ((country === "中国" && countryRow[0] === "中国大陆") || 
                (country === "中国大陆" && countryRow[0] === "中国")) {
                matchCountry = true;
            }
            
            // 特别处理"中国台湾"的情况
            if (country === "中国台湾" && countryRow[0] === "中国台湾") {
                matchCountry = true;
            }
            
            if (matchCountry) countryData = countryRow;
        });
        
        
        // 获取产业对应的列索引
        // 2025年的产业索引
        var industryIndex = {
            "未来信息": [1, 2, 3],  // 前10, 前50, 前100
            "未来制造": [4, 5, 6],
            "未来材料": [7, 8, 9],
            "未来健康": [10, 11, 12],
            "未来能源": [13, 14, 15]
        };
        
        // 2024年的产业索引
        if (year === "2024") {
            industryIndex = {
                "新一代信息技术": [1, 2, 3],  // 前10, 前50, 前100
                "高端装备制造": [4, 5, 6],  // 前10, 前50, 前100
                "新材料": [7, 8, 9],  // 前10, 前50, 前100
                "生物医药": [10, 11, 12], // 前10, 前50, 前100
                "新能源": [13, 14, 15],  // 前10, 前50, 前100
                "新能源汽车": [16, 17, 18]  // 前10, 前50, 前100
            };
        }
        
        var indices = industryIndex[industry] || [1, 2, 3];
        
        // 准备图表数据
        var rankTypes = ['前10', '前50', '前100'];
        var countryValues = [];
        
        indices.forEach(function(index) {
            var value = countryData ? countryData[index] : '/';
            // 转换"/"为0
            countryValues.push(value === '/' ? 0 : parseInt(value));
        });
        
        
        // 初始化图表的函数
        function initChart() {
            // 检查图表容器是否存在
            var chartDom = document.getElementById(chartContainerId);
            if (!chartDom) {
                console.error('图表容器不存在:', chartContainerId);
                // 重试机制：如果容器不存在，100ms后重试
                setTimeout(initChart, 100);
                return;
            }
            
            // 确保容器有尺寸
            if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
                console.error('图表容器无尺寸:', chartContainerId);
                setTimeout(initChart, 100);
                return;
            }
            
            // 初始化图表实例
            var myChart = echarts.init(chartDom);
            
            // 基础配置
            var baseConfig = {
                title: {
                    text: industry + '入围产业数量排名',
                    left: 'center',
                    textStyle: {
                        color: '#fff',
                        fontSize: 14
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                xAxis: {
                    type: 'value',
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        color: '#fff'
                    },
                    axisLine: {
                        lineStyle: {
                            color: 'rgba(255, 255, 255, 0.3)'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    inverse: isRightCountry
                },
                series: [
                    {
                        name: country,
                        type: 'bar',
                        data: countryValues,
                        barWidth: 15,
                        itemStyle: {
                            color: isRightCountry ? '#91cc75' : '#5470c6'
                        },
                        label: {
                            show: false
                        }
                    }
                ]
            };

            // 根据是否是右侧图表添加特定配置
            if (isRightCountry) {
                // 右侧图表配置
                var rightOption = Object.assign({}, baseConfig, {
                    grid: {
                        left: '15%',
                        right: '10%',
                        // top: '20%',
                        bottom: '10%',
                        containLabel: true
                    },
                    yAxis: {
                        type: 'category',
                        data: rankTypes,
                        position: 'right',  // 明确设置Y轴在右侧
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            color: '#fff',
                            position: 'right'  // 明确设置Y轴标签在右侧
                        },
                        axisLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            onZero: false  // 确保轴线在正确位置
                        },
                        splitLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                });
                myChart.setOption(rightOption);
            } else {
                // 左侧图表配置
                var leftOption = Object.assign({}, baseConfig, {
                    grid: {
                        left: '10%',
                        right: '15%',
                        // top: '20%',
                        bottom: '10%',
                        containLabel: true
                    },
                    yAxis: {
                        type: 'category',
                        data: rankTypes,
                        position: 'left',  // 明确设置Y轴在左侧
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            color: '#fff',
                            position: 'left'  // 明确设置Y轴标签在左侧
                        },
                        axisLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            onZero: false  // 确保轴线在正确位置
                        },
                        splitLine: {
                            lineStyle: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                });
                myChart.setOption(leftOption);
            }
            
            // 响应式调整
            window.addEventListener('resize', function() {
                myChart.resize();
            });
        }
        
        // 开始初始化图表
        initChart();
    });
}

// 绘制产业排名图表（两个独立图表）
function drawIndustryRankCharts(country1, country2, year, industry) {
    // 绘制左侧国家图表
    drawSingleIndustryChart(country1, year, industry, 'industryRankChart1', false);
    // 绘制右侧国家图表（数轴方向朝负值）
    drawSingleIndustryChart(country2, year, industry, 'industryRankChart2', true);
}

// 更新国家数据
function updateCountryData(country1, country2, year) {
    
    // 加载国家1数据
    getCountryData(country1, year).then(function(country1Data) {
        if (country1Data) {
            // 显示国家名称
            $('#country1Name').text(country1Data.name);
            // 显示国家排名
            $('#country1Rank').text(country1Data.rank);
            // 显示上榜总频次
            $('#country1Freq').text(country1Data.freq || 0);
            // 加载国旗图片（使用缓存机制）
            loadFlagImage($('#country1Flag'), country1Data.code, country1Data.name);
        }
    });
    
    // 加载国家2数据
    getCountryData(country2, year).then(function(country2Data) {
        if (country2Data) {
            // 显示国家名称
            $('#country2Name').text(country2Data.name);
            // 显示国家排名
            $('#country2Rank').text(country2Data.rank);
            // 显示上榜总频次
            $('#country2Freq').text(country2Data.freq || 0);
            // 加载国旗图片（使用缓存机制）
            loadFlagImage($('#country2Flag'), country2Data.code, country2Data.name);
        }
    });
    
    // 更新产业排名图表 - 确保图表容器已经渲染完成
    setTimeout(function() {
        var industry = $('.industry-btn.active').attr('data-industry') || '未来信息';
        drawIndustryRankCharts(country1, country2, year, industry);
    }, 50);
}

// 页面加载完成后执行
// 修改初始化逻辑，确保只在一个地方初始化
$(document).ready(function() {
    // 从URL获取参数
    getUrlParams();
    
    // 预加载常用国家的国旗图片
    preloadFlagImages();
    
    // 更新国家标题和国旗
    updateCountryInfo(country1, country2);
    
    // 加载数据
    updateCountryData(country1, country2, selectedYear);
    
    // 生成国家选择器选项
    generateCountrySelectOptions('country1Select', country1, selectedYear);
    generateCountrySelectOptions('country2Select', country2, selectedYear);
    
    // 生成产业按钮
    generateIndustryButtons(selectedYear, selectedIndustry);
    
    // 加载企业数据
    loadIndustryRankData();
    
    // 初始化事件监听器
    initEventListeners();
});

// 企业数据相关变量
let industryRankData = null;

// 加载企业数据
function loadIndustryRankData() {
    fetch('./json/global_innovation_index_rankings.json')
        .then(response => response.json())
        .then(data => {
            industryRankData = data;
            // 初始加载时渲染表格
            renderEnterpriseTables();
        })
        .catch(error => {
            console.error('加载产业排名数据失败:', error);
        });
}

// 渲染企业数据表格
function renderEnterpriseTables() {
    if (!industryRankData) return;
    
    const year = selectedYear;
    const industry = selectedIndustry;
    
    // 检查数据是否存在
    if (!industryRankData[year] || !industryRankData[year][industry]) {
        console.error('未找到对应年份和产业的数据');
        return;
    }
    
    const industryData = industryRankData[year][industry];
    
    // 分别渲染两个国家的表格
    renderEnterpriseTable('country1EnterpriseTable', country1, industryData);
    renderEnterpriseTable('country2EnterpriseTable', country2, industryData);
}

// 渲染单个国家的企业数据表格
function renderEnterpriseTable(tableId, countryName, industryData) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) return;
    
    // 清空表格内容
    tableBody.innerHTML = '';
    
    // 过滤当前国家的数据
    const countryData = industryData.filter(item => {
        // 处理"中国"和"中国大陆"的匹配
        if (countryName === "中国" && item[2] === "中国大陆") return true;
        if (countryName === "中国大陆" && item[2] === "中国") return true;
        // 直接匹配
        return item[2] === countryName;
    });
    
    // 渲染表格行
    countryData.forEach(item => {
        const row = document.createElement('tr');
        
        // 排名、企业、综合得分、知识创新、技术创新、创新协作
        // 对应索引: 0, 1, 3, 4, 5, 6
        const cells = [
            item[0],  // 排名
            item[1],  // 企业
            item[3],  // 综合得分
            item[4],  // 知识创新
            item[5],  // 技术创新
            item[6]   // 创新协作
        ];
        
        cells.forEach(cellData => {
            const cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

// 更新图表和表格
function updateCharts() {
    // 更新图表
    drawIndustryRankCharts(country1, country2, selectedYear, selectedIndustry);
    
    // 更新企业数据表格
    renderEnterpriseTables();
}