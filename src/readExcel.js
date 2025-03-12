//读取2025年度收入支出表.xlsx 的数据
const xlsx = require('node-xlsx');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, '../public/2025年度收入支出表.xlsx');
const workSheetsFromFile = xlsx.parse(filePath);
let month1 = workSheetsFromFile[1].data;
let month2 = workSheetsFromFile[2].data;
let month3 = workSheetsFromFile[3].data;


function excelDateToJSDate(excelDate) {
    // Excel的日期起始点是1900年1月1日
    const EXCEL_DATE_OFFSET = 25569;
    const MS_PER_DAY = 86400000;

    // 将Excel日期转换为JavaScript时间戳
    const timestamp = (excelDate - EXCEL_DATE_OFFSET) * MS_PER_DAY;
    const date = new Date(timestamp);

    // 格式化日期为YYYY-MM-DD
    return date.toISOString().split('T')[0];
}

function parseExcelData(data) {
    const result = [];
    let currentDate = null;

    // 从第3行开始处理数据，忽略标题和表头
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        // 处理日期：如果为空，使用上一个有效日期
        if (row[0] !== undefined && row[0] !== null && row[0] !== '') {
            currentDate = excelDateToJSDate(row[0]);
        }

        // 添加当前行的日常支出记录
        if (row[1] && row[2] && row[3] !== undefined && row[4]) {
            result.push({
                date: currentDate,
                detail: row[1],
                type: row[2].trim(),
                amount: row[3],
                user: row[4]
            });
        }

        // 检查同一行是否还有固定支出数据
        if (row[6] && row[7] && row[8] !== undefined && row[9]) {
            result.push({
                date: currentDate,
                detail: row[6],
                type: row[7],
                amount: row[8],
                user: row[9]
            });

            console.log(result);
        }
    }

    return result;
}

// 假设excelData是你提供的数据
const month1Data = parseExcelData(month1);
const month2Data = parseExcelData(month2);
const month3Data = parseExcelData(month3);

// 将两个月的数据合并
const allData = [...month1Data, ...month2Data, ...month3Data];

// 将合并后的数据写入到allData.json文件中
fs.writeFileSync('allData.json', JSON.stringify(allData, null, 2));

