import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

const WordCloudComponent = ({ words }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log("🎨 WordCloudComponent received words:", words);

    if (!words || !Array.isArray(words) || words.length === 0) {
      console.warn("WordCloud: No valid words data", words);
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // Get container size for responsive sizing
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect?.() || {
      width: 800,
      height: 400,
    };
    const width = Math.max(300, rect.width);
    const height = Math.max(300, rect.height || 400);

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Visual settings to match previous style
    const colors = [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
    ];
    const rotationAngles = [0, 90];
    const padding = 2;
    const fontFamily = 'Impact, "Arial Black", sans-serif';
    const fontSizeRange = [20, 60]; // min, max

    // Create scales: size scale uses sqrt to mimic previous scale: "sqrt"
    const values = words.map((w) => Number(w.value) || 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const sizeScale = d3
      .scaleSqrt()
      .domain([minVal === maxVal ? 0 : minVal, maxVal])
      .range(fontSizeRange)
      .clamp(true);

    const colorScale = d3.scaleOrdinal().range(colors);

    // Prepare cloud words
    const cloudWords = words.map((d) => ({
      text: String(d.text),
      value: Number(d.value),
      size: Math.max(
        fontSizeRange[0],
        Math.min(fontSizeRange[1], sizeScale(Number(d.value))),
      ),
    }));

    console.log("🎨 Cloud words prepared:", cloudWords);

    // Create word cloud layout
    const layout = cloud()
      .size([width, height])
      .words(cloudWords)
      .padding(padding)
      .rotate(() =>
        rotationAngles[Math.floor(Math.random() * rotationAngles.length)],
      )
      .font("Impact")
      .fontWeight("normal")
      .fontSize((d) => d.size)
      .spiral("archimedean") // explicit for clarity
      .on("end", draw);

    // Start layout
    layout.start();

    function draw(renderedWords) {
      console.log("🎨 Drawing words:", renderedWords.length);

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      // Enter selection with transition
      const text = g.selectAll("text").data(renderedWords, (d) => d.text);

      const entering = text
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .style("font-family", fontFamily)
        .style("font-weight", "normal")
        .style("fill", (d, i) => colorScale(i))
        .style("font-size", (d) => `${d.size}px`)
        .style("opacity", 0)
        .style("cursor", "pointer")
        .text((d) => d.text);

      // Tooltip via title
      entering
        .append("title")
        .text((d) => {
          const original = words.find(
            (w) => String(w.text) === String(d.text),
          );
          return `${d.text}: ${original?.value ?? 0} mentions`;
        });

      // Fade/scale-in effect
      entering
        .transition()
        .duration(1000) // transitionDuration ~ 1000ms
        .style("opacity", 1);

      // Hover effects
      g.selectAll("text")
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", "#ff6b6b")
            .style("font-size", `${d.size * 1.15}px`);
        })
        .on("mouseout", function (event, d) {
          // determine index to restore color
          const index = renderedWords.indexOf(d);
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", colorScale(index))
            .style("font-size", `${d.size}px`);
        })
        .on("click", (event, d) => {
          console.log("Clicked word:", d.text);
        });

      console.log("✅ Word cloud rendered successfully");
    }

    // Cleanup on unmount or next update
    return () => {
      layout.stop();
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [words]);

  if (!words || !Array.isArray(words) || words.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-full min-h-[300px]"
      >
        <p className="text-gray-500">No keyword data available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center bg-white"
      style={{ minHeight: "300px" }}
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default WordCloudComponent;
