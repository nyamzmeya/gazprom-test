// Импорт данных
import data from "./data.js";

let xAxis = ["Май", "Апрель", "Июнь", "Июль", "Август", "Сентябрь"];
let filters = [
  "В программе ИТ",
  "В программе ЦП",
  "Вне программ ИТ",
  "Вне программ ЦП",
];

// Переменные в которых хранятся суммы для отображения и максимум для выставления max height контейнера
let out_array = [];
let in_array = [];
let max = 0;

// Сериализация данных
let serialised_data = filters.map((filter) => {
  let current_data = { name: filter, data: [] };
  xAxis.forEach((period) => {
    current_data.data.push(
      data.filter((item) => item.period === period && item.name === filter)[0]
        .value
    );
  });
  return current_data;
});

// Функция для подсчета сумм отображающихся наверху
function sum(params) {
  max = 0;
  for (let z = 0; z < serialised_data[0].data.length; z++) {
    let out_result = 0;
    let in_result = 0;
    for (let i = 0; i < serialised_data.length; i++) {
      if ((params && params.selected[serialised_data[i].name]) || !params) {
        if (serialised_data[i].name.indexOf("Вне") == 0) {
          out_result += serialised_data[i].data[z];
        } else {
          in_result += serialised_data[i].data[z];
        }
      }
    }
    max = Math.max(max, out_result);
    max = Math.max(max, in_result);
    out_array.push(out_result);
    in_array.push(in_result);
  }
}

sum();

// Функция для форматирования tooltip

let tooltipFormatter = (params) => {
  let out_programs = params.filter(
    (param) => param.seriesName.indexOf("Вне") == 0
  );
  let in_programs = params.filter(
    (param) => param.seriesName.indexOf("Вне") == -1
  );
  let out_programs_sum = out_programs.reduce(
    (acc, item) => acc + item.value,
    0
  );
  let in_programs_sum = in_programs.reduce((acc, item) => acc + item.value, 0);
  return `
 <div class="tooltip">
 <div class="tooltip_heading extra_bold">${params[0].name} 2022:</div> 
${
  in_programs.length != 0
    ? `<div class="tooltip_subheading">
      <span class="bold">В программе</span>
      <span class="extra_bold">${Math.floor(
        (in_programs_sum * 100) / (in_programs_sum + out_programs_sum)
      )}%<span>&#124;</span> ${in_programs_sum} шт.
      </span>
    </div>`
    : ""
}
${in_programs
  .map((program) => {
    return `<div>
    <span>${program.marker}${program.seriesName}</span>
    <span class="extra_bold">${program.value} шт.</span>
  </div>`;
  })
  .join("")}
${
  out_programs.length != 0
    ? `<div class="tooltip_subheading">
      <span class="bold">Вне программ</span>
      <span class="extra_bold">${Math.floor(
        (out_programs_sum * 100) / (out_programs_sum + in_programs_sum)
      )}%<span>&#124;</span> ${out_programs_sum} шт.
      </span>
    </div>`
    : ""
}
${out_programs
  .map(
    (program) =>
      `<div>
    <span>${program.marker}${program.seriesName}</span>
    <span class="extra_bold">${program.value} шт.</span>
  </div>`
  )
  .join("")}`;
};

let colors = {
  "В программе ИТ": "#0078D2",
  "В программе ЦП": "#56B9F2",
  "Вне программ ИТ": "#00724C",
  "Вне программ ЦП": "#22C38E",
  text: "#002033",
};

// Инициализация
let myChart = echarts.init(document.getElementById("main"));

// Опции

let getOption = () => {
  return {
    title: {
      text: "Проекты в программах и вне программ",
      subtext:
        "Сумма и процентное соотношение проектов, находящихся в программах и вне программ",
      textStyle: {
        fontWeight: 600,
        fontSize: 16,
        color: colors.text,
      },
      subtextStyle: {
        fontSize: 14,
      },
    },
    grid: {
      top: 108,
    },
    textStyle: {
      fontFamily: "Inter",
      fontWeight: 400,
      fontSize: 12,
    },
    tooltip: {
      trigger: "axis",
      padding: 8,
      textStyle: {
        color: colors.text,
      },
      formatter: (params) => tooltipFormatter(params),
    },
    legend: { bottom: 0, icon: "circle" },
    xAxis: {
      data: xAxis,
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    yAxis: {
      max: function () {
        return Math.round(max / 100) * 100 + 100;
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    series: [
      ...serialised_data.map((item, index) => {
        return Object.assign(item, {
          type: "bar",
          stack: item.name.indexOf("Вне") == 0 ? "x" : "y",
          itemStyle: {
            normal: {
              color: colors[item.name],
            },
          },
        });
      }),
      {
        type: "bar",
        stack: "x",
        data: out_array,
        tooltip: {
          show: false,
        },
        color: "transparent",
        label: {
          normal: {
            show: true,
            position: "insideBottom",
            color: colors.text,
            fontWeight: 600,
            fontSize: 14,
            backgroundColor: "white",
            formatter: function (param) {
              return param.data == 0 ? "" : param.data;
            },
          },
        },
      },
      {
        type: "bar",
        stack: "y",
        data: in_array,
        tooltip: {
          show: false,
        },
        color: "transparent",
        label: {
          normal: {
            show: true,
            color: colors.text,
            fontWeight: 600,
            fontSize: 14,
            position: "insideBottom",
            formatter: function (param) {
              return param.data == 0 ? "" : param.data;
            },
          },
        },
      },
      ,
    ],
  };
};

// Подключение опций
myChart.setOption(getOption());
// Responsive size
window.addEventListener("resize", function () {
  myChart.resize();
});
// Пересчет сумм и переподключение опций при фильтре
myChart.on("legendselectchanged", function (params) {
  out_array = [];
  in_array = [];
  sum(params);
  myChart.setOption(getOption());
});
