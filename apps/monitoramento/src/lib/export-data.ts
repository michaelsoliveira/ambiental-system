'use client';
"use strict";
exports.__esModule = true;
exports.exportToCSV = void 0;
var papaparse_1 = require("papaparse");
function convertToCSV(data: any, config: any) {
    if (data.length === 0) {
        throw new Error('Data array is empty');
    }
    // Extract column names from the first row (object keys)
    var columns = Object.keys(data[0]);
    // Convert data array to array of arrays
    var dataArray = [];
    dataArray.push(columns);
    data.forEach(function (obj: any) {
        var values = columns.map(function (col) { return obj[col]; });
        dataArray.push(values);
    });
    return papaparse_1["default"].unparse(dataArray, config);
}
function convertToISO88591(text: any) {
    var encoder = new TextEncoder();
    return encoder.encode(text);
}
function exportToCSV(data: any, filename: any, config: any) {
    var csvData = convertToCSV(data, config);
    //var link;
    var encoding = (config === null || config === void 0 ? void 0 : config.encoding) ? config === null || config === void 0 ? void 0 : config.encoding : 'utf-8';
    if (csvData == null)
        return;
    filename = filename || 'export.csv';
    var csvBlob = new Blob([csvData], { type: "text/csv;charset=" + encoding + ";" });
    var url = URL.createObjectURL(csvBlob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
exports.exportToCSV = exportToCSV;
