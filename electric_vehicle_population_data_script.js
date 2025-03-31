// 主题切换功能
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    
    // 检查系统主题偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }

    // 主题切换按钮点击事件
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // 初始化图表
    initCharts();
});

// 初始化所有图表
async function initCharts() {
    try {
        // 加载压缩的CSV数据
        const response = await fetch('Electric_Vehicle_Population_Data.csv.gz');
        const compressedData = await response.arrayBuffer();
        // 使用pako解压缩数据
        const inflated = pako.inflate(new Uint8Array(compressedData), { to: 'string' });
        const data = await parseCSV(inflated);

        // 初始化各个图表
        createTeslaYearlyTotalChart(data);
        createManufacturerTrendChart(data);
        createEnvironmentChart(data);
        createModelChart(data);
        createRegionMap(data);
        createElectricUtilityChart(data);
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// CSV解析函数
function parseCSV(csvText) {
    return new Promise((resolve) => {
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                resolve(results.data);
            }
        });
    });
}

// 制造商趋势图表
function createManufacturerTrendChart(data) {
    const ctx = document.getElementById('manufacturer-trend-chart').getContext('2d');
    const manufacturerCounts = {};

    // 统计各制造商的车辆数量
    data.forEach(row => {
        const manufacturer = row['Make'] || 'Unknown';
        manufacturerCounts[manufacturer] = (manufacturerCounts[manufacturer] || 0) + 1;
    });

    // 获取前10大制造商
    const topManufacturers = Object.entries(manufacturerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // 计算其他制造商的总数和数量
    const otherManufacturersData = Object.entries(manufacturerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(10);
    const otherManufacturersCount = otherManufacturersData.length;
    const otherManufacturersTotal = otherManufacturersData.reduce((sum, [_, count]) => sum + count, 0);

    // 将其他制造商添加到数据中
    const otherLabel = document.documentElement.lang === 'en' ? 
        `Other ${otherManufacturersCount} Manufacturers` : 
        `其他${otherManufacturersCount}个制造商`;
    const allManufacturers = [...topManufacturers, [otherLabel, otherManufacturersTotal]];

    if (window.manufacturerTrendChart) {
        window.manufacturerTrendChart.destroy();
    }

    window.manufacturerTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allManufacturers.map(m => m[0]),
            datasets: [{
                label: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量',
                data: allManufacturers.map(m => m[1]),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en' ? 'Manufacturer Distribution' : '制造商分布',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量';
                            return `${label}: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Manufacturer' : '制造商'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                }
            }
        }
    });
}

// 环保效益分析图表
function createEnvironmentChart(data) {
    const ctx = document.getElementById('environment-chart').getContext('2d');
    
    // 按年份统计纯电动和混合动力车辆数量
    const yearlyData = {};
    data.forEach(row => {
        const year = parseInt(row['Model Year']);
        if (!isNaN(year) && year >= 1999 && year <= 2025) {
            if (!yearlyData[year]) {
                yearlyData[year] = { electric: 0, hybrid: 0 };
            }
            if (row['Electric Vehicle Type'] === 'Battery Electric Vehicle (BEV)') {
                yearlyData[year].electric++;
            } else if (row['Electric Vehicle Type'] === 'Plug-in Hybrid Electric Vehicle (PHEV)') {
                yearlyData[year].hybrid++;
            }
        }
    });

    // 将数据转换为图表所需格式
    const years = Object.keys(yearlyData).sort((a, b) => parseInt(a) - parseInt(b));
    const electricData = years.map(year => yearlyData[year].electric);
    const hybridData = years.map(year => yearlyData[year].hybrid);

    if (window.environmentChart) {
        window.environmentChart.destroy();
    }

    window.environmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: document.documentElement.lang === 'en' ? 'Plug-in Hybrid' : '插电式混合动力',
                    data: hybridData,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                },
                {
                    label: document.documentElement.lang === 'en' ? 'Battery Electric' : '纯电动',
                    data: electricData,
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en'? 'Electric Vehicle Type Distribution' : '电动汽车类型分布',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const labelText = document.documentElement.lang === 'en' ? 
                                `${context.dataset.label}: ${context.parsed.y.toLocaleString()} vehicles` : 
                                `${context.dataset.label}: ${context.parsed.y.toLocaleString()} 辆`;
                            return labelText;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Year' : '年份'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                }
            }
        }
    });

}

// 车型分布图表
function createModelChart(data) {
    const ctx = document.getElementById('model-chart').getContext('2d');
    const modelCounts = {};

    data.forEach(row => {
        const model = row['Model'] || 'Unknown';
        modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    const topModels = Object.entries(modelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (window.modelChart) {
        window.modelChart.destroy();
    }

    window.modelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topModels.map(m => m[0]),
            datasets: [{
                label: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量',
                data: topModels.map(m => m[1]),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en' ? 'Popular Model Distribution' : '热门车型分布',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量';
                            return `${label}: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Model' : '车型'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                }
            }
        }
    });
}

