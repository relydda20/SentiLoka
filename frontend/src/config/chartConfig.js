export const pieChartConfig = {
  chart: {
    type: "donut",
  },
  labels: ["Positive", "Neutral", "Negative"],
  colors: ["#00C853", "#FFD600", "#D50000"],
  legend: {
    position: "bottom",
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 300,
        },
        legend: {
          position: "bottom",
        },
      },
    },
  ],
  dataLabels: {
    enabled: true,
    formatter: function (val) {
      return val.toFixed(1) + "%";
    },
  },
};

export const littlePieChartConfig = {
  chart: {
    type: "donut",
  },
  labels: ["Positive", "Neutral", "Negative"],
  colors: ["#00C853", "#FFD600", "#D50000"],
  legend: {
    show: false, // Hide the legend
  },
  plotOptions: {
    pie: {
      donut: {
        size: "50%", // Makes the donut thicker by reducing the inner circle
      },
    },
  },
  dataLabels: {
    enabled: true, // Remove percentage labels on the chart
    style: {
      colors: ["#DCE2BE "],
    },
  },
  stroke: {
    width: 0, // Remove borders between segments
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val) {
        return val + " reviews";
      },
    },
  },
};

export const columnChartConfig = (ratingData) => ({
  chart: {
    type: "bar",
    height: 350,
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      dataLabels: {
        position: "top",
      },
    },
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      const dataIndex = opts.dataPointIndex;
      const percentage = ratingData[dataIndex]?.percentage || 0;
      return val + " (" + percentage + "%)";
    },
    offsetY: -20,
    style: {
      fontSize: "11px",
      colors: ["#304758"],
    },
  },
  xaxis: {
    categories: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    position: "bottom",
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      show: true,
      formatter: function (val) {
        return val;
      },
    },
  },
  colors: ["#2196F3"],
  tooltip: {
    y: {
      formatter: function (val, opts) {
        const dataIndex = opts.dataPointIndex;
        const percentage = ratingData[dataIndex]?.percentage || 0;
        return val + " reviews (" + percentage + "%)";
      },
    },
  },
});

export const lineChartConfig = {
  chart: {
    type: "line",
    height: 350,
    zoom: { type: "x", enabled: true, autoScaleYaxis: true },
    toolbar: { autoSelected: "zoom" },
  },
  stroke: { width: 3, curve: "smooth" },
  markers: { 
    size: 5,
    hover: {
      size: 7
    }
  },
  yaxis: { 
    title: { text: "Cumulative Review Count" },
    labels: {
      formatter: function(val) {
        return Math.floor(val);
      }
    }
  },
  xaxis: { 
    type: "datetime",
    labels: {
      datetimeUTC: false,
      format: 'dd MMM'
    }
  },
  tooltip: {
    shared: true,
    intersect: false,
    x: {
      format: 'dd MMM yyyy'
    },
    y: { 
      formatter: (val) => val ? val.toFixed(0) + ' reviews' : '0 reviews'
    },
    custom: function({ series, seriesIndex, dataPointIndex, w }) {
      const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      let tooltipContent = `<div class="apexcharts-tooltip-title" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px;">${formattedDate}</div>`;
      
      // Show all three sentiment types with cumulative counts
      const labels = ['Positive Reviews', 'Neutral Reviews', 'Negative Reviews'];
      const colors = ['#00C853', '#FFD600', '#D50000'];
      
      labels.forEach((label, idx) => {
        const value = series[idx] && series[idx][dataPointIndex] !== undefined 
          ? series[idx][dataPointIndex] 
          : 0;
        
        tooltipContent += `
          <div class="apexcharts-tooltip-series-group" style="order: ${idx + 1}; display: flex; align-items: center; padding: 3px 10px;">
            <span class="apexcharts-tooltip-marker" style="background-color: ${colors[idx]}; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;"></span>
            <div class="apexcharts-tooltip-text" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px;">
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-y-label">${label}: </span>
                <span class="apexcharts-tooltip-text-y-value" style="font-weight: bold;">${value} total</span>
              </div>
            </div>
          </div>
        `;
      });
      
      return `<div class="apexcharts-tooltip-custom">${tooltipContent}</div>`;
    }
  },
  colors: ["#00C853", "#FFD600", "#D50000"],
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'center',
    markers: {
      width: 12,
      height: 12,
      radius: 6
    }
  }
};
