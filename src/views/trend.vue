<template>
  <div class="trend-chart">
    <div class="query">
      <el-date-picker
          size="small"
        v-model="queryMap.date"
        type="daterange"
        placeholder="选择月份">
      </el-date-picker>
      <el-button size="small" type="primary" @click="onQuery" style="margin-left: 16px;">查询</el-button>
    </div>

    <div class="panel">
      <div class="panel-title">每日话费趋势图</div>
      <div class="chart day-chart"></div>
    </div>

    <!-- 新增饼图面板 -->
    <div class="panel">
      <div class="panel-title">支出类型占比</div>
      <div class="chart pie-chart"></div>
    </div>

    <!-- 新增类别月度对比图 -->
    <div class="panel">
      <div class="panel-title">类别月度支出对比</div>
      <div class="chart month-category-chart"></div>
    </div>
    
    <!-- 添加明细抽屉 -->
    <el-drawer
      title="明细数据"
      :with-header="false"
      :visible.sync="drawerVisible"
      direction="rtl"
      size="50%">
      <div class="drawer-content">
        <h3>{{ drawerTitle }}</h3>
        <el-table
          size="small"
          :data="detailData"
          border>
          <el-table-column align="center" prop="date" label="日期"></el-table-column>
          <el-table-column align="center" prop="type" label="类型"></el-table-column>
          <el-table-column align="center" prop="detail" label="明细" show-overflow-tooltip></el-table-column>
          <el-table-column align="center" prop="amount" label="金额" width="100"></el-table-column>
          <el-table-column align="center" prop="user" label="用户" width="100"></el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>
