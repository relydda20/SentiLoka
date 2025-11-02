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
    enabled: false, // Remove percentage labels on the chart
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

export const columnChartConfig = (totalReviews) => ({
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
    formatter: function (val) {
      const percentage = ((val / totalReviews) * 100).toFixed(1);
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
      formatter: function (val) {
        const percentage = ((val / totalReviews) * 100).toFixed(1);
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
  stroke: { width: 2, curve: "smooth" },
  markers: { size: 0 },
  yaxis: { title: { text: "Review Count" } },
  xaxis: { type: "datetime" },
  tooltip: {
    shared: true,
    intersect: false,
    y: { formatter: (val) => val.toFixed(0) },
  },
  colors: ["#00C853", "#FFD600", "#D50000"],
};
