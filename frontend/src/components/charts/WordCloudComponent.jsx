import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

const MAX_WORDS = 100; // Configurable limit

const WordCloudComponent = ({ words, maxWords = MAX_WORDS }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 350 });
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
    value: 0,
  });

  // Handle responsive dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      const width = container.offsetWidth;
      const height = 350;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !words || words.length === 0) return;

    const { width, height } = dimensions;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    // Sort by value and limit to top N words
    const topWords = [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords);

    // Calculate font size scale based on container width
    const fontScale = width / 900;

    const layout = cloud()
      .size([width, height])
      .words(topWords.map((d) => ({ text: d.text, size: d.value })))
      .padding(8)
      .rotate(() => 0)
      .fontSize((d) => Math.sqrt(d.size) * 5 * fontScale)
      .on("end", draw);

    layout.start();

    function draw(words) {
      const colors = ["#2F4B4E", "#4A6C6F", "#658D91", "#80AEB2", "#9BCFD4"];

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      g.selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Arial")
        .style("fill", (d, i) => colors[i % colors.length])
        .style("cursor", "pointer")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .text((d) => d.text)
        .on("mouseenter", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", "#CCD5AE")
            .style("font-weight", "bold");

          const rect = containerRef.current.getBoundingClientRect();
          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            text: d.text,
            value: d.size,
          });
        })
        .on("mousemove", function (event) {
          const rect = containerRef.current.getBoundingClientRect();
          setTooltip((prev) => ({
            ...prev,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          }));
        })
        .on("mouseleave", function (event, d) {
          const i = words.indexOf(d);
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", colors[i % colors.length])
            .style("font-weight", "normal");

          setTooltip((prev) => ({ ...prev, visible: false }));
        });
    }
  }, [words, dimensions, maxWords]);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-center w-full h-[350px]"
    >
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="z-10 absolute bg-gray-800 shadow-lg px-3 py-2 rounded-lg text-white text-sm pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 30}px`,
            transform: "translate(0, -100%)",
          }}
        >
          <div className="font-semibold">{tooltip.text}</div>
          <div className="text-gray-300 text-xs">Count: {tooltip.value}</div>
        </div>
      )}
    </div>
  );
};

export default WordCloudComponent;