<script>
let amountData = require('../allData.json')
import * as echarts from 'echarts'
import moment from 'moment'
let end = moment().format('YYYY-MM-DD')
let start ='2025-01-01'
export default {
  name: 'TrendView',
  data:()=>({
    colorList:['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399','#409EFF','#67C23A','#E6A23C','#F56C6C','#909399'],
    queryMap:{
      date:[start,end],
    },
    chartInstances:{},
    // 添加抽屉相关数据
    drawerVisible: false,
    drawerTitle: '明细数据',
    detailData: []
  }),
  mounted() {
      this.drawChart('dayChart');
      this.drawChart('pieChart'); 
      this.drawChart('monthCategoryChart'); // 添加月度类别对比图
  },
  methods:{
    onQuery(){
      this.drawChart('dayChart');
      this.drawChart('pieChart');
      this.drawChart('monthCategoryChart'); // 更新月度类别对比图
    },
    // 显示明细抽屉
    showDetailDrawer(title, data) {
      this.drawerTitle = title;
      this.detailData = data;
      this.drawerVisible = true;
    },
    drawChart(type){
      // 准备数据
      let chartData = JSON.parse(JSON.stringify(amountData))
      chartData = chartData.filter(item => item.type !== '住房支出')
      let {date} = this.queryMap
      let startDate = moment(date[0]).format('YYYY-MM-DD')
      let endDate = moment(date[1]).format('YYYY-MM-DD')
      chartData = chartData.filter(item => new Date(item.date) >= new Date(startDate) && new Date(item.date) <= new Date(endDate))
      // 释放旧实例
      if(this.chartInstances[type]) this.chartInstances[type].dispose()
      
      // 准备公共配置
      const baseOption = {
        title: { text: '', left: 'center', show: false },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '60px', containLabel: true },
        dataZoom: [{ type: 'slider', start: 0, height: 10, end: 100 }],
      };
      
      let dom, option;
      
      if(type === 'dayChart'){
        dom = document.querySelector('.day-chart')
        
        // 准备数据
        let xData = Array.from(new Set(chartData.map(item => item.date)))
          .sort((a,b) => new Date(a) - new Date(b));
        
        let yData = xData.map(item => {
          let amount = chartData
            .filter(aItem => aItem.date === item)
            .reduce((total,current) => total + current.amount, 0);
          return amount.toFixed(2);
        });
        
        // 配置选项
        option = {
          ...baseOption,
          grid: { left: '50px', right: '80px', bottom: '40px', containLabel: true },
          xAxis: [{
            type: 'category',
            data: xData,
            name: '日期',
            axisLabel: { rotate: 45 }
          }],
          yAxis: [{ type: 'value', name: '金额(元)' }],
          series: [{
            name: '金额',
            type: 'bar',
            data: yData,
            color: '#409EFF',
            barMaxWidth: '50px',
            label: {
              show: true,
              position: [5, -10],
              rotate: 45,
              formatter: '{c} 元'
            }
          }]
        };
        
        // 初始化实例
        this.chartInstances[type] = echarts.init(dom);
        this.chartInstances[type].setOption(option);
        
        this.chartInstances[type].off('click')
        // 添加点击事件
        this.chartInstances[type].on('click', params => {
          const clickedDate = xData[params.dataIndex];
          const filteredData = chartData.filter(item => item.date === clickedDate);
          this.showDetailDrawer(`${clickedDate} 支出明细`, filteredData);
        });
      } 
      
      else if(type === 'pieChart'){
        dom = document.querySelector('.pie-chart');
        
        // 处理数据
        const typeAmounts = {};
        chartData.forEach(item => {
          if (!typeAmounts[item.type]) typeAmounts[item.type] = 0;
          typeAmounts[item.type] += parseFloat(item.amount);
        });
        
        const pieData = Object.keys(typeAmounts)
          .map(type => ({
            name: type,
            value: typeAmounts[type].toFixed(2)
          }))
          .sort((a, b) => b.value - a.value);
        
        // 配置选项
        option = {
          ...baseOption,
          tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}元 ({d}%)' },
          legend: {
            orient: 'vertical',
            left: 'left',
            data: pieData.map(item => item.name)
          },
          series: [{
            name: '支出金额',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '60%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: params => `${params.name}: ${params.value}元`
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: { show: true },
            data: pieData
          }]
        };
        
        // 初始化实例
        this.chartInstances[type] = echarts.init(dom);
        this.chartInstances[type].setOption(option);
        this.chartInstances[type].off('click')
        // 添加点击事件
        this.chartInstances[type].on('click', params => {
          const clickedType = params.name;
          const filteredData = chartData.filter(item => item.type === clickedType);
          this.showDetailDrawer(`${clickedType} 支出明细`, filteredData);
        });
      }
      
      else if(type === 'monthCategoryChart'){
        dom = document.querySelector('.month-category-chart');
        
        // 处理数据
        const monthsData = {};
        chartData.forEach(item => {
          const month = moment(item.date).format('YYYY-MM');
          if (!monthsData[month]) monthsData[month] = {};
          if (!monthsData[month][item.type]) monthsData[month][item.type] = 0;
          monthsData[month][item.type] += parseFloat(item.amount);
        });
        
        const allTypes = Array.from(new Set(chartData.map(item => item.type)));
        const allMonths = Object.keys(monthsData).sort();
        
        // 构建系列数据
        const seriesData = allMonths.map((month,idx) => ({
          name: month,
          type: 'bar',
          label: {
            show: true,
            position: 'top',
            formatter: '{c} 元',
            rotate: 45,
            position: [5, -10]
          },
          barMaxWidth: '50px',
          data: allTypes.map(type => {
            return monthsData[month][type] ? parseFloat(monthsData[month][type].toFixed(2)) : 0;
          }),
          color: this.colorList[idx]
        }));
        
        // 配置选项
        option = {
          ...baseOption,
          legend: {
            data: allMonths,
            top: 'top'
          },
          xAxis: {
            type: 'category',
            data: allTypes,
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            name: '金额(元)'
          },
          series: seriesData
        };
        
        // 初始化实例
        this.chartInstances[type] = echarts.init(dom);
        this.chartInstances[type].setOption(option);
        this.chartInstances[type].off('click')
        // 添加点击事件
        this.chartInstances[type].on('click', params => {
          const clickedType = allTypes[params.dataIndex];
          const clickedMonth = params.seriesName;
          const filteredData = chartData.filter(item => {
            return item.type === clickedType && moment(item.date).format('YYYY-MM') === clickedMonth;
          });
          this.showDetailDrawer(`${clickedMonth} ${clickedType} 支出明细`, filteredData);
        });
      }
    }
  }
}
</script>

<style scoped lang="scss">
.trend-chart{
  .query{
    // padding: 10px 20px;
    margin-bottom: 20px;
    .el-date-picker{
      margin-right: 10px;
    }
  }
  .panel{
    border: 1px solid #d1dbe5;
    margin-bottom: 20px;
    .panel-title{
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
      padding: 10px 16px;
      background-color: #eee;
    }
    .chart {
      height: 400px;
    }
  }
  // 添加抽屉内容样式
  .drawer-content {
    padding: 20px;
    h3 {
      margin-bottom: 20px;
      font-size: 18px;
    }
  }
}
</style>
