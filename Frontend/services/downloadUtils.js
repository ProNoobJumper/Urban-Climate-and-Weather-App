import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const downloadData = (data, format = "xlsx") => {
  if (!data) return;

  if (format === "xlsx") {
    downloadXLSX(data);
  } else if (format === "csv") {
    downloadCSV(data);
  }
};

const downloadXLSX = (data) => {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ["Location", data.location],
    ["Latitude", data.lat],
    ["Longitude", data.lng],
    ["Timestamp", data.timestamp],
    [],
    ["Insights"],
    ...data.insights.map((i) => [i.type, i.message]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // 2. Current Metrics (Matrix)
  const matrixRows = [];
  matrixRows.push([
    "Metric",
    "Source",
    "Value",
    "Unit",
    "Status",
    "Last Updated",
  ]);
  data.matrix.forEach((metric) => {
    metric.data.forEach((source) => {
      matrixRows.push([
        metric.label,
        source.displayName,
        source.value,
        source.unit,
        source.status,
        source.lastUpdated,
      ]);
    });
  });
  const matrixSheet = XLSX.utils.aoa_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, matrixSheet, "Current Metrics");

  // 3. AQI Breakdown
  if (data.aqiBreakdown && data.aqiBreakdown.length > 0) {
    const aqiRows = [["Source", "AQI", "PM2.5", "PM10", "NO2", "Status"]];
    data.aqiBreakdown.forEach((item) => {
      aqiRows.push([
        item.source,
        item.aqiValue,
        item.pm25,
        item.pm10,
        item.no2,
        item.status,
      ]);
    });
    const aqiSheet = XLSX.utils.aoa_to_sheet(aqiRows);
    XLSX.utils.book_append_sheet(wb, aqiSheet, "AQI Breakdown");
  }

  // 4. Forecast
  if (data.forecast) {
    const forecastRows = [["Timestamp", "Metric", "Source", "Value"]];
    Object.entries(data.forecast).forEach(([metric, values]) => {
      values.forEach((val) => {
        // val has timestamp and sources
        Object.keys(val).forEach((key) => {
          if (key !== "timestamp") {
            forecastRows.push([val.timestamp, metric, key, val[key]]);
          }
        });
      });
    });
    const forecastSheet = XLSX.utils.aoa_to_sheet(forecastRows);
    XLSX.utils.book_append_sheet(wb, forecastSheet, "Forecast");
  }

  // 5. History (24h)
  if (data.history) {
    const historyRows = [["Timestamp", "Metric", "Source", "Value"]];
    Object.entries(data.history).forEach(([metric, timeScales]) => {
      if (timeScales["24h"]) {
        timeScales["24h"].forEach((val) => {
          Object.keys(val).forEach((key) => {
            if (key !== "timestamp") {
              historyRows.push([val.timestamp, metric, key, val[key]]);
            }
          });
        });
      }
    });
    const historySheet = XLSX.utils.aoa_to_sheet(historyRows);
    XLSX.utils.book_append_sheet(wb, historySheet, "History (24h)");
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([wbout], { type: "application/octet-stream" }),
    `${data.location}_weather_data.xlsx`
  );
};

const downloadCSV = (data) => {
  // For CSV, we'll just download the Current Metrics as it's the most relevant flat data
  const headers = [
    "Metric",
    "Source",
    "Value",
    "Unit",
    "Status",
    "Last Updated",
  ];
  const rows = [headers];

  data.matrix.forEach((metric) => {
    metric.data.forEach((source) => {
      rows.push([
        metric.label,
        source.displayName,
        source.value,
        source.unit,
        source.status,
        source.lastUpdated,
      ]);
    });
  });

  const csvContent = rows.map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${data.location}_current_metrics.csv`);
};