// 特斯拉年度电动车总量统计图表
function createTeslaYearlyTotalChart(data) {
    console.log('开始创建特斯拉年度统计图表');
    const ctx = document.getElementById('tesla-yearly-total-chart');
    if (!ctx) {
        console.error('未找到tesla-yearly-total-chart元素');
        return;
    }
    const context = ctx.getContext('2d');
    if (!context) {
        console.error('无法获取canvas上下文');
        return;
    }
    console.log('成功获取canvas上下文');
    
    const teslaYearCounts = {};
    const otherYearCounts = {};
    console.log('原始数据条数:', data.length);

    // 统计特斯拉和其他制造商每年的车辆数量
    data.forEach(row => {
        const year = parseInt(row['Model Year']);
        if (!isNaN(year) && year >= 1999 && year <= 2025) {
            if (row['Make'] === 'TESLA') {
                teslaYearCounts[year] = (teslaYearCounts[year] || 0) + 1;
            } else {
                otherYearCounts[year] = (otherYearCounts[year] || 0) + 1;
            }
        }
    });
    
    // 将数据转换为数组并排序
    const years = [...new Set([...Object.keys(teslaYearCounts), ...Object.keys(otherYearCounts)])].sort((a, b) => parseInt(a) - parseInt(b));
    const teslaCounts = years.map(year => teslaYearCounts[year] || 0);
    const otherCounts = years.map(year => otherYearCounts[year] || 0);
    
    console.log('处理后的数据 - 年份:', years);
    console.log('处理后的数据 - 特斯拉数量:', teslaCounts);
    console.log('处理后的数据 - 其他制造商数量:', otherCounts);

    if (window.teslaYearlyChart) {
        window.teslaYearlyChart.destroy();
    }

    window.teslaYearlyChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: document.documentElement.lang === 'en' ? 'Other Manufacturers' : '其他制造商',
                    data: otherCounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                },
                {
                    label: document.documentElement.lang === 'en' ? 'Tesla' : '特斯拉',
                    data: teslaCounts,
                    backgroundColor: 'rgba(234, 88, 12, 0.5)',
                    borderColor: 'rgb(234, 88, 12)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en' ? 'Tesla vs Other Manufacturers Annual Statistics' : '特斯拉与其他制造商年度统计',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} 辆`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Year' : '年份'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                }
            }
        }
    });
}

// 电力公司分布图表
function createElectricUtilityChart(data) {
    console.log('开始创建电力公司分布图表');
    const ctx = document.getElementById('utility-chart').getContext('2d');
    if (!ctx) {
        console.error('未找到utility-chart元素');
        return;
    }
    console.log('成功获取canvas上下文');
    const utilityCounts = {};

    // 统计各电力公司的电动车数量
    data.forEach(row => {
        let utility = row['Electric Utility'] || 'Unknown';
        // 提取主要电力公司名称（去除城市等附加信息）
        if (utility.includes('||')) {
            utility = utility.split('||')[0].trim();
        }
        // 统一化处理公司名称
        utility = utility.toUpperCase();
        utilityCounts[utility] = (utilityCounts[utility] || 0) + 1;
    });
    console.log('电力公司数据统计:', utilityCounts);

    // 获取前10个电力公司
    const topUtilities = Object.entries(utilityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    console.log('前10个电力公司:', topUtilities);

    if (window.electricUtilityChart) {
        window.electricUtilityChart.destroy();
    }

    window.electricUtilityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topUtilities.map(u => u[0]),
            datasets: [{
                label: '车辆数量',
                data: topUtilities.map(u => u[1]),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en' ? 'Electric Utility Service Area Distribution' : '电力公司服务区域分布',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量';
                            return `${label}: ${context.parsed.x.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Electric Utility' : '电力公司'
                    }
                }
            }
        }
    });
}

// 地区分布图表
function createRegionMap(data) {
    console.log('开始创建地区分布图表');
    const container = document.getElementById('region-map');
    if (!container) {
        console.error('未找到region-map元素');
        return;
    }

    // 清空容器并添加canvas
    container.innerHTML = '<canvas></canvas>';
    const ctx = container.querySelector('canvas').getContext('2d');
    if (!ctx) {
        console.error('无法获取canvas上下文');
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
                    <p class="text-gray-500">无法加载图表</p>
                </div>
            </div>
        `;
        return;
    }

    // 统计各县区的电动车数量
    const countyData = {};
    data.forEach(vehicle => {
        const county = vehicle['County'];
        if (county) {
            countyData[county] = (countyData[county] || 0) + 1;
        }
    });

    // 获取前10个县区
    const top10Counties = Object.entries(countyData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // 创建渐变色
    const getColor = (index) => {
        const hue = 200; // 蓝色基调
        const saturation = 80;
        const lightness = Math.max(30, 80 - (index * 5)); // 从浅到深
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // 创建图表
    if (window.regionChart) {
        window.regionChart.destroy();
    }

    window.regionChart = new Chart(ctx, {        type: 'bar',
        data: {            labels: top10Counties.map(county => county[0]),
            datasets: [{
                label: '车辆数量',
                data: top10Counties.map(county => county[1]),
                backgroundColor: top10Counties.map((_, index) => getColor(index)),
                borderColor: top10Counties.map((_, index) => getColor(index)),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: document.documentElement.lang === 'en' ? 'Washington State EV Regional Distribution' : '华盛顿州电动汽车地区分布',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量';
                            return `${label}: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'County' : '县区'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: document.documentElement.lang === 'en' ? 'Vehicle Count' : '车辆数量'
                    }
                }
            }
        }
    });
}